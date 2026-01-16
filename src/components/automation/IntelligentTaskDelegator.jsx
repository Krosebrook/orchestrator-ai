import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function IntelligentTaskDelegator({ agents }) {
    const [delegations, setDelegations] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, avgTime: 0 });

    useEffect(() => {
        loadDelegations();
        const interval = setInterval(loadDelegations, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDelegations = async () => {
        try {
            const delegationsList = await base44.entities.TaskDelegation.list('-created_date', 50);
            setDelegations(delegationsList || []);

            const completed = delegationsList.filter(d => d.status === 'completed');
            const avgTime = completed.length > 0
                ? completed.reduce((sum, d) => sum + (d.completion_time_ms || 0), 0) / completed.length
                : 0;

            setStats({
                total: delegationsList.length,
                pending: delegationsList.filter(d => d.status === 'pending').length,
                completed: completed.length,
                avgTime: (avgTime / 1000).toFixed(1)
            });
        } catch (error) {
            console.error('Failed to load delegations:', error);
        }
    };

    const delegateTask = async (taskDescription) => {
        try {
            const [profiles, metrics, recommendations] = await Promise.all([
                base44.entities.AgentProfile.list(),
                base44.entities.AgentPerformanceMetric.list('-created_date', 500),
                base44.entities.TrainingRecommendation.list()
            ]);

            const agentWorkload = {};
            const agentPerformance = {};

            for (const agent of agents) {
                const agentMetrics = metrics.filter(m => m.agent_name === agent.name);
                const profile = profiles.find(p => p.agent_name === agent.name);
                const pendingTasks = delegations.filter(d => 
                    d.assigned_to === agent.name && 
                    (d.status === 'pending' || d.status === 'in_progress')
                ).length;

                agentWorkload[agent.name] = pendingTasks;
                agentPerformance[agent.name] = {
                    successRate: agentMetrics.length > 0 
                        ? (agentMetrics.filter(m => m.status === 'success').length / agentMetrics.length * 100).toFixed(0)
                        : 0,
                    avgResponseTime: agentMetrics.length > 0
                        ? agentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / agentMetrics.length
                        : 0,
                    strengths: profile?.strengths || [],
                    weaknesses: profile?.weaknesses || [],
                    specialties: profile?.specialty_areas || []
                };
            }

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this task and delegate to the best agent:

Task: "${taskDescription}"

Available Agents:
${agents.map(a => {
    const perf = agentPerformance[a.name];
    return `
${a.name}:
  - Description: ${a.description}
  - Current Workload: ${agentWorkload[a.name]} pending tasks
  - Success Rate: ${perf.successRate}%
  - Avg Response Time: ${(perf.avgResponseTime / 1000).toFixed(1)}s
  - Strengths: ${perf.strengths.join(', ') || 'None recorded'}
  - Weaknesses: ${perf.weaknesses.join(', ') || 'None recorded'}
  - Specialties: ${perf.specialties.join(', ') || 'General'}
`;
}).join('\n')}

Training Gaps:
${recommendations.map(r => `- ${r.agent_name}: ${r.title} (${r.priority} priority)`).join('\n')}

Analyze:
1. Task complexity (0-10)
2. Required skills
3. Best agent match considering workload, skills, and performance
4. Alternative agents ranked by suitability
5. Whether a team approach is better

Return the optimal assignment with reasoning.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        complexity_score: { type: "number" },
                        task_type: { type: "string" },
                        required_skills: { type: "array", items: { type: "string" } },
                        best_agent: { type: "string" },
                        assignment_reasoning: { type: "string" },
                        alternatives: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    agent_name: { type: "string" },
                                    score: { type: "number" },
                                    reasoning: { type: "string" }
                                }
                            }
                        },
                        team_recommended: { type: "boolean" },
                        priority: { type: "string" }
                    }
                }
            });

            const delegation = await base44.entities.TaskDelegation.create({
                task_description: taskDescription,
                task_type: result.task_type,
                complexity_score: result.complexity_score,
                assigned_to: result.best_agent,
                assignment_reasoning: result.assignment_reasoning,
                alternative_agents: result.alternatives,
                priority: result.priority,
                status: 'pending'
            });

            toast.success(`Task delegated to ${result.best_agent}`);
            await loadDelegations();
            return delegation;
        } catch (error) {
            console.error('Delegation failed:', error);
            toast.error('Failed to delegate task');
        }
    };

    const priorityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700'
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-600" />
                                Intelligent Task Delegation
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                AI-powered assignment based on skills, workload, and performance
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <div className="bg-white/60 p-3 rounded">
                            <p className="text-xs text-slate-600">Total Delegated</p>
                            <p className="text-xl font-bold">{stats.total}</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded">
                            <p className="text-xs text-slate-600">Pending</p>
                            <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded">
                            <p className="text-xs text-slate-600">Completed</p>
                            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded">
                            <p className="text-xs text-slate-600">Avg Time</p>
                            <p className="text-xl font-bold">{stats.avgTime}s</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {delegations.slice(0, 10).map(delegation => (
                    <Card key={delegation.id}>
                        <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-blue-600" />
                                        <span className="font-semibold">{delegation.assigned_to}</span>
                                        <Badge className={priorityColors[delegation.priority]}>
                                            {delegation.priority}
                                        </Badge>
                                        <Badge variant="outline">
                                            {delegation.status}
                                        </Badge>
                                        <Badge className="bg-purple-100 text-purple-700">
                                            Complexity: {delegation.complexity_score}/10
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-700 mb-2">{delegation.task_description}</p>
                                    <p className="text-xs text-slate-500 mb-2">
                                        <strong>Reasoning:</strong> {delegation.assignment_reasoning}
                                    </p>
                                </div>
                            </div>

                            {delegation.alternative_agents?.length > 0 && (
                                <div className="bg-slate-50 p-2 rounded mt-2">
                                    <p className="text-xs font-semibold mb-1">Alternative Agents:</p>
                                    {delegation.alternative_agents.slice(0, 2).map((alt, idx) => (
                                        <p key={idx} className="text-xs text-slate-600">
                                            • {alt.agent_name} (Score: {alt.score}/10) - {alt.reasoning}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export { IntelligentTaskDelegator };