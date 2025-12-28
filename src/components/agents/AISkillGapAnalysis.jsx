import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingDown, AlertTriangle, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AISkillGapAnalysis({ agentName, profile }) {
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const generateAnalysis = async () => {
        setAnalyzing(true);
        try {
            const [errors, tasks, selfReports] = await Promise.all([
                base44.entities.AgentErrorLog.filter({ agent_name: agentName }, '-created_date', 50),
                base44.entities.TaskPerformanceBreakdown.filter({ agent_name: agentName }, '-created_date', 100),
                base44.entities.AgentSelfReport.filter({ agent_name: agentName }, '-created_date', 20)
            ]);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this AI agent's performance data and identify skill gaps.

Agent: ${agentName}
Current Strengths: ${profile?.strengths?.join(', ') || 'Unknown'}
Current Weaknesses: ${profile?.weaknesses?.join(', ') || 'Unknown'}

Performance Data:
- Total Errors: ${errors.length}
- Error Types: ${JSON.stringify(errors.reduce((acc, e) => { acc[e.error_type] = (acc[e.error_type] || 0) + 1; return acc; }, {}))}
- Task Success Rate: ${(tasks.filter(t => t.status === 'success').length / tasks.length * 100).toFixed(1)}%
- Average Quality Score: ${(tasks.reduce((sum, t) => sum + (t.quality_score || 0), 0) / tasks.length).toFixed(1)}/10
- Self-Reported Issues: ${selfReports.filter(r => r.report_type === 'weakness').length}

Provide a detailed skill gap analysis with:
1. Critical gaps that are causing failures
2. Emerging weaknesses trending upward
3. Underutilized strengths
4. Proficiency scores for key skills (0-100)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        critical_gaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    severity: { type: "string" },
                                    evidence: { type: "string" },
                                    impact: { type: "string" }
                                }
                            }
                        },
                        emerging_weaknesses: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    trend: { type: "string" },
                                    recommendation: { type: "string" }
                                }
                            }
                        },
                        underutilized_strengths: {
                            type: "array",
                            items: { type: "string" }
                        },
                        skill_proficiency: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    score: { type: "number" },
                                    benchmark: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            setAnalysis(result);
            toast.success('Skill gap analysis complete');
        } catch (error) {
            console.error('Failed to generate analysis:', error);
            toast.error('Failed to analyze skill gaps');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI Skill Gap Analysis
                    </span>
                    <Button size="sm" onClick={generateAnalysis} disabled={analyzing}>
                        {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Analyze'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {analyzing ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-slate-600">Analyzing performance data...</p>
                    </div>
                ) : !analysis ? (
                    <div className="text-center py-8">
                        <Target className="h-12 w-12 text-purple-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Generate AI-powered skill gap analysis</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Critical Gaps */}
                        {analysis.critical_gaps?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    Critical Gaps
                                </h3>
                                <div className="space-y-2">
                                    {analysis.critical_gaps.map((gap, idx) => (
                                        <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="font-semibold text-sm">{gap.skill}</p>
                                                <Badge className="bg-red-600">{gap.severity}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 mb-1">{gap.evidence}</p>
                                            <p className="text-xs text-red-700 font-medium">Impact: {gap.impact}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Emerging Weaknesses */}
                        {analysis.emerging_weaknesses?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-orange-600" />
                                    Emerging Weaknesses
                                </h3>
                                <div className="space-y-2">
                                    {analysis.emerging_weaknesses.map((weakness, idx) => (
                                        <div key={idx} className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                            <p className="font-semibold text-sm">{weakness.skill}</p>
                                            <p className="text-xs text-slate-600 mt-1">{weakness.trend}</p>
                                            <p className="text-xs text-orange-700 font-medium mt-1">💡 {weakness.recommendation}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skill Proficiency */}
                        {analysis.skill_proficiency?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3">Skill Proficiency</h3>
                                <div className="space-y-3">
                                    {analysis.skill_proficiency.map((skill, idx) => (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-medium">{skill.skill}</span>
                                                <span className="text-slate-500">{skill.score}/100 (Benchmark: {skill.benchmark})</span>
                                            </div>
                                            <Progress value={skill.score} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Underutilized Strengths */}
                        {analysis.underutilized_strengths?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Underutilized Strengths</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.underutilized_strengths.map((strength, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-blue-50">
                                            {strength}
                                        </Badge>
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