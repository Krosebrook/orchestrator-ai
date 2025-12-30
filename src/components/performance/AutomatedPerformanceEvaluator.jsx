import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomatedPerformanceEvaluator({ agents }) {
    const [evaluating, setEvaluating] = useState(false);
    const [reports, setReports] = useState([]);

    const runEvaluation = async () => {
        setEvaluating(true);
        try {
            const evaluationResults = [];

            for (const agent of agents) {
                const [metrics, tasks, collaborations, errors] = await Promise.all([
                    base44.entities.AgentPerformanceMetric.filter({ agent_name: agent.name }, '-created_date', 100),
                    base44.entities.TaskPerformanceBreakdown.filter({ agent_name: agent.name }, '-created_date', 50),
                    base44.entities.AgentCollaborationSession.list().then(sessions => 
                        sessions.filter(s => s.participating_agents?.some(a => a.agent_name === agent.name))
                    ),
                    base44.entities.AgentErrorLog.filter({ agent_name: agent.name }, '-created_date', 50)
                ]);

                const successRate = metrics.length > 0 
                    ? (metrics.filter(m => m.status === 'success').length / metrics.length * 100).toFixed(1)
                    : 0;

                const avgQuality = tasks.length > 0
                    ? (tasks.reduce((sum, t) => sum + (t.quality_score || 0), 0) / tasks.length).toFixed(1)
                    : 0;

                const collaborationScore = collaborations.length > 0
                    ? (collaborations.filter(c => c.status === 'completed').length / collaborations.length * 100).toFixed(1)
                    : 0;

                // Get future predictions for forward-looking assessment
                const futureNeeds = await base44.entities.TrainingRecommendation.filter(
                    { recommendation_type: 'new_capability' },
                    '-created_date',
                    10
                );

                const evaluation = await base44.integrations.Core.InvokeLLM({
                    prompt: `Comprehensive performance evaluation for agent: ${agent.name}

Performance Metrics (last 100 operations):
- Success Rate: ${successRate}%
- Average Quality Score: ${avgQuality}/10
- Total Tasks: ${tasks.length}
- Collaboration Success: ${collaborationScore}%
- Recent Errors: ${errors.length}

Task Breakdown:
${tasks.slice(0, 10).map(t => 
    `- ${t.task_type}: ${t.status}, Quality: ${t.quality_score || 'N/A'}, Time: ${(t.execution_time_ms / 1000).toFixed(2)}s`
).join('\n')}

Error Types:
${errors.slice(0, 10).map(e => `- ${e.error_type}: ${e.error_message}`).join('\n')}

PREDICTED FUTURE CAPABILITIES NEEDED:
${futureNeeds.map(n => `- ${n.title}`).join('\n')}

Provide comprehensive evaluation including future-readiness:
1. Overall performance grade (A-F)
2. Strengths (specific examples)
3. Weaknesses (specific examples)
4. Critical improvement areas (current + future preparedness)
5. Training recommendations (both immediate needs AND future capabilities)
6. Whether immediate intervention is needed
7. Comparison to expected performance standards
8. Future-readiness assessment (how prepared for predicted challenges)`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            grade: { type: "string" },
                            overall_score: { type: "number" },
                            strengths: { type: "array", items: { type: "string" } },
                            weaknesses: { type: "array", items: { type: "string" } },
                            improvement_areas: { type: "array", items: { type: "string" } },
                            training_recommendations: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        skill: { type: "string" },
                                        priority: { type: "string" },
                                        reasoning: { type: "string" },
                                        timeframe: { type: "string" }
                                    }
                                }
                            },
                            future_readiness_score: { type: "number" },
                            future_gaps: { type: "array", items: { type: "string" } },
                            immediate_intervention: { type: "boolean" },
                            summary: { type: "string" }
                        }
                    }
                });

                evaluationResults.push({
                    agent: agent.name,
                    ...evaluation,
                    metrics: { successRate, avgQuality, collaborationScore, errorCount: errors.length }
                });

                // Create training recommendations (both immediate and future-focused)
                for (const rec of evaluation.training_recommendations || []) {
                    if (rec.priority === 'high' || rec.priority === 'critical') {
                        const recType = rec.timeframe?.toLowerCase().includes('future') ? 'new_capability' : 'skill_gap';
                        await base44.entities.TrainingRecommendation.create({
                            agent_name: agent.name,
                            recommendation_type: recType,
                            priority: rec.priority,
                            title: `${recType === 'new_capability' ? 'Prepare for: ' : 'Improve '}${rec.skill}`,
                            description: `${rec.reasoning}\n\nTimeframe: ${rec.timeframe || 'Immediate'}`,
                            evidence: [{
                                type: 'performance_evaluation',
                                description: evaluation.summary,
                                metric: evaluation.overall_score
                            }],
                            expected_impact: recType === 'new_capability' 
                                ? `Proactively develop ${rec.skill} for future demands`
                                : `Address ${rec.skill} deficiency identified in evaluation`,
                            status: 'pending'
                        });
                    }
                }
            }

            setReports(evaluationResults);
            toast.success('Performance evaluation completed');
        } catch (error) {
            console.error('Evaluation failed:', error);
            toast.error('Evaluation failed');
        } finally {
            setEvaluating(false);
        }
    };

    const gradeColors = {
        'A': 'bg-green-100 text-green-700',
        'B': 'bg-blue-100 text-blue-700',
        'C': 'bg-yellow-100 text-yellow-700',
        'D': 'bg-orange-100 text-orange-700',
        'F': 'bg-red-100 text-red-700'
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Automated Performance Evaluation
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                AI-driven assessment using real-world data
                            </p>
                        </div>
                        <Button onClick={runEvaluation} disabled={evaluating}>
                            {evaluating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Run Evaluation'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reports.map((report, idx) => (
                <Card key={idx} className="border-2">
                    <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{report.agent}</h3>
                                    <Badge className={gradeColors[report.grade]}>
                                        Grade: {report.grade}
                                    </Badge>
                                    <Badge variant="outline">Score: {report.overall_score}/100</Badge>
                                    {report.immediate_intervention && (
                                        <Badge className="bg-red-600">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Needs Attention
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{report.summary}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                            <div className="bg-slate-50 p-2 rounded text-center">
                                <p className="text-xs text-slate-600">Success Rate</p>
                                <p className="font-semibold">{report.metrics.successRate}%</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded text-center">
                                <p className="text-xs text-slate-600">Quality</p>
                                <p className="font-semibold">{report.metrics.avgQuality}/10</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded text-center">
                                <p className="text-xs text-slate-600">Collaboration</p>
                                <p className="font-semibold">{report.metrics.collaborationScore}%</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded text-center">
                                <p className="text-xs text-slate-600">Errors</p>
                                <p className="font-semibold">{report.metrics.errorCount}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {report.strengths?.length > 0 && (
                                <div className="bg-green-50 border border-green-200 p-3 rounded">
                                    <p className="text-xs font-semibold text-green-900 mb-1">Strengths:</p>
                                    {report.strengths.map((s, i) => (
                                        <p key={i} className="text-xs text-green-700">✓ {s}</p>
                                    ))}
                                </div>
                            )}

                            {report.weaknesses?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded">
                                    <p className="text-xs font-semibold text-red-900 mb-1">Weaknesses:</p>
                                    {report.weaknesses.map((w, i) => (
                                        <p key={i} className="text-xs text-red-700">⚠ {w}</p>
                                    ))}
                                </div>
                            )}
                        </div>

                        {report.training_recommendations?.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 p-3 rounded mt-3">
                                <p className="text-xs font-semibold text-purple-900 mb-2">Training Recommendations:</p>
                                {report.training_recommendations.map((rec, i) => (
                                    <div key={i} className="mb-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-purple-700 font-medium">
                                                {rec.skill}
                                            </p>
                                            <Badge className={rec.timeframe?.toLowerCase().includes('future') ? 'bg-blue-600' : 'bg-orange-600'}>
                                                {rec.priority} | {rec.timeframe || 'Immediate'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-purple-600 mt-1">{rec.reasoning}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {report.future_readiness_score !== undefined && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-blue-900">Future Readiness:</p>
                                    <Badge className={report.future_readiness_score >= 70 ? 'bg-green-600' : report.future_readiness_score >= 50 ? 'bg-yellow-600' : 'bg-red-600'}>
                                        {report.future_readiness_score}/100
                                    </Badge>
                                </div>
                                {report.future_gaps?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-blue-700 mb-1">Predicted Gaps:</p>
                                        {report.future_gaps.map((gap, i) => (
                                            <p key={i} className="text-xs text-blue-600">• {gap}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}