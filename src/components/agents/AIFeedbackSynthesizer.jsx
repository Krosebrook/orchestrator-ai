import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Lightbulb, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AIFeedbackSynthesizer({ agentName }) {
    const [insights, setInsights] = useState(null);
    const [synthesizing, setSynthesizing] = useState(false);

    const synthesizeFeedback = async () => {
        setSynthesizing(true);
        try {
            const tasks = await base44.entities.TaskPerformanceBreakdown.filter(
                { agent_name: agentName },
                '-created_date',
                100
            );

            const feedbackTasks = tasks.filter(t => t.user_feedback_score || t.user_feedback_text);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Synthesize user feedback for this AI agent into actionable insights.

Agent: ${agentName}
Total Feedback Entries: ${feedbackTasks.length}
Average Rating: ${(feedbackTasks.reduce((sum, t) => sum + (t.user_feedback_score || 0), 0) / feedbackTasks.length).toFixed(1)}/5

Feedback Comments:
${feedbackTasks.slice(0, 20).map(t => `[${t.user_feedback_score}/5] ${t.task_type}: "${t.user_feedback_text}"`).join('\n')}

Quality Scores:
${feedbackTasks.slice(0, 20).map(t => `${t.task_type}: ${t.quality_score || 'N/A'}/10`).join('\n')}

Provide:
1. Common praise patterns (what users love)
2. Recurring complaints (what frustrates users)
3. Specific improvement actions (prioritized)
4. Communication style adjustments
5. Quick wins (easy improvements with high impact)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        praise_patterns: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    pattern: { type: "string" },
                                    frequency: { type: "string" },
                                    example: { type: "string" }
                                }
                            }
                        },
                        complaints: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    issue: { type: "string" },
                                    severity: { type: "string" },
                                    user_quotes: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        improvement_actions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    action: { type: "string" },
                                    priority: { type: "string" },
                                    expected_impact: { type: "string" }
                                }
                            }
                        },
                        communication_adjustments: {
                            type: "array",
                            items: { type: "string" }
                        },
                        quick_wins: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    win: { type: "string" },
                                    effort: { type: "string" },
                                    impact: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setInsights(result);
            toast.success('Feedback synthesized');
        } catch (error) {
            console.error('Failed to synthesize feedback:', error);
            toast.error('Failed to synthesize feedback');
        } finally {
            setSynthesizing(false);
        }
    };

    return (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        AI Feedback Insights
                    </span>
                    <Button size="sm" onClick={synthesizeFeedback} disabled={synthesizing}>
                        {synthesizing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Synthesize'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {synthesizing ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-green-600 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-slate-600">Analyzing user feedback...</p>
                    </div>
                ) : !insights ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-green-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Generate actionable feedback insights</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Praise Patterns */}
                        {insights.praise_patterns?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-700">
                                    <ThumbsUp className="h-4 w-4" />
                                    What Users Love
                                </h3>
                                <div className="space-y-2">
                                    {insights.praise_patterns.map((praise, idx) => (
                                        <div key={idx} className="bg-white border border-green-200 p-3 rounded-lg">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="font-semibold text-sm">{praise.pattern}</p>
                                                <Badge className="bg-green-600">{praise.frequency}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 italic">"{praise.example}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Complaints */}
                        {insights.complaints?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-700">
                                    <ThumbsDown className="h-4 w-4" />
                                    User Frustrations
                                </h3>
                                <div className="space-y-2">
                                    {insights.complaints.map((complaint, idx) => (
                                        <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="font-semibold text-sm">{complaint.issue}</p>
                                                <Badge className={
                                                    complaint.severity === 'high' ? 'bg-red-600' :
                                                    complaint.severity === 'medium' ? 'bg-orange-600' :
                                                    'bg-yellow-600'
                                                }>
                                                    {complaint.severity}
                                                </Badge>
                                            </div>
                                            {complaint.user_quotes?.length > 0 && (
                                                <div className="space-y-1">
                                                    {complaint.user_quotes.slice(0, 2).map((quote, qIdx) => (
                                                        <p key={qIdx} className="text-xs text-slate-600 italic">"{quote}"</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Wins */}
                        {insights.quick_wins?.length > 0 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-600" />
                                    Quick Wins
                                </h3>
                                <div className="space-y-2">
                                    {insights.quick_wins.map((win, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg">
                                            <p className="text-sm font-medium mb-1">{win.win}</p>
                                            <div className="flex gap-2 text-xs">
                                                <Badge variant="outline">Effort: {win.effort}</Badge>
                                                <Badge variant="outline">Impact: {win.impact}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Improvement Actions */}
                        {insights.improvement_actions?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-blue-600" />
                                    Prioritized Actions
                                </h3>
                                <div className="space-y-2">
                                    {insights.improvement_actions.map((action, idx) => (
                                        <div key={idx} className="bg-white border border-blue-200 p-3 rounded-lg">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="text-sm font-medium">{action.action}</p>
                                                <Badge className={
                                                    action.priority === 'high' ? 'bg-red-600' :
                                                    action.priority === 'medium' ? 'bg-yellow-600' :
                                                    'bg-green-600'
                                                }>
                                                    {action.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-green-700">Expected: {action.expected_impact}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Communication Adjustments */}
                        {insights.communication_adjustments?.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <h3 className="text-sm font-semibold mb-2">💬 Communication Tips</h3>
                                <div className="space-y-1">
                                    {insights.communication_adjustments.map((tip, idx) => (
                                        <p key={idx} className="text-xs text-slate-700">• {tip}</p>
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