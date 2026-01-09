import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AgentHealthMonitor() {
    const [agentHealth, setAgentHealth] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAgentHealth();
        const interval = setInterval(loadAgentHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadAgentHealth = async () => {
        try {
            const [agents, profiles, metrics, tasks, errors] = await Promise.all([
                base44.agents.listAgents(),
                base44.entities.AgentProfile.list(),
                base44.entities.AgentPerformanceMetric.list('-created_date', 200),
                base44.entities.TaskDelegation.list('-created_date', 100),
                base44.entities.AgentErrorLog.list('-created_date', 100)
            ]);

            const healthData = agents.map(agent => {
                const profile = profiles.find(p => p.agent_name === agent.name);
                const agentMetrics = metrics.filter(m => m.agent_name === agent.name);
                const recentMetrics = agentMetrics.slice(0, 20);
                const activeTasks = tasks.filter(t => t.assigned_to === agent.name && t.status === 'in_progress');
                const recentErrors = errors.filter(e => e.agent_name === agent.name && !e.resolved);

                const successRate = recentMetrics.length > 0
                    ? (recentMetrics.filter(m => m.status === 'success').length / recentMetrics.length) * 100
                    : 100;

                const avgResponseTime = recentMetrics.length > 0
                    ? recentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / recentMetrics.length
                    : 0;

                const workload = activeTasks.length;
                const maxWorkload = profile?.optimal_workload === 'heavy' ? 20 : profile?.optimal_workload === 'moderate' ? 10 : 5;
                const workloadPercentage = (workload / maxWorkload) * 100;

                // Calculate trend
                const oldMetrics = agentMetrics.slice(20, 40);
                const oldSuccessRate = oldMetrics.length > 0
                    ? (oldMetrics.filter(m => m.status === 'success').length / oldMetrics.length) * 100
                    : 100;
                const trend = successRate > oldSuccessRate + 5 ? 'up' : successRate < oldSuccessRate - 5 ? 'down' : 'stable';

                const status = recentErrors.length > 3 ? 'critical' :
                              successRate < 70 ? 'warning' :
                              workloadPercentage > 90 ? 'warning' : 'healthy';

                return {
                    agent: agent.name,
                    status,
                    successRate,
                    avgResponseTime,
                    workload,
                    workloadPercentage: Math.min(workloadPercentage, 100),
                    errorCount: recentErrors.length,
                    trend,
                    lastActive: agentMetrics[0]?.created_date || agent.created_date
                };
            });

            healthData.sort((a, b) => {
                const statusOrder = { critical: 0, warning: 1, healthy: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            });

            setAgentHealth(healthData);
        } catch (error) {
            console.error('Failed to load agent health:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'bg-green-100 text-green-700';
            case 'warning': return 'bg-yellow-100 text-yellow-700';
            case 'critical': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
            default: return <Minus className="h-4 w-4 text-slate-400" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex items-center justify-center">
                    <Activity className="h-8 w-8 animate-pulse text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    const criticalAgents = agentHealth.filter(a => a.status === 'critical').length;
    const warningAgents = agentHealth.filter(a => a.status === 'warning').length;
    const healthyAgents = agentHealth.filter(a => a.status === 'healthy').length;

    return (
        <div className="space-y-6">
            {/* Health Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={cn("border-2", criticalAgents > 0 ? "border-red-200" : "")}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Critical</p>
                                <p className="text-2xl font-bold text-red-600">{criticalAgents}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Warning</p>
                                <p className="text-2xl font-bold text-yellow-600">{warningAgents}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Healthy</p>
                                <p className="text-2xl font-bold text-green-600">{healthyAgents}</p>
                            </div>
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Agent Health Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {agentHealth.map(agent => (
                            <div key={agent.agent} className="bg-slate-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-slate-500" />
                                        <span className="font-semibold">{agent.agent}</span>
                                        {getTrendIcon(agent.trend)}
                                    </div>
                                    <Badge className={getStatusColor(agent.status)}>
                                        {agent.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Success Rate</p>
                                        <p className="text-sm font-semibold">{agent.successRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Response Time</p>
                                        <p className="text-sm font-semibold">{agent.avgResponseTime.toFixed(0)}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Active Tasks</p>
                                        <p className="text-sm font-semibold">{agent.workload}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Errors</p>
                                        <p className="text-sm font-semibold text-red-600">{agent.errorCount}</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                        <span>Workload</span>
                                        <span>{agent.workloadPercentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress 
                                        value={agent.workloadPercentage} 
                                        className={cn(
                                            agent.workloadPercentage > 90 ? "[&>div]:bg-red-500" :
                                            agent.workloadPercentage > 70 ? "[&>div]:bg-yellow-500" :
                                            "[&>div]:bg-green-500"
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}