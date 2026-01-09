import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Clock, Zap, Loader2 } from 'lucide-react';

export default function BottleneckAnalyzer() {
    const [bottlenecks, setBottlenecks] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        analyzeBottlenecks();
        const interval = setInterval(analyzeBottlenecks, 30000);
        return () => clearInterval(interval);
    }, []);

    const analyzeBottlenecks = async () => {
        setAnalyzing(true);
        try {
            const [executions, metrics, workflows] = await Promise.all([
                base44.entities.WorkflowExecution.list('-updated_date', 100),
                base44.entities.AgentPerformanceMetric.list('-created_date', 500),
                base44.entities.Workflow.list()
            ]);

            const issues = [];

            // Analyze slow workflows
            const slowWorkflows = executions.filter(e => {
                if (e.status !== 'completed' || !e.created_date || !e.updated_date) return false;
                const duration = new Date(e.updated_date) - new Date(e.created_date);
                return duration > 300000; // > 5 minutes
            });

            if (slowWorkflows.length > 0) {
                const avgDuration = slowWorkflows.reduce((sum, e) => {
                    return sum + (new Date(e.updated_date) - new Date(e.created_date));
                }, 0) / slowWorkflows.length / 1000;

                issues.push({
                    type: 'slow_workflow',
                    severity: 'warning',
                    title: 'Slow Workflow Executions Detected',
                    description: `${slowWorkflows.length} workflows took longer than 5 minutes (avg: ${avgDuration.toFixed(0)}s)`,
                    affected: slowWorkflows.map(w => w.workflow_name).filter((v, i, a) => a.indexOf(v) === i).join(', '),
                    recommendation: 'Consider optimizing workflow steps or adding parallel execution'
                });
            }

            // Analyze agent overload
            const agentWorkload = {};
            metrics.filter(m => m.created_date > new Date(Date.now() - 3600000).toISOString()).forEach(m => {
                agentWorkload[m.agent_name] = (agentWorkload[m.agent_name] || 0) + 1;
            });

            const overloadedAgents = Object.entries(agentWorkload).filter(([_, count]) => count > 50);
            if (overloadedAgents.length > 0) {
                issues.push({
                    type: 'agent_overload',
                    severity: 'critical',
                    title: 'Agent Overload Detected',
                    description: `${overloadedAgents.length} agents handling excessive load (>50 tasks/hour)`,
                    affected: overloadedAgents.map(([name]) => name).join(', '),
                    recommendation: 'Distribute load across more agents or scale agent capacity'
                });
            }

            // Analyze high error rates
            const failedMetrics = metrics.filter(m => m.status === 'failure');
            const errorRate = failedMetrics.length / metrics.length;
            if (errorRate > 0.1) {
                issues.push({
                    type: 'high_error_rate',
                    severity: 'critical',
                    title: 'High Error Rate',
                    description: `Error rate at ${(errorRate * 100).toFixed(1)}% (${failedMetrics.length}/${metrics.length} operations failed)`,
                    affected: 'Multiple agents affected',
                    recommendation: 'Review error logs and implement retry mechanisms'
                });
            }

            // Analyze workflow failures
            const failedExecutions = executions.filter(e => e.status === 'failed');
            if (failedExecutions.length > executions.length * 0.15) {
                issues.push({
                    type: 'workflow_failures',
                    severity: 'warning',
                    title: 'Elevated Workflow Failure Rate',
                    description: `${failedExecutions.length} out of ${executions.length} workflows failed (${((failedExecutions.length / executions.length) * 100).toFixed(1)}%)`,
                    affected: failedExecutions.map(w => w.workflow_name).filter((v, i, a) => a.indexOf(v) === i).join(', '),
                    recommendation: 'Review workflow configurations and error handling strategies'
                });
            }

            // Analyze response time anomalies
            const recentMetrics = metrics.slice(0, 100);
            const avgResponseTime = recentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / recentMetrics.length;
            const slowMetrics = recentMetrics.filter(m => m.execution_time_ms > avgResponseTime * 3);
            
            if (slowMetrics.length > recentMetrics.length * 0.2) {
                issues.push({
                    type: 'response_time_anomaly',
                    severity: 'warning',
                    title: 'Response Time Anomalies',
                    description: `${slowMetrics.length} operations significantly slower than average (${avgResponseTime.toFixed(0)}ms)`,
                    affected: slowMetrics.map(m => m.agent_name).filter((v, i, a) => a.indexOf(v) === i).join(', '),
                    recommendation: 'Investigate slow operations and optimize agent performance'
                });
            }

            setBottlenecks(issues);
        } catch (error) {
            console.error('Bottleneck analysis failed:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'agent_overload': return <TrendingUp className="h-5 w-5" />;
            case 'slow_workflow': return <Clock className="h-5 w-5" />;
            case 'high_error_rate': return <AlertTriangle className="h-5 w-5" />;
            default: return <Zap className="h-5 w-5" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Bottleneck Analysis
                    </CardTitle>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={analyzeBottlenecks}
                        disabled={analyzing}
                    >
                        {analyzing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Refresh'
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {bottlenecks.length === 0 ? (
                    <div className="text-center py-8">
                        <Zap className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">No bottlenecks detected</p>
                        <p className="text-xs text-slate-500">System performance is optimal</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bottlenecks.map((issue, idx) => (
                            <div 
                                key={idx}
                                className={cn(
                                    "p-4 rounded-lg border-2",
                                    getSeverityColor(issue.severity)
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {getTypeIcon(issue.type)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">{issue.title}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {issue.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-sm mb-2">{issue.description}</p>
                                        <p className="text-xs mb-2">
                                            <strong>Affected:</strong> {issue.affected}
                                        </p>
                                        <div className="bg-white/50 p-2 rounded text-xs">
                                            <strong>💡 Recommendation:</strong> {issue.recommendation}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}