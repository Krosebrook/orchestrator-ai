import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingRecommendations({ agents, modules, onRecommendationAccepted }) {
    const [selectedAgent, setSelectedAgent] = useState('');
    const [generating, setGenerating] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    const generateRecommendations = async () => {
        if (!selectedAgent) {
            toast.error('Please select an agent');
            return;
        }

        setGenerating(true);
        try {
            const [errors, tasks, feedback, sessions] = await Promise.all([
                base44.entities.AgentErrorLog.filter({ agent_name: selectedAgent }, '-created_date', 30),
                base44.entities.TaskPerformanceBreakdown.filter({ agent_name: selectedAgent }, '-created_date', 50),
                base44.entities.TaskPerformanceBreakdown.filter({ 
                    agent_name: selectedAgent,
                    user_feedback_score: { $lte: 3 }
                }),
                base44.entities.TrainingSession.filter({ agent_name: selectedAgent })
            ]);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this agent's performance and recommend training modules.

Agent: ${selectedAgent}
Recent Errors: ${errors.length}
Failed Tasks: ${tasks.filter(t => t.status === 'failure').length}
Low-Rated Tasks: ${feedback.length}
Training Sessions Completed: ${sessions.filter(s => s.status === 'completed').length}

Error Types: ${JSON.stringify(errors.reduce((acc, e) => { acc[e.error_type] = (acc[e.error_type] || 0) + 1; return acc; }, {}))}

Available Training Modules:
${modules.map(m => `- ${m.title} (${m.difficulty}): ${m.description}`).join('\n')}

Generate 3-5 prioritized training recommendations with:
1. Type (skill_gap, performance_issue, new_capability, refresher)
2. Priority (low, medium, high, critical)
3. Title
4. Description explaining why
5. Suggested module IDs
6. Evidence from performance data
7. Expected impact`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    recommendation_type: { type: "string" },
                                    priority: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    suggested_modules: { type: "array", items: { type: "string" } },
                                    evidence: { 
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                type: { type: "string" },
                                                description: { type: "string" },
                                                metric: { type: "number" }
                                            }
                                        }
                                    },
                                    expected_impact: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Create recommendation entities
            for (const rec of result.recommendations) {
                await base44.entities.TrainingRecommendation.create({
                    agent_name: selectedAgent,
                    ...rec,
                    status: 'pending'
                });
            }

            setRecommendations(result.recommendations);
            toast.success('Training recommendations generated');
        } catch (error) {
            console.error('Failed to generate recommendations:', error);
            toast.error('Failed to generate recommendations');
        } finally {
            setGenerating(false);
        }
    };

    const priorityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    const typeIcons = {
        skill_gap: AlertTriangle,
        performance_issue: TrendingUp,
        new_capability: Sparkles,
        refresher: CheckCircle
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Select value={selectedAgent} onValueChange={setSelectedAgent} className="flex-1">
                            <SelectTrigger>
                                <SelectValue placeholder="Select agent to analyze" />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.map(agent => (
                                    <SelectItem key={agent.name} value={agent.name}>
                                        {agent.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={generateRecommendations} disabled={generating || !selectedAgent}>
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Recommendations
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {recommendations.length > 0 && (
                <div className="space-y-4">
                    {recommendations.map((rec, idx) => {
                        const Icon = typeIcons[rec.recommendation_type] || Sparkles;
                        return (
                            <Card key={idx} className="border-2">
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <Icon className="h-5 w-5 text-purple-600 mt-1" />
                                            <div>
                                                <h3 className="font-semibold">{rec.title}</h3>
                                                <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                                            </div>
                                        </div>
                                        <Badge className={priorityColors[rec.priority]}>
                                            {rec.priority}
                                        </Badge>
                                    </div>

                                    {rec.evidence && rec.evidence.length > 0 && (
                                        <div className="bg-slate-50 p-3 rounded mb-3">
                                            <p className="text-xs font-semibold mb-2">Evidence:</p>
                                            {rec.evidence.map((ev, i) => (
                                                <p key={i} className="text-xs text-slate-600">
                                                    • {ev.description} ({ev.metric})
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    <div className="bg-green-50 border border-green-200 p-3 rounded mb-3">
                                        <p className="text-xs font-semibold text-green-900 mb-1">Expected Impact:</p>
                                        <p className="text-xs text-green-700">{rec.expected_impact}</p>
                                    </div>

                                    {rec.suggested_modules && rec.suggested_modules.length > 0 && (
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs text-slate-600">Suggested modules:</span>
                                            {rec.suggested_modules.map((moduleId, i) => {
                                                const module = modules.find(m => m.id === moduleId);
                                                return module ? (
                                                    <Badge key={i} variant="outline">{module.title}</Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}