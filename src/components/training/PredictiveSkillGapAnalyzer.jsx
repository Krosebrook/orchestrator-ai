import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Zap, AlertTriangle, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function PredictiveSkillGapAnalyzer({ agents }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [predictions, setPredictions] = useState(null);
    const [lastAnalysis, setLastAnalysis] = useState(null);

    useEffect(() => {
        checkLastAnalysis();
    }, []);

    const checkLastAnalysis = async () => {
        try {
            const recent = await base44.entities.TrainingRecommendation.filter(
                { recommendation_type: 'new_capability' },
                '-created_date',
                1
            );
            if (recent && recent.length > 0) {
                setLastAnalysis(recent[0].created_date);
            }
        } catch (error) {
            console.error('Failed to check last analysis:', error);
        }
    };

    const analyzeFutureSkillGaps = async () => {
        setAnalyzing(true);
        try {
            // Gather comprehensive data
            const [
                allMetrics,
                taskBreakdowns,
                workflowExecutions,
                delegations,
                errors,
                collaborations,
                currentRecommendations
            ] = await Promise.all([
                base44.entities.AgentPerformanceMetric.list('-created_date', 1000),
                base44.entities.TaskPerformanceBreakdown.list('-created_date', 500),
                base44.entities.WorkflowExecution.list('-created_date', 200),
                base44.entities.TaskDelegation.list('-created_date', 200),
                base44.entities.AgentErrorLog.list('-created_date', 200),
                base44.entities.AgentCollaborationSession.list('-created_date', 100),
                base44.entities.TrainingRecommendation.list()
            ]);

            // Analyze trends over time
            const last30Days = allMetrics.filter(m => 
                new Date(m.created_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            );
            const last60Days = allMetrics.filter(m => 
                new Date(m.created_date) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            );

            // Task complexity analysis
            const complexityTrend = delegations.reduce((acc, d) => {
                const month = moment(d.created_date).format('YYYY-MM');
                if (!acc[month]) acc[month] = [];
                acc[month].push(d.complexity_score || 5);
                return acc;
            }, {});

            const avgComplexityByMonth = Object.entries(complexityTrend).map(([month, scores]) => ({
                month,
                avgComplexity: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
            })).sort((a, b) => a.month.localeCompare(b.month));

            // Error pattern analysis
            const emergingIssues = errors.reduce((acc, err) => {
                const month = moment(err.created_date).format('YYYY-MM');
                acc[err.error_type] = (acc[err.error_type] || 0) + 1;
                return acc;
            }, {});

            // Workflow complexity trends
            const workflowTrends = workflowExecutions.map(w => ({
                steps: w.step_results?.length || 0,
                duration: w.step_results?.reduce((sum, s) => 
                    sum + (new Date(s.completed_at) - new Date(s.started_at)), 0
                ) || 0,
                status: w.status
            }));

            // Use AI to predict future needs
            const prediction = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze agent performance trends and predict future skill gaps:

TASK COMPLEXITY TRENDS (Last 6 months):
${avgComplexityByMonth.map(m => `${m.month}: Avg Complexity ${m.avgComplexity}/10`).join('\n')}
Trend: ${avgComplexityByMonth.length > 1 ? 
    (parseFloat(avgComplexityByMonth[avgComplexityByMonth.length - 1].avgComplexity) > 
     parseFloat(avgComplexityByMonth[0].avgComplexity) ? 'Increasing' : 'Stable/Decreasing') : 'Insufficient data'}

EMERGING ERROR PATTERNS:
${Object.entries(emergingIssues).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([type, count]) => 
    `- ${type}: ${count} occurrences`
).join('\n')}

CURRENT TEAM CAPABILITIES:
${agents.map(a => `- ${a.name}: ${a.description}`).join('\n')}

WORKFLOW COMPLEXITY:
- Average steps: ${(workflowTrends.reduce((s, w) => s + w.steps, 0) / workflowTrends.length).toFixed(1)}
- Success rate: ${((workflowTrends.filter(w => w.status === 'completed').length / workflowTrends.length) * 100).toFixed(0)}%

RECENT PERFORMANCE (30 vs 60 days):
- Recent metrics: ${last30Days.length} operations
- Previous metrics: ${last60Days.length - last30Days.length} operations
- Trend: ${last30Days.length > (last60Days.length - last30Days.length) ? 'Increasing workload' : 'Stable workload'}

Based on industry trends, technology evolution, and the data above, predict:

1. FUTURE SKILL GAPS (3-6 months ahead):
   - What new capabilities will be needed?
   - Which existing skills will become insufficient?
   - What emerging technologies should agents prepare for?

2. PROACTIVE TRAINING NEEDS:
   - Specific skills to develop NOW to prepare for future demands
   - New training modules that should be created
   - Advanced capabilities that will become critical

3. RISK ASSESSMENT:
   - Which agents are most at risk of skill obsolescence?
   - What are the critical gaps that could cause failures?
   - Urgency level for each predicted gap

4. STRATEGIC RECOMMENDATIONS:
   - Should we develop new specialist agents?
   - What knowledge areas need expansion?
   - How should the team evolve structurally?

Consider:
- AI/ML advancement trends
- Automation evolution
- Integration complexity increases
- Data analysis sophistication
- Multi-agent orchestration demands
- Security and compliance requirements`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        future_skill_gaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    timeframe: { type: "string" },
                                    urgency: { type: "string" },
                                    reasoning: { type: "string" },
                                    affected_agents: { type: "array", items: { type: "string" } },
                                    industry_trend: { type: "string" }
                                }
                            }
                        },
                        proactive_training_modules: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    module_title: { type: "string" },
                                    description: { type: "string" },
                                    target_skills: { type: "array", items: { type: "string" } },
                                    priority: { type: "string" },
                                    estimated_development_time: { type: "string" }
                                }
                            }
                        },
                        at_risk_agents: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    agent_name: { type: "string" },
                                    risk_level: { type: "string" },
                                    obsolescence_factors: { type: "array", items: { type: "string" } },
                                    recommended_actions: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        strategic_recommendations: {
                            type: "array",
                            items: { type: "string" }
                        },
                        summary: { type: "string" },
                        confidence_score: { type: "number" }
                    }
                }
            });

            setPredictions(prediction);

            // Create forward-looking training recommendations
            for (const gap of prediction.future_skill_gaps || []) {
                if (gap.urgency === 'high' || gap.urgency === 'critical') {
                    await base44.entities.TrainingRecommendation.create({
                        agent_name: gap.affected_agents?.[0] || 'All Agents',
                        recommendation_type: 'new_capability',
                        priority: gap.urgency,
                        title: `Prepare for: ${gap.skill}`,
                        description: `${gap.reasoning}\n\nTimeframe: ${gap.timeframe}\nIndustry Trend: ${gap.industry_trend}`,
                        expected_impact: `Proactively develop capabilities for future demands`,
                        status: 'pending'
                    });
                }
            }

            toast.success('Future skill gap analysis completed');
            setLastAnalysis(new Date().toISOString());
        } catch (error) {
            console.error('Predictive analysis failed:', error);
            toast.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const urgencyColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    const riskColors = {
        low: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <Zap className="h-6 w-6 text-purple-600" />
                                Predictive Skill Gap Analysis
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                AI-powered forecasting of future training needs based on trends and industry evolution
                            </p>
                            {lastAnalysis && (
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Last analysis: {moment(lastAnalysis).fromNow()}
                                </p>
                            )}
                        </div>
                        <Button 
                            onClick={analyzeFutureSkillGaps} 
                            disabled={analyzing}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Forecast Future Needs
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {predictions && (
                <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                        {/* Summary */}
                        <Card className="border-2 border-blue-200 bg-blue-50">
                            <CardContent className="pt-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Executive Summary
                                </h3>
                                <p className="text-sm text-slate-700">{predictions.summary}</p>
                                <div className="mt-3">
                                    <Badge className="bg-blue-600">
                                        Confidence: {(predictions.confidence_score * 100).toFixed(0)}%
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Future Skill Gaps */}
                        {predictions.future_skill_gaps?.length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        Predicted Skill Gaps (3-6 Months)
                                    </h3>
                                    <div className="space-y-3">
                                        {predictions.future_skill_gaps.map((gap, idx) => (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-800">{gap.skill}</h4>
                                                        <p className="text-xs text-slate-600 mt-1">Timeframe: {gap.timeframe}</p>
                                                    </div>
                                                    <Badge className={urgencyColors[gap.urgency]}>
                                                        {gap.urgency} urgency
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-700 mb-2">{gap.reasoning}</p>
                                                <div className="bg-purple-50 p-2 rounded mt-2">
                                                    <p className="text-xs text-purple-700">
                                                        <strong>Industry Trend:</strong> {gap.industry_trend}
                                                    </p>
                                                </div>
                                                {gap.affected_agents?.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-slate-600">
                                                            Affected: {gap.affected_agents.join(', ')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Proactive Training Modules */}
                        {predictions.proactive_training_modules?.length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-green-600" />
                                        Recommended Training Modules to Develop
                                    </h3>
                                    <div className="space-y-3">
                                        {predictions.proactive_training_modules.map((module, idx) => (
                                            <div key={idx} className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-green-900">{module.module_title}</h4>
                                                    <Badge className={urgencyColors[module.priority]}>
                                                        {module.priority} priority
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-green-800 mb-2">{module.description}</p>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div className="bg-white/60 p-2 rounded">
                                                        <p className="text-xs text-slate-600">Target Skills:</p>
                                                        <p className="text-xs font-medium">{module.target_skills?.join(', ')}</p>
                                                    </div>
                                                    <div className="bg-white/60 p-2 rounded">
                                                        <p className="text-xs text-slate-600">Est. Development:</p>
                                                        <p className="text-xs font-medium">{module.estimated_development_time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* At-Risk Agents */}
                        {predictions.at_risk_agents?.length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        Agents at Risk of Skill Obsolescence
                                    </h3>
                                    <div className="space-y-3">
                                        {predictions.at_risk_agents.map((agent, idx) => (
                                            <div key={idx} className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-red-900">{agent.agent_name}</h4>
                                                    <Badge className={riskColors[agent.risk_level]}>
                                                        {agent.risk_level} risk
                                                    </Badge>
                                                </div>
                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-red-800 mb-1">Obsolescence Factors:</p>
                                                    {agent.obsolescence_factors?.map((factor, i) => (
                                                        <p key={i} className="text-xs text-red-700">• {factor}</p>
                                                    ))}
                                                </div>
                                                <div className="bg-white/60 p-2 rounded">
                                                    <p className="text-xs font-semibold text-slate-700 mb-1">Recommended Actions:</p>
                                                    {agent.recommended_actions?.map((action, i) => (
                                                        <p key={i} className="text-xs text-slate-600">✓ {action}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Strategic Recommendations */}
                        {predictions.strategic_recommendations?.length > 0 && (
                            <Card className="border-2 border-purple-200 bg-purple-50">
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold mb-3 text-purple-900">Strategic Recommendations</h3>
                                    <div className="space-y-2">
                                        {predictions.strategic_recommendations.map((rec, idx) => (
                                            <p key={idx} className="text-sm text-purple-800">
                                                {idx + 1}. {rec}
                                            </p>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}