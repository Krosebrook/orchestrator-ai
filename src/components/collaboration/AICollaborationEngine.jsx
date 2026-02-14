import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, TrendingUp, Award, Zap, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function AICollaborationEngine({ agents, skills, collaborationSessions }) {
    const [patterns, setPatterns] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatterns();
    }, []);

    const loadPatterns = async () => {
        try {
            const patternsData = await base44.entities.CollaborationPattern.list('-confidence_score');
            setPatterns(patternsData || []);
        } catch (error) {
            console.error('Failed to load patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeAndLearn = async () => {
        setAnalyzing(true);
        try {
            // Gather collaboration data
            const agentSkillMap = {};
            skills.forEach(skill => {
                if (!agentSkillMap[skill.agent_name]) {
                    agentSkillMap[skill.agent_name] = [];
                }
                agentSkillMap[skill.agent_name].push({
                    skill: skill.skill_name,
                    category: skill.skill_category,
                    level: skill.proficiency_level,
                    certification: skill.certification_level
                });
            });

            // Analyze sessions
            const sessionStats = collaborationSessions.map(session => ({
                agents: session.participating_agents,
                outcome: session.outcome_quality,
                duration: session.session_duration_ms,
                objectives_met: session.objectives_met,
                insights_generated: session.insights_generated?.length || 0
            }));

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze agent collaboration patterns and learn optimal team structures:

**Agent Skills:**
${JSON.stringify(agentSkillMap, null, 2)}

**Past Collaboration Sessions:**
${JSON.stringify(sessionStats, null, 2)}

Identify:
1. **Successful Patterns**: Which agent combinations work well together
2. **Optimal Task Types**: What types of tasks each pattern excels at
3. **Collaboration Structure**: Who should lead, who supports, interaction flow
4. **Success Metrics**: Performance data for each pattern
5. **Optimal Conditions**: When to use each pattern
6. **Learned Insights**: What makes these patterns work

Create 3-5 high-confidence collaboration patterns.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        patterns: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    pattern_name: { type: "string" },
                                    agents_involved: { type: "array", items: { type: "string" } },
                                    task_type: { type: "string" },
                                    collaboration_structure: {
                                        type: "object",
                                        properties: {
                                            lead_agent: { type: "string" },
                                            support_agents: { type: "array", items: { type: "string" } },
                                            interaction_flow: { type: "string" }
                                        }
                                    },
                                    optimal_conditions: { type: "array", items: { type: "string" } },
                                    learned_insights: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                insight: { type: "string" },
                                                learned_at: { type: "string" }
                                            }
                                        }
                                    },
                                    confidence_score: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            // Save or update patterns
            for (const pattern of response.patterns) {
                const existing = patterns.find(p => 
                    p.pattern_name === pattern.pattern_name &&
                    JSON.stringify(p.agents_involved) === JSON.stringify(pattern.agents_involved)
                );

                if (existing) {
                    await base44.entities.CollaborationPattern.update(existing.id, {
                        ...pattern,
                        success_metrics: {
                            ...existing.success_metrics,
                            confidence_score: pattern.confidence_score
                        }
                    });
                } else {
                    await base44.entities.CollaborationPattern.create({
                        ...pattern,
                        success_metrics: {
                            total_uses: 0,
                            successful_outcomes: 0,
                            avg_completion_time: 0,
                            avg_quality_score: 0,
                            cost_efficiency: 0
                        }
                    });
                }
            }

            toast.success('Learned new collaboration patterns!');
            await loadPatterns();
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze patterns');
        } finally {
            setAnalyzing(false);
        }
    };

    const generateRecommendations = async (taskDescription) => {
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Given this task: "${taskDescription}"

Available collaboration patterns:
${JSON.stringify(patterns, null, 2)}

Recommend the top 3 collaboration patterns for this task, explaining why each would be effective.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    pattern_id: { type: "string" },
                                    pattern_name: { type: "string" },
                                    match_score: { type: "number" },
                                    reasoning: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setRecommendations(response.recommendations);
            return response.recommendations;
        } catch (error) {
            console.error('Failed to generate recommendations:', error);
            return [];
        }
    };

    const recordPatternUsage = async (patternId, success, metrics) => {
        try {
            const pattern = patterns.find(p => p.id === patternId);
            if (!pattern) return;

            const updatedMetrics = {
                total_uses: (pattern.success_metrics?.total_uses || 0) + 1,
                successful_outcomes: (pattern.success_metrics?.successful_outcomes || 0) + (success ? 1 : 0),
                avg_completion_time: metrics.completion_time,
                avg_quality_score: metrics.quality_score,
                cost_efficiency: metrics.cost_efficiency
            };

            // Update confidence based on success rate
            const successRate = updatedMetrics.successful_outcomes / updatedMetrics.total_uses;
            const newConfidence = Math.min(100, Math.max(0, successRate * 100));

            await base44.entities.CollaborationPattern.update(patternId, {
                success_metrics: updatedMetrics,
                confidence_score: newConfidence,
                last_used: new Date().toISOString()
            });

            await loadPatterns();
        } catch (error) {
            console.error('Failed to record pattern usage:', error);
        }
    };

    const topPatterns = patterns
        .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-600" />
                                AI Collaboration Engine
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                Learning optimal agent team patterns for maximum efficiency
                            </p>
                        </div>
                        <Button
                            onClick={analyzeAndLearn}
                            disabled={analyzing}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {analyzing ? 'Analyzing...' : 'Analyze & Learn'}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Learned Patterns</p>
                                <p className="text-2xl font-bold text-purple-600">{patterns.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-purple-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Avg Confidence</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {patterns.length > 0 
                                        ? Math.round(patterns.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / patterns.length)
                                        : 0}%
                                </p>
                            </div>
                            <Award className="h-8 w-8 text-blue-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Uses</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {patterns.reduce((sum, p) => sum + (p.success_metrics?.total_uses || 0), 0)}
                                </p>
                            </div>
                            <Zap className="h-8 w-8 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Patterns */}
            {topPatterns.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Top Collaboration Patterns</h3>
                    <div className="space-y-3">
                        {topPatterns.map((pattern) => (
                            <Card key={pattern.id} className="border-2">
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-lg">{pattern.pattern_name}</h4>
                                                    <Badge className="bg-purple-100 text-purple-700">
                                                        {pattern.confidence_score}% confidence
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">
                                                    Task Type: <span className="font-medium">{pattern.task_type}</span>
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {pattern.agents_involved?.map((agent, idx) => (
                                                        <Badge key={idx} variant="outline">
                                                            {agent}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Structure */}
                                        {pattern.collaboration_structure && (
                                            <div className="bg-slate-50 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Structure</p>
                                                <div className="text-sm space-y-1">
                                                    <p>
                                                        <span className="text-slate-600">Lead:</span>{' '}
                                                        <span className="font-medium">{pattern.collaboration_structure.lead_agent}</span>
                                                    </p>
                                                    <p className="text-slate-600">{pattern.collaboration_structure.interaction_flow}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Metrics */}
                                        {pattern.success_metrics && pattern.success_metrics.total_uses > 0 && (
                                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="bg-green-50 rounded p-2">
                                                    <p className="text-slate-600">Success Rate</p>
                                                    <p className="font-bold text-green-700">
                                                        {Math.round((pattern.success_metrics.successful_outcomes / pattern.success_metrics.total_uses) * 100)}%
                                                    </p>
                                                </div>
                                                <div className="bg-blue-50 rounded p-2">
                                                    <p className="text-slate-600">Uses</p>
                                                    <p className="font-bold text-blue-700">{pattern.success_metrics.total_uses}</p>
                                                </div>
                                                <div className="bg-purple-50 rounded p-2">
                                                    <p className="text-slate-600">Quality</p>
                                                    <p className="font-bold text-purple-700">
                                                        {pattern.success_metrics.avg_quality_score?.toFixed(1) || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Insights */}
                                        {pattern.learned_insights && pattern.learned_insights.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-700 uppercase mb-1">Key Insights</p>
                                                <ul className="space-y-1">
                                                    {pattern.learned_insights.slice(0, 2).map((item, idx) => (
                                                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                                            <TrendingUp className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                                                            <span>{item.insight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {!loading && patterns.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Brain className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-4">No collaboration patterns learned yet</p>
                        <Button
                            onClick={analyzeAndLearn}
                            disabled={analyzing}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Start Learning
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}