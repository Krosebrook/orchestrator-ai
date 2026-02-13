import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function BottleneckAnalyzer({ executions, workflow }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);

    // Identify bottlenecks
    const identifyBottlenecks = () => {
        const bottlenecks = [];
        
        // Analyze step duration
        const stepStats = {};
        executions.forEach(exec => {
            if (exec.step_results) {
                exec.step_results.forEach((step, idx) => {
                    if (!stepStats[idx]) {
                        stepStats[idx] = { times: [], failures: 0, name: step.agent_name };
                    }
                    if (step.execution_time_ms) {
                        stepStats[idx].times.push(step.execution_time_ms);
                    }
                    if (step.status === 'failed') stepStats[idx].failures++;
                });
            }
        });

        Object.entries(stepStats).forEach(([idx, stats]) => {
            const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
            const maxTime = Math.max(...stats.times);
            
            // Bottleneck if avg time > 30s or max time > 60s
            if (avgTime > 30000 || maxTime > 60000) {
                bottlenecks.push({
                    type: 'slow_step',
                    stepIndex: parseInt(idx),
                    stepName: stats.name,
                    avgTime: Math.round(avgTime / 1000),
                    maxTime: Math.round(maxTime / 1000),
                    severity: avgTime > 60000 ? 'high' : 'medium'
                });
            }

            // High failure rate
            if (stats.failures > stats.times.length * 0.1) {
                bottlenecks.push({
                    type: 'high_failure',
                    stepIndex: parseInt(idx),
                    stepName: stats.name,
                    failureRate: Math.round((stats.failures / stats.times.length) * 100),
                    severity: 'high'
                });
            }
        });

        return bottlenecks;
    };

    const bottlenecks = identifyBottlenecks();

    const analyzeWithAI = async () => {
        setAnalyzing(true);
        try {
            const context = {
                workflow: workflow ? workflow.name : 'All workflows',
                bottlenecks: bottlenecks,
                totalExecutions: executions.length,
                avgDuration: executions.reduce((a, e) => a + (e.execution_time_ms || 0), 0) / executions.length / 1000
            };

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these workflow bottlenecks and provide optimization suggestions:
                
${JSON.stringify(context, null, 2)}

Provide 3-5 specific, actionable suggestions to improve performance. Focus on:
1. Reducing execution time
2. Improving reliability
3. Optimizing agent selection
4. Parallel processing opportunities`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    impact: { type: "string", enum: ["high", "medium", "low"] },
                                    effort: { type: "string", enum: ["low", "medium", "high"] }
                                }
                            }
                        }
                    }
                }
            });

            setAiSuggestions(response.suggestions);
            toast.success('AI analysis complete');
        } catch (error) {
            console.error('Failed to analyze with AI:', error);
            toast.error('AI analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const getSeverityColor = (severity) => {
        return severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
    };

    return (
        <div className="space-y-6">
            {/* Bottleneck Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Identified Bottlenecks</CardTitle>
                        <Button 
                            onClick={analyzeWithAI}
                            disabled={analyzing || bottlenecks.length === 0}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {analyzing ? 'Analyzing...' : 'AI Suggestions'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {bottlenecks.length === 0 ? (
                        <div className="text-center py-12">
                            <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-slate-600">No bottlenecks detected! Workflow is performing well.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bottlenecks.map((bottleneck, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-1" />
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-semibold text-slate-800">
                                                        Step {bottleneck.stepIndex + 1}: {bottleneck.stepName}
                                                    </p>
                                                    <Badge className={getSeverityColor(bottleneck.severity)}>
                                                        {bottleneck.severity}
                                                    </Badge>
                                                </div>
                                                {bottleneck.type === 'slow_step' && (
                                                    <p className="text-sm text-slate-600">
                                                        <Clock className="h-4 w-4 inline mr-1" />
                                                        Avg: {bottleneck.avgTime}s | Max: {bottleneck.maxTime}s
                                                    </p>
                                                )}
                                                {bottleneck.type === 'high_failure' && (
                                                    <p className="text-sm text-slate-600">
                                                        Failure rate: {bottleneck.failureRate}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Suggestions */}
            {aiSuggestions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            AI Optimization Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {aiSuggestions.map((suggestion, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-slate-800">{suggestion.title}</h4>
                                        <div className="flex gap-2">
                                            <Badge variant="outline">
                                                Impact: {suggestion.impact}
                                            </Badge>
                                            <Badge variant="outline">
                                                Effort: {suggestion.effort}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600">{suggestion.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}