import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PerformanceAnalysisEngine({ workflow, executions, onProposedImprovement }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (executions.length >= 5) {
            analyzePerformance();
        }
    }, [executions.length]);

    const analyzePerformance = async () => {
        setLoading(true);
        try {
            const stats = calculateStats();
            
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze workflow performance and propose iterative improvements.

Workflow: ${workflow.name}
Total Executions: ${executions.length}
Success Rate: ${stats.successRate}%
Average Time: ${stats.avgTime}ms
Failure Points: ${JSON.stringify(stats.failurePoints)}
Slowest Nodes: ${JSON.stringify(stats.slowestNodes)}

Based on this data, propose specific improvements that will:
1. Increase success rate
2. Reduce execution time
3. Minimize failures

Provide 2-3 concrete, implementable improvements with expected impact.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        improvements: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    expected_impact: { type: "string" },
                                    implementation_steps: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    metrics_to_track: {
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                }
                            }
                        },
                        overall_assessment: { type: "string" }
                    }
                }
            });

            setAnalysis({ ...result, stats });
        } catch (error) {
            console.error('Failed to analyze performance:', error);
            toast.error('Failed to analyze performance');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const successful = executions.filter(e => e.status === 'completed').length;
        const successRate = (successful / executions.length) * 100;

        const times = executions
            .filter(e => e.node_results?.length > 0)
            .map(e => {
                const results = e.node_results;
                if (results[0]?.started_at && results[results.length - 1]?.completed_at) {
                    return new Date(results[results.length - 1].completed_at) - new Date(results[0].started_at);
                }
                return 0;
            })
            .filter(t => t > 0);
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

        const failurePoints = {};
        executions.forEach(exec => {
            exec.node_results?.forEach(node => {
                if (node.status === 'failed' || node.error) {
                    failurePoints[node.node_id] = (failurePoints[node.node_id] || 0) + 1;
                }
            });
        });

        const nodeTimes = {};
        executions.forEach(exec => {
            exec.node_results?.forEach(node => {
                if (node.started_at && node.completed_at) {
                    const time = new Date(node.completed_at) - new Date(node.started_at);
                    if (!nodeTimes[node.node_id]) nodeTimes[node.node_id] = [];
                    nodeTimes[node.node_id].push(time);
                }
            });
        });

        const slowestNodes = Object.entries(nodeTimes)
            .map(([id, times]) => ({
                id,
                avgTime: times.reduce((a, b) => a + b, 0) / times.length
            }))
            .sort((a, b) => b.avgTime - a.avgTime)
            .slice(0, 3);

        return { successRate, avgTime, failurePoints, slowestNodes };
    };

    const getPerformanceTrend = () => {
        return executions.slice(-10).map((exec, idx) => ({
            execution: idx + 1,
            success: exec.status === 'completed' ? 1 : 0
        }));
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-12 pb-12 text-center">
                    <Activity className="h-12 w-12 text-blue-600 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-slate-600">Analyzing performance...</p>
                </CardContent>
            </Card>
        );
    }

    if (!analysis && executions.length < 5) {
        return (
            <Card>
                <CardContent className="pt-12 pb-12 text-center">
                    <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Run at least 5 executions to analyze performance</p>
                </CardContent>
            </Card>
        );
    }

    if (!analysis) return null;

    return (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Performance Analysis & Improvements
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Success Rate</p>
                        <p className="text-2xl font-bold text-slate-800">{analysis.stats.successRate.toFixed(1)}%</p>
                        <Progress value={analysis.stats.successRate} className="mt-2" />
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Avg Time</p>
                        <p className="text-2xl font-bold text-slate-800">{(analysis.stats.avgTime / 1000).toFixed(1)}s</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Total Runs</p>
                        <p className="text-2xl font-bold text-slate-800">{executions.length}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-3">Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={getPerformanceTrend()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="execution" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="success" stroke="#10b981" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">Overall Assessment</h3>
                    <p className="text-sm text-slate-700">{analysis.overall_assessment}</p>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Proposed Improvements</h3>
                    {analysis.improvements?.map((improvement, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border-2 border-green-200">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold">{improvement.title}</h4>
                                <Badge className="bg-green-600">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {improvement.expected_impact}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{improvement.description}</p>
                            
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-700">Implementation Steps:</p>
                                {improvement.implementation_steps?.map((step, stepIdx) => (
                                    <div key={stepIdx} className="flex items-start gap-2 text-xs text-slate-600">
                                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                size="sm"
                                className="w-full mt-3 bg-green-600 hover:bg-green-700"
                                onClick={() => onProposedImprovement(improvement)}
                            >
                                Apply Improvement
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}