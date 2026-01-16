import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Target, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AILearningPathGenerator({ agentName, profile }) {
    const [learningPath, setLearningPath] = useState(null);
    const [generating, setGenerating] = useState(false);

    const generateLearningPath = async () => {
        setGenerating(true);
        try {
            const [errors, tasks] = await Promise.all([
                base44.entities.AgentErrorLog.filter({ agent_name: agentName }, '-created_date', 30),
                base44.entities.TaskPerformanceBreakdown.filter({ agent_name: agentName }, '-created_date', 50)
            ]);

            const weaknesses = profile?.weaknesses || [];
            const failedTasks = tasks.filter(t => t.status === 'failure');

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create a personalized learning path for this AI agent.

Agent: ${agentName}
Known Weaknesses: ${weaknesses.join(', ')}
Recent Errors: ${errors.length}
Failed Tasks: ${failedTasks.length}

Common Error Patterns:
${errors.slice(0, 10).map(e => `- ${e.error_type}: ${e.error_message}`).join('\n')}

Failed Task Types:
${failedTasks.slice(0, 5).map(t => `- ${t.task_type}: Quality ${t.quality_score || 0}/10`).join('\n')}

Create a structured learning path with:
1. Immediate tasks (address critical issues)
2. Short-term goals (1-2 weeks)
3. Long-term goals (1-3 months)
4. Recommended practice exercises
5. Success metrics to track progress`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        immediate_tasks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    expected_outcome: { type: "string" },
                                    duration: { type: "string" }
                                }
                            }
                        },
                        short_term_goals: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    goal: { type: "string" },
                                    milestones: { type: "array", items: { type: "string" } },
                                    resources: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        long_term_goals: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    goal: { type: "string" },
                                    requirements: { type: "array", items: { type: "string" } },
                                    estimated_timeline: { type: "string" }
                                }
                            }
                        },
                        practice_exercises: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    exercise: { type: "string" },
                                    difficulty: { type: "string" },
                                    focus_area: { type: "string" }
                                }
                            }
                        },
                        success_metrics: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setLearningPath(result);
            toast.success('Learning path generated');
        } catch (error) {
            console.error('Failed to generate learning path:', error);
            toast.error('Failed to generate learning path');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        AI Learning Path
                    </span>
                    <Button size="sm" onClick={generateLearningPath} disabled={generating}>
                        {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generate'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {generating ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-slate-600">Creating personalized learning path...</p>
                    </div>
                ) : !learningPath ? (
                    <div className="text-center py-8">
                        <Target className="h-12 w-12 text-blue-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Generate personalized development plan</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Immediate Tasks */}
                        {learningPath.immediate_tasks?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-red-700">🚨 Immediate Priority</h3>
                                <div className="space-y-2">
                                    {learningPath.immediate_tasks.map((task, idx) => (
                                        <div key={idx} className="bg-white border-2 border-red-200 p-3 rounded-lg">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="font-semibold text-sm">{task.title}</p>
                                                <Badge variant="outline">{task.duration}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 mb-2">{task.description}</p>
                                            <p className="text-xs text-green-700">✓ {task.expected_outcome}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Short-term Goals */}
                        {learningPath.short_term_goals?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3">📅 Short-term Goals (1-2 weeks)</h3>
                                <div className="space-y-3">
                                    {learningPath.short_term_goals.map((goal, idx) => (
                                        <div key={idx} className="bg-white border border-blue-200 p-3 rounded-lg">
                                            <p className="font-semibold text-sm mb-2">{goal.goal}</p>
                                            <div className="space-y-1 mb-2">
                                                {goal.milestones?.map((milestone, mIdx) => (
                                                    <div key={mIdx} className="flex items-start gap-2 text-xs">
                                                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                                                        <span>{milestone}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {goal.resources?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {goal.resources.map((resource, rIdx) => (
                                                        <Badge key={rIdx} variant="outline" className="text-xs">
                                                            {resource}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Long-term Goals */}
                        {learningPath.long_term_goals?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3">🎯 Long-term Goals (1-3 months)</h3>
                                <div className="space-y-2">
                                    {learningPath.long_term_goals.map((goal, idx) => (
                                        <div key={idx} className="bg-white border border-purple-200 p-3 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-semibold text-sm">{goal.goal}</p>
                                                <Badge>{goal.estimated_timeline}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                {goal.requirements?.map((req, rIdx) => (
                                                    <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-600">
                                                        <ArrowRight className="h-3 w-3 mt-0.5" />
                                                        <span>{req}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Practice Exercises */}
                        {learningPath.practice_exercises?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3">💪 Practice Exercises</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {learningPath.practice_exercises.map((exercise, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 p-2 rounded">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium">{exercise.exercise}</p>
                                                <div className="flex gap-1">
                                                    <Badge variant="outline" className="text-xs">{exercise.difficulty}</Badge>
                                                    <Badge variant="outline" className="text-xs">{exercise.focus_area}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Success Metrics */}
                        {learningPath.success_metrics?.length > 0 && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                <h3 className="text-sm font-semibold mb-2">📊 Track Progress With:</h3>
                                <div className="space-y-1">
                                    {learningPath.success_metrics.map((metric, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                            <span>{metric}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}