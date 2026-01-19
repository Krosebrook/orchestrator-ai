import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowOptimizationEngine({ workflow, onApplyOptimization }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [optimizations, setOptimizations] = useState([]);

    useEffect(() => {
        if (workflow?.id) {
            analyzeWorkflow();
        }
    }, [workflow?.id]);

    const analyzeWorkflow = async () => {
        if (!workflow?.id) return;

        setAnalyzing(true);
        try {
            // Fetch performance data
            const executions = await base44.entities.WorkflowExecution.filter({
                workflow_id: workflow.id
            }, '-created_date', 50);

            if (executions.length === 0) {
                setOptimizations([]);
                return;
            }

            // Analyze with AI
            const performanceData = {
                total_executions: executions.length,
                avg_duration: executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / executions.length,
                success_rate: executions.filter(e => e.status === 'completed').length / executions.length,
                failure_rate: executions.filter(e => e.status === 'failed').length / executions.length,
                bottlenecks: identifyBottlenecks(executions),
                workflow_structure: {
                    nodes: workflow.nodes,
                    edges: workflow.edges,
                    complexity: workflow.nodes?.length || 0
                }
            };

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a workflow optimization expert. Analyze this workflow's performance and suggest optimizations.

Workflow: ${workflow.name}
Performance Data:
${JSON.stringify(performanceData, null, 2)}

Provide specific, actionable optimization suggestions. For each suggestion:
1. type: "speed", "reliability", "cost", or "structure"
2. title: Clear optimization title
3. description: Detailed explanation
4. expected_impact: What improvement to expect
5. implementation: Specific changes needed
6. priority: "critical", "high", "medium", or "low"
7. estimated_effort: "low", "medium", or "high"

Return up to 5 most impactful optimizations.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        optimizations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    expected_impact: { type: "string" },
                                    implementation: { type: "string" },
                                    priority: { type: "string" },
                                    estimated_effort: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setOptimizations(result.optimizations || []);
        } catch (error) {
            console.error('Failed to analyze workflow:', error);
            toast.error('Failed to analyze workflow');
        } finally {
            setAnalyzing(false);
        }
    };

    const identifyBottlenecks = (executions) => {
        // Aggregate step durations across executions
        const stepDurations = {};
        executions.forEach(exec => {
            exec.steps?.forEach(step => {
                if (!stepDurations[step.node_id]) {
                    stepDurations[step.node_id] = [];
                }
                stepDurations[step.node_id].push(step.duration_ms || 0);
            });
        });

        // Find slowest steps
        const bottlenecks = [];
        Object.entries(stepDurations).forEach(([nodeId, durations]) => {
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            if (avg > 5000) { // Over 5 seconds
                bottlenecks.push({ node_id: nodeId, avg_duration: avg });
            }
        });

        return bottlenecks;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'destructive';
            case 'high': return 'default';
            case 'medium': return 'secondary';
            case 'low': return 'outline';
            default: return 'outline';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'speed': return <Zap className="h-4 w-4" />;
            case 'reliability': return <CheckCircle className="h-4 w-4" />;
            case 'cost': return <TrendingUp className="h-4 w-4" />;
            case 'structure': return <AlertTriangle className="h-4 w-4" />;
            default: return <Zap className="h-4 w-4" />;
        }
    };

    if (analyzing) {
        return (
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Analyzing workflow performance...</p>
                </CardContent>
            </Card>
        );
    }

    if (optimizations.length === 0) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-800">Workflow looks great!</p>
                    <p className="text-xs text-slate-600 mt-1">No major optimizations needed</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    Optimization Suggestions
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={analyzeWorkflow}
                >
                    Refresh
                </Button>
            </div>
            {optimizations.map((opt, idx) => (
                <Card key={idx} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1">
                                <div className="mt-0.5">
                                    {getTypeIcon(opt.type)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-slate-800">{opt.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={getPriorityColor(opt.priority)} className="text-xs">
                                            {opt.priority}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {opt.type}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {opt.estimated_effort} effort
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {opt.description}
                        </p>
                        
                        <div className="bg-slate-50 p-3 rounded text-xs space-y-2">
                            <div>
                                <span className="font-semibold text-slate-700">Expected Impact: </span>
                                <span className="text-slate-600">{opt.expected_impact}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-700">Implementation: </span>
                                <span className="text-slate-600">{opt.implementation}</span>
                            </div>
                        </div>

                        {onApplyOptimization && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => onApplyOptimization(opt)}
                            >
                                Apply Optimization
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}