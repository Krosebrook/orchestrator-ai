import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomatedRollbackMonitor({ agentName, deployedVersion, onRollbackTriggered }) {
    const [monitoring, setMonitoring] = useState(false);
    const [metrics, setMetrics] = useState([]);
    const [issues, setIssues] = useState([]);

    useEffect(() => {
        if (!deployedVersion) return;

        setMonitoring(true);
        const interval = setInterval(checkHealth, 30000); // Check every 30s

        // Initial check
        checkHealth();

        return () => {
            clearInterval(interval);
            setMonitoring(false);
        };
    }, [deployedVersion, agentName]);

    const checkHealth = async () => {
        try {
            const recentMetrics = await base44.entities.AgentPerformanceMetric.filter(
                { agent_name: agentName },
                '-created_date',
                20
            );

            setMetrics(recentMetrics);

            const errorRate = recentMetrics.length > 0
                ? (recentMetrics.filter(m => m.status === 'failure').length / recentMetrics.length * 100)
                : 0;

            const avgResponseTime = recentMetrics.length > 0
                ? recentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / recentMetrics.length
                : 0;

            const detectedIssues = [];

            // Critical: Error rate > 50%
            if (errorRate > 50) {
                detectedIssues.push({
                    severity: 'critical',
                    message: `Critical error rate: ${errorRate.toFixed(1)}%`,
                    metric: 'error_rate',
                    value: errorRate
                });
            }

            // High: Error rate > 30%
            if (errorRate > 30 && errorRate <= 50) {
                detectedIssues.push({
                    severity: 'high',
                    message: `High error rate: ${errorRate.toFixed(1)}%`,
                    metric: 'error_rate',
                    value: errorRate
                });
            }

            // Response time > 10s
            if (avgResponseTime > 10000) {
                detectedIssues.push({
                    severity: 'critical',
                    message: `Severe performance degradation: ${(avgResponseTime / 1000).toFixed(2)}s`,
                    metric: 'response_time',
                    value: avgResponseTime
                });
            }

            setIssues(detectedIssues);

            // Auto-rollback on critical issues
            const criticalIssues = detectedIssues.filter(i => i.severity === 'critical');
            if (criticalIssues.length > 0) {
                await triggerAutoRollback(criticalIssues);
            }

        } catch (error) {
            console.error('Health check failed:', error);
        }
    };

    const triggerAutoRollback = async (criticalIssues) => {
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Critical issues detected after deploying agent ${agentName} version ${deployedVersion?.version}.

Issues:
${criticalIssues.map(i => `- ${i.message}`).join('\n')}

Should we automatically rollback? Consider:
1. Severity of issues
2. Impact on production
3. Availability of previous stable version`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        should_rollback: { type: "boolean" },
                        reason: { type: "string" }
                    }
                }
            });

            if (result.should_rollback) {
                await base44.entities.MonitoringAlert.create({
                    alert_type: 'anomaly',
                    severity: 'critical',
                    target_type: 'agent',
                    target_name: agentName,
                    title: `AUTO-ROLLBACK TRIGGERED: ${agentName}`,
                    message: `Version ${deployedVersion.version} rolled back due to critical issues`,
                    ai_analysis: result.reason,
                    recommended_actions: ['Investigate deployment issues', 'Review version changes'],
                    status: 'active'
                });

                toast.error(`Auto-rollback triggered for ${agentName}`, {
                    description: result.reason
                });

                await onRollbackTriggered(deployedVersion, criticalIssues);
            }
        } catch (error) {
            console.error('Auto-rollback failed:', error);
        }
    };

    if (!monitoring) return null;

    return (
        <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                        Automated Monitoring Active
                    </h3>
                    <Badge className="bg-blue-600">Live</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded">
                        <p className="text-slate-600">Checks</p>
                        <p className="font-semibold">{metrics.length}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                        <p className="text-slate-600">Issues</p>
                        <p className={`font-semibold ${issues.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {issues.length}
                        </p>
                    </div>
                </div>

                {issues.length > 0 && (
                    <div className="space-y-2">
                        {issues.map((issue, idx) => (
                            <div key={idx} className={`p-2 rounded border ${
                                issue.severity === 'critical' 
                                    ? 'bg-red-50 border-red-300' 
                                    : 'bg-yellow-50 border-yellow-300'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={`h-3 w-3 ${
                                        issue.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                                    }`} />
                                    <p className={`text-xs font-medium ${
                                        issue.severity === 'critical' ? 'text-red-900' : 'text-yellow-900'
                                    }`}>
                                        {issue.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white p-2 rounded border border-blue-200">
                    <div className="flex items-center gap-2 text-xs">
                        <RotateCcw className="h-3 w-3 text-blue-600" />
                        <span className="text-slate-600">
                            Auto-rollback enabled (triggers at 50%+ error rate or 10s+ response time)
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}