import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowOptimizationAssistant({ workflow, executions, onApplyOptimization }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (workflow && executions.length > 0) {
            analyzeWorkflow();
        }
    }, [workflow?.id, executions.length]);

    const analyzeWorkflow = async () => {
        setAnalyzing(true);
        try {
            const executionData = executions.slice(0, 10).map(exec => ({
                status: exec.status,
                node_results: exec.node_results,
                execution_time: calculateExecutionTime(exec)
            }));

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this workflow and provide optimization suggestions.

Workflow: ${workflow.name}
Description: ${workflow.description}
Nodes: ${JSON.stringify(workflow.nodes)}
Recent Executions: ${JSON.stringify(executionData)}

Identify:
1. Performance bottlenecks (slow nodes, timeout issues)
2. Agent assignment improvements (better agent for specific tasks)
3. Workflow structure optimizations (parallel vs sequential, unnecessary steps)
4. Parameter tuning suggestions

Provide 3-5 specific, actionable suggestions.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["bottleneck", "agent_swap", "structure", "parameter"] },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    impact: { type: "string", enum: ["high", "medium", "low"] },
                                    implementation: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setSuggestions(result.suggestions || []);
        } catch (error) {
            console.error('Failed to analyze workflow:', error);
            toast.error('Failed to analyze workflow');
        } finally {
            setAnalyzing(false);
        }
    };

    const calculateExecutionTime = (execution) => {
        if (!execution.node_results || execution.node_results.length === 0) return 0;
        const times = execution.node_results
            .filter(n => n.started_at && n.completed_at)
            .map(n => new Date(n.completed_at) - new Date(n.started_at));
        return times.reduce((a, b) => a + b, 0);
    };

    const getSuggestionIcon = (type) => {
        const icons = {
            bottleneck: AlertTriangle,
            agent_swap: TrendingUp,
            structure: Lightbulb,
            parameter: CheckCircle
        };
        return icons[type] || Lightbulb;
    };

    const getSuggestionColor = (impact) => {
        const colors = {
            high: 'bg-red-100 text-red-700 border-red-300',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            low: 'bg-green-100 text-green-700 border-green-300'
        };
        return colors[impact] || 'bg-slate-100 text-slate-700';
    };

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-600" />
                        Optimization Suggestions
                    </span>
                    {!analyzing && suggestions.length > 0 && (
                        <Button size="sm" variant="outline" onClick={analyzeWorkflow}>
                            Refresh
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {analyzing ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-slate-600">Analyzing workflow...</p>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center py-8">
                        <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                            {executions.length === 0 
                                ? 'Run the workflow to get optimization suggestions'
                                : 'No suggestions available'}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {suggestions.map((suggestion, idx) => {
                                const Icon = getSuggestionIcon(suggestion.type);
                                return (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border-2 ${getSuggestionColor(suggestion.impact)}`}
                                    >
                                        <div className="flex items-start gap-2 mb-2">
                                            <Icon className="h-5 w-5 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {suggestion.impact} impact
                                                    </Badge>
                                                </div>
                                                <p className="text-xs mb-2">{suggestion.description}</p>
                                                <p className="text-xs font-medium">
                                                    💡 {suggestion.implementation}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full mt-2"
                                            onClick={() => onApplyOptimization(suggestion)}
                                        >
                                            Apply Suggestion
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}