import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AITrainingSuggestions({ agents, progressData }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateSuggestions = async () => {
        setLoading(true);
        try {
            // Analyze agent performance data
            const agentPerformance = agents.map(agent => {
                const agentProgress = progressData.filter(p => p.agent_name === agent.name);
                const avgScore = agentProgress.length > 0
                    ? agentProgress.reduce((acc, p) => acc + p.current_score, 0) / agentProgress.length
                    : 0;
                
                return {
                    name: agent.name,
                    avgScore,
                    skillsCount: agentProgress.length,
                    weakSkills: agentProgress.filter(p => p.current_score < 70)
                };
            });

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze agent performance and suggest training areas:

${JSON.stringify(agentPerformance, null, 2)}

Provide 5 specific training suggestions that would have the highest impact. For each suggestion:
1. Which agent needs this training
2. What skill to focus on
3. Why this is important
4. Expected improvement potential`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    agent_name: { type: "string" },
                                    skill_area: { type: "string" },
                                    reason: { type: "string" },
                                    impact: { type: "string", enum: ["high", "medium", "low"] },
                                    priority: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            setSuggestions(response.suggestions.sort((a, b) => b.priority - a.priority));
            toast.success('Training suggestions generated');
        } catch (error) {
            console.error('Failed to generate suggestions:', error);
            toast.error('Failed to generate suggestions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (agents.length > 0 && progressData.length > 0) {
            generateSuggestions();
        }
    }, [agents, progressData]);

    const getImpactColor = (impact) => {
        const colors = {
            high: 'bg-red-100 text-red-700',
            medium: 'bg-amber-100 text-amber-700',
            low: 'bg-blue-100 text-blue-700'
        };
        return colors[impact] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">AI Training Suggestions</h3>
                <Button 
                    onClick={generateSuggestions}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {loading ? 'Analyzing...' : 'Refresh Suggestions'}
                </Button>
            </div>

            {suggestions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">AI will suggest training areas based on agent performance</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {suggestions.map((suggestion, idx) => (
                        <Card key={idx}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{suggestion.agent_name}</p>
                                            <p className="text-sm text-slate-600">{suggestion.skill_area}</p>
                                        </div>
                                    </div>
                                    <Badge className={getImpactColor(suggestion.impact)}>
                                        {suggestion.impact} impact
                                    </Badge>
                                </div>
                                
                                <p className="text-sm text-slate-600 mb-3">{suggestion.reason}</p>
                                
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs text-slate-500">Priority: {suggestion.priority}/10</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}