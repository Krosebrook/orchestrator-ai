import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveInsights({ agents, workflows, metrics, executions, onPredictionGenerated }) {
    const [generating, setGenerating] = useState(false);
    const [predictions, setPredictions] = useState([]);

    const generatePredictions = async () => {
        setGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze current trends and predict potential issues:

Agents: ${agents.length}
Recent Metrics: ${metrics.length}
Workflow Executions: ${executions.length}

Agent Performance Trends:
${agents.map(agent => {
    const agentMetrics = metrics.filter(m => m.agent_name === agent.name).slice(0, 50);
    const errorRate = agentMetrics.length > 0 
        ? (agentMetrics.filter(m => m.status === 'failure').length / agentMetrics.length * 100).toFixed(1)
        : 0;
    const avgTime = agentMetrics.length > 0
        ? (agentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / agentMetrics.length / 1000).toFixed(2)
        : 0;
    return `- ${agent.name}: ${errorRate}% errors, ${avgTime}s avg time`;
}).join('\n')}

Workflow Execution Trends:
- Running: ${executions.filter(e => e.status === 'running').length}
- Completed: ${executions.filter(e => e.status === 'completed').length}
- Failed: ${executions.filter(e => e.status === 'failed').length}

Based on these trends, predict:
1. Which agents are likely to experience failures soon
2. Which workflows might fail or timeout
3. Potential overload scenarios
4. Resource constraints that may occur

For each prediction, provide:
- Target (agent/workflow name)
- Type (failure, overload, timeout, resource_constraint)
- Probability (0-100)
- Timeframe (hours until likely occurrence)
- Reason (why this is predicted)
- Prevention steps`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        predictions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    target_name: { type: "string" },
                                    target_type: { type: "string" },
                                    prediction_type: { type: "string" },
                                    probability: { type: "number" },
                                    timeframe_hours: { type: "number" },
                                    reason: { type: "string" },
                                    prevention_steps: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            });

            // Create prediction alerts
            for (const pred of result.predictions) {
                if (pred.probability > 60) {
                    await base44.entities.MonitoringAlert.create({
                        alert_type: 'prediction',
                        severity: pred.probability > 80 ? 'high' : 'medium',
                        target_type: pred.target_type,
                        target_name: pred.target_name,
                        title: `Predicted ${pred.prediction_type}: ${pred.target_name}`,
                        message: `${pred.probability}% probability within ${pred.timeframe_hours}h`,
                        ai_analysis: pred.reason,
                        recommended_actions: pred.prevention_steps,
                        status: 'active'
                    });
                }
            }

            setPredictions(result.predictions);
            toast.success('Predictions generated');
            await onPredictionGenerated();
        } catch (error) {
            console.error('Failed to generate predictions:', error);
            toast.error('Failed to generate predictions');
        } finally {
            setGenerating(false);
        }
    };

    const getProbabilityColor = (prob) => {
        if (prob >= 80) return 'bg-red-100 text-red-700';
        if (prob >= 60) return 'bg-orange-100 text-orange-700';
        if (prob >= 40) return 'bg-yellow-100 text-yellow-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="space-y-6">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                AI Predictive Analytics
                            </h3>
                            <p className="text-sm text-slate-600">
                                Forecast potential issues before they occur based on current trends
                            </p>
                        </div>
                        <Button onClick={generatePredictions} disabled={generating}>
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Predictions
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {predictions.length > 0 && (
                <div className="space-y-4">
                    {predictions.map((pred, idx) => (
                        <Card key={idx} className="border-2">
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-orange-600 mt-1" />
                                        <div>
                                            <h3 className="font-semibold">
                                                {pred.prediction_type.replace('_', ' ').toUpperCase()}: {pred.target_name}
                                            </h3>
                                            <p className="text-sm text-slate-600 mt-1">{pred.reason}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={getProbabilityColor(pred.probability)}>
                                            {pred.probability}% likely
                                        </Badge>
                                        <span className="text-xs text-slate-500">
                                            Within {pred.timeframe_hours}h
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">Prevention Steps:</p>
                                    <ul className="space-y-1">
                                        {pred.prevention_steps?.map((step, i) => (
                                            <li key={i} className="text-xs text-blue-700 flex items-start gap-1">
                                                <span>•</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}