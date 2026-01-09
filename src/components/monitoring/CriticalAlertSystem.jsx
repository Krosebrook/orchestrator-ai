import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, AlertTriangle, XCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function CriticalAlertSystem() {
    const [alerts, setAlerts] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());

    useEffect(() => {
        checkAlerts();
        const interval = setInterval(checkAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkAlerts = async () => {
        try {
            const [executions, errors, agents, profiles] = await Promise.all([
                base44.entities.WorkflowExecution.list('-updated_date', 50),
                base44.entities.AgentErrorLog.list('-created_date', 50),
                base44.agents.listAgents(),
                base44.entities.AgentProfile.list()
            ]);

            const newAlerts = [];

            // Critical: Recent workflow failures
            const recentFailures = executions.filter(e => 
                e.status === 'failed' && 
                new Date(e.updated_date) > new Date(Date.now() - 600000) // Last 10 min
            );

            if (recentFailures.length >= 3) {
                const alertId = `workflow_failure_${Date.now()}`;
                if (!dismissed.has(alertId)) {
                    newAlerts.push({
                        id: alertId,
                        type: 'critical',
                        category: 'workflow_failure',
                        title: 'Multiple Workflow Failures',
                        message: `${recentFailures.length} workflows failed in the last 10 minutes`,
                        timestamp: new Date().toISOString(),
                        action: 'Review failed workflows and error logs'
                    });

                    toast.error('Critical Alert: Multiple Workflow Failures', {
                        description: `${recentFailures.length} workflows failed recently`,
                        duration: 10000
                    });
                }
            }

            // Critical: Unresolved errors spike
            const unresolvedErrors = errors.filter(e => !e.resolved);
            if (unresolvedErrors.length >= 10) {
                const alertId = `error_spike_${Date.now()}`;
                if (!dismissed.has(alertId)) {
                    newAlerts.push({
                        id: alertId,
                        type: 'critical',
                        category: 'error_spike',
                        title: 'High Error Count',
                        message: `${unresolvedErrors.length} unresolved errors detected`,
                        timestamp: new Date().toISOString(),
                        action: 'Investigate error logs and implement fixes'
                    });

                    toast.error('Critical Alert: High Error Count', {
                        description: `${unresolvedErrors.length} unresolved errors`,
                        duration: 10000
                    });
                }
            }

            // Warning: Agent performance degradation
            for (const agent of agents) {
                const profile = profiles.find(p => p.agent_name === agent.name);
                const successRate = profile?.performance_stats?.success_rate || 1;
                
                if (successRate < 0.7) {
                    const alertId = `agent_degradation_${agent.name}`;
                    if (!dismissed.has(alertId)) {
                        newAlerts.push({
                            id: alertId,
                            type: 'warning',
                            category: 'performance_degradation',
                            title: `Agent Performance Degraded: ${agent.name}`,
                            message: `Success rate dropped to ${(successRate * 100).toFixed(0)}%`,
                            timestamp: new Date().toISOString(),
                            action: 'Review agent configuration and recent errors'
                        });

                        toast.warning(`Performance Alert: ${agent.name}`, {
                            description: `Success rate: ${(successRate * 100).toFixed(0)}%`,
                            duration: 8000
                        });
                    }
                }
            }

            // Critical: Workflow execution stuck
            const stuckExecutions = executions.filter(e => 
                e.status === 'running' && 
                new Date(e.updated_date) < new Date(Date.now() - 1800000) // No update in 30 min
            );

            if (stuckExecutions.length > 0) {
                const alertId = `stuck_execution_${Date.now()}`;
                if (!dismissed.has(alertId)) {
                    newAlerts.push({
                        id: alertId,
                        type: 'critical',
                        category: 'stuck_execution',
                        title: 'Stuck Workflow Executions',
                        message: `${stuckExecutions.length} workflows have not progressed in 30+ minutes`,
                        timestamp: new Date().toISOString(),
                        action: 'Manual intervention may be required'
                    });

                    toast.error('Critical Alert: Stuck Workflows', {
                        description: `${stuckExecutions.length} workflows not progressing`,
                        duration: 10000
                    });
                }
            }

            setAlerts(prev => {
                const combined = [...prev, ...newAlerts];
                // Keep only last 20 alerts
                return combined.slice(-20);
            });

        } catch (error) {
            console.error('Alert check failed:', error);
        }
    };

    const dismissAlert = (alertId) => {
        setDismissed(prev => new Set([...prev, alertId]));
    };

    const clearAllAlerts = () => {
        alerts.forEach(alert => dismissAlert(alert.id));
    };

    const activeAlerts = alerts.filter(a => !dismissed.has(a.id));
    const criticalCount = activeAlerts.filter(a => a.type === 'critical').length;
    const warningCount = activeAlerts.filter(a => a.type === 'warning').length;

    const getAlertColor = (type) => {
        switch (type) {
            case 'critical': return 'border-red-500 bg-red-50';
            case 'warning': return 'border-yellow-500 bg-yellow-50';
            default: return 'border-blue-500 bg-blue-50';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default: return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <Card className={cn(
            "border-2",
            criticalCount > 0 ? "border-red-300" : warningCount > 0 ? "border-yellow-300" : ""
        )}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Critical Alerts
                        {activeAlerts.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {activeAlerts.length}
                            </Badge>
                        )}
                    </CardTitle>
                    {activeAlerts.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearAllAlerts}
                        >
                            <BellOff className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>
                {(criticalCount > 0 || warningCount > 0) && (
                    <div className="flex gap-2 mt-2">
                        {criticalCount > 0 && (
                            <Badge variant="destructive">{criticalCount} Critical</Badge>
                        )}
                        {warningCount > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-700">{warningCount} Warning</Badge>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {activeAlerts.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">No active alerts</p>
                        <p className="text-xs text-slate-500">All systems operating normally</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeAlerts.map(alert => (
                            <div 
                                key={alert.id}
                                className={cn(
                                    "p-4 rounded-lg border-2 relative",
                                    getAlertColor(alert.type)
                                )}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => dismissAlert(alert.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                                <div className="flex items-start gap-3 pr-8">
                                    {getAlertIcon(alert.type)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {alert.type}
                                            </Badge>
                                        </div>
                                        <p className="text-sm mb-2">{alert.message}</p>
                                        <p className="text-xs text-slate-600 mb-2">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </p>
                                        <div className="bg-white/70 p-2 rounded text-xs">
                                            <strong>Action:</strong> {alert.action}
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