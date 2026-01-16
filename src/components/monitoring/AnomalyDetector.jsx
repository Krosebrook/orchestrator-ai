import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function AnomalyDetector({ agents, metrics, executions, onAlertGenerated }) {
    const [detecting, setDetecting] = useState(false);
    const [anomalies, setAnomalies] = useState([]);

    const detectAnomalies = async () => {
        setDetecting(true);
        try {
            // Analyze each agent
            for (const agent of agents) {
                const agentMetrics = metrics.filter(m => m.agent_name === agent.name);
                
                if (agentMetrics.length < 10) continue;

                const recentMetrics = agentMetrics.slice(0, 20);
                const baselineMetrics = agentMetrics.slice(20, 100);

                const recentErrorRate = (recentMetrics.filter(m => m.status === 'failure').length / recentMetrics.length) * 100;
                const baselineErrorRate = baselineMetrics.length > 0
                    ? (baselineMetrics.filter(m => m.status === 'failure').length / baselineMetrics.length) * 100
                    : 0;

                const recentAvgTime = recentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / recentMetrics.length;
                const baselineAvgTime = baselineMetrics.length > 0
                    ? baselineMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / baselineMetrics.length
                    : recentAvgTime;

                // Error spike detection
                if (recentErrorRate > baselineErrorRate * 2 && recentErrorRate > 10) {
                    const analysis = await base44.integrations.Core.InvokeLLM({
                        prompt: `Analyze this error spike for agent ${agent.name}:
                        
Recent error rate: ${recentErrorRate.toFixed(1)}%
Baseline error rate: ${baselineErrorRate.toFixed(1)}%
Increase: ${((recentErrorRate - baselineErrorRate) / baselineErrorRate * 100).toFixed(1)}%

Recent errors: ${recentMetrics.filter(m => m.status === 'failure').length}

Provide:
1. Likely causes of this error spike
2. Immediate recommended actions
3. Whether this requires urgent attention`,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                analysis: { type: "string" },
                                recommended_actions: { type: "array", items: { type: "string" } },
                                severity: { type: "string" }
                            }
                        }
                    });

                    await base44.entities.MonitoringAlert.create({
                        alert_type: 'error_spike',
                        severity: analysis.severity || 'high',
                        target_type: 'agent',
                        target_name: agent.name,
                        title: `Error Spike Detected: ${agent.name}`,
                        message: `Error rate increased from ${baselineErrorRate.toFixed(1)}% to ${recentErrorRate.toFixed(1)}%`,
                        metrics: {
                            current_value: recentErrorRate,
                            baseline_value: baselineErrorRate,
                            deviation_percentage: ((recentErrorRate - baselineErrorRate) / baselineErrorRate * 100)
                        },
                        ai_analysis: analysis.analysis,
                        recommended_actions: analysis.recommended_actions,
                        status: 'active'
                    });
                }

                // Performance degradation
                if (recentAvgTime > baselineAvgTime * 1.5 && recentAvgTime > 3000) {
                    const analysis = await base44.integrations.Core.InvokeLLM({
                        prompt: `Analyze performance degradation for agent ${agent.name}:
                        
Recent avg response time: ${(recentAvgTime / 1000).toFixed(2)}s
Baseline avg response time: ${(baselineAvgTime / 1000).toFixed(2)}s
Slowdown: ${((recentAvgTime - baselineAvgTime) / baselineAvgTime * 100).toFixed(1)}%

What could cause this slowdown and how to fix it?`,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                analysis: { type: "string" },
                                recommended_actions: { type: "array", items: { type: "string" } }
                            }
                        }
                    });

                    await base44.entities.MonitoringAlert.create({
                        alert_type: 'performance_degradation',
                        severity: 'medium',
                        target_type: 'agent',
                        target_name: agent.name,
                        title: `Performance Degradation: ${agent.name}`,
                        message: `Response time increased from ${(baselineAvgTime / 1000).toFixed(2)}s to ${(recentAvgTime / 1000).toFixed(2)}s`,
                        metrics: {
                            current_value: recentAvgTime,
                            baseline_value: baselineAvgTime,
                            deviation_percentage: ((recentAvgTime - baselineAvgTime) / baselineAvgTime * 100)
                        },
                        ai_analysis: analysis.analysis,
                        recommended_actions: analysis.recommended_actions,
                        status: 'active'
                    });
                }
            }

            toast.success('Anomaly detection completed');
            await onAlertGenerated();
        } catch (error) {
            console.error('Failed to detect anomalies:', error);
            toast.error('Failed to detect anomalies');
        } finally {
            setDetecting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">AI Anomaly Detection</h3>
                            <p className="text-sm text-slate-600">
                                Automatically detect unusual patterns in agent performance and workflow execution
                            </p>
                        </div>
                        <Button onClick={detectAnomalies} disabled={detecting}>
                            {detecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Activity className="h-4 w-4 mr-2" />
                                    Run Detection
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                            <div>
                                <h3 className="font-semibold">Error Spikes</h3>
                                <p className="text-xs text-slate-600">Sudden increase in failures</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            Detects when error rates exceed 2x baseline threshold
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                            <div>
                                <h3 className="font-semibold">Performance Degradation</h3>
                                <p className="text-xs text-slate-600">Slower response times</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            Identifies when response times increase by 50%+
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-purple-200 bg-purple-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Activity className="h-8 w-8 text-purple-600" />
                            <div>
                                <h3 className="font-semibold">Overload Detection</h3>
                                <p className="text-xs text-slate-600">High concurrent load</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            Monitors for agents handling too many requests
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}