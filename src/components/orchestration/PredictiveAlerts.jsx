import { useState, useEffect } from 'react';
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function PredictiveAlerts({ orchestrations, metrics, thresholds }) {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        analyzeAndPredict();
    }, [orchestrations, metrics, thresholds]);

    const analyzeAndPredict = () => {
        const newAlerts = [];
        const recentMetrics = metrics.slice(0, 50);

        // Analyze agent performance trends
        const agentPerformance = {};
        recentMetrics.forEach(metric => {
            if (!agentPerformance[metric.agent_name]) {
                agentPerformance[metric.agent_name] = {
                    failures: 0,
                    total: 0,
                    totalTime: 0,
                    recent: []
                };
            }
            agentPerformance[metric.agent_name].total++;
            if (metric.status === 'failure') {
                agentPerformance[metric.agent_name].failures++;
            }
            if (metric.execution_time_ms) {
                agentPerformance[metric.agent_name].totalTime += metric.execution_time_ms;
            }
            agentPerformance[metric.agent_name].recent.push(metric);
        });

        // Check for degrading performance
        Object.entries(agentPerformance).forEach(([agent, data]) => {
            const failureRate = (data.failures / data.total) * 100;
            const avgTime = data.totalTime / data.total / 1000;

            if (failureRate > thresholds.errorRate) {
                newAlerts.push({
                    severity: 'high',
                    type: 'error_rate',
                    agent,
                    message: `${agent} error rate at ${failureRate.toFixed(0)}%`,
                    prediction: 'Likely to cause workflow disruptions'
                });
            }

            if (avgTime > thresholds.responseTime) {
                newAlerts.push({
                    severity: 'medium',
                    type: 'slow_response',
                    agent,
                    message: `${agent} averaging ${avgTime.toFixed(1)}s response time`,
                    prediction: 'May cause delays in orchestration'
                });
            }

            // Check for degrading trend (last 10 vs previous 10)
            if (data.recent.length >= 20) {
                const recent10 = data.recent.slice(0, 10);
                const previous10 = data.recent.slice(10, 20);
                
                const recentFailures = recent10.filter(m => m.status === 'failure').length;
                const previousFailures = previous10.filter(m => m.status === 'failure').length;
                
                if (recentFailures > previousFailures * 1.5 && recentFailures > 2) {
                    newAlerts.push({
                        severity: 'medium',
                        type: 'degrading_performance',
                        agent,
                        message: `${agent} performance degrading`,
                        prediction: 'Trend indicates increasing failures'
                    });
                }
            }
        });

        // Check for bottleneck patterns
        const orchestrationMetrics = {};
        metrics.forEach(m => {
            if (m.workflow_id) {
                if (!orchestrationMetrics[m.workflow_id]) {
                    orchestrationMetrics[m.workflow_id] = { count: 0, avgTime: 0 };
                }
                orchestrationMetrics[m.workflow_id].count++;
                if (m.execution_time_ms) {
                    orchestrationMetrics[m.workflow_id].avgTime += m.execution_time_ms;
                }
            }
        });

        Object.entries(orchestrationMetrics).forEach(([id, data]) => {
            const avgTime = data.avgTime / data.count / 1000;
            if (avgTime > thresholds.responseTime * 2) {
                const orch = orchestrations.find(o => o.id === id);
                if (orch) {
                    newAlerts.push({
                        severity: 'high',
                        type: 'bottleneck',
                        orchestration: orch.name,
                        message: `Bottleneck detected in ${orch.name}`,
                        prediction: `Average execution time: ${avgTime.toFixed(1)}s`
                    });
                }
            }
        });

        setAlerts(newAlerts);
    };

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-2">
            {alerts.map((alert, idx) => (
                <Alert key={idx} className={
                    alert.severity === 'high' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                }>
                    <div className="flex items-start gap-3">
                        {alert.severity === 'high' ? (
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-sm">
                                    {alert.message}
                                </p>
                                <Badge className={
                                    alert.severity === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                                }>
                                    {alert.severity}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-600">{alert.prediction}</p>
                        </div>
                    </div>
                </Alert>
            ))}
        </div>
    );
}