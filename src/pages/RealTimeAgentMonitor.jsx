import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AgentStatusGrid from '../components/monitoring/AgentStatusGrid';
import AgentTasksTimeline from '../components/monitoring/AgentTasksTimeline';
import PerformanceMetricsPanel from '../components/monitoring/PerformanceMetricsPanel';
import AlertsPanel from '../components/monitoring/AlertsPanel';
import { toast } from 'sonner';

export default function RealTimeAgentMonitorPage() {
    const [agents, setAgents] = useState([]);
    const [agentStatuses, setAgentStatuses] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000); // Real-time updates every 3s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [agentsList, statusList, metricsList, alertsList] = await Promise.all([
                base44.agents.listAgents(),
                base44.entities.AgentStatus.list('-updated_date'),
                base44.entities.AgentPerformanceMetric.list('-created_date', 500),
                base44.entities.AgentAlert.filter({ status: 'open' })
            ]);
            
            setAgents(agentsList || []);
            setAgentStatuses(statusList || []);
            setMetrics(metricsList || []);
            setAlerts(alertsList || []);

            // Check for idle agents and update statuses
            await checkAgentHealth(agentsList, statusList, metricsList);
        } catch (error) {
            console.error('Failed to load monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkAgentHealth = async (agentsList, statusList, metricsList) => {
        const now = new Date();
        
        for (const agent of agentsList) {
            const status = statusList.find(s => s.agent_name === agent.name);
            const recentMetrics = metricsList.filter(m => 
                m.agent_name === agent.name && 
                new Date(m.created_date) > new Date(now - 24 * 60 * 60 * 1000)
            );

            const alerts = [];
            let healthScore = 100;

            // Check for idle too long (> 30 minutes)
            if (status?.idle_since) {
                const idleMinutes = (now - new Date(status.idle_since)) / 1000 / 60;
                if (idleMinutes > 30) {
                    alerts.push({
                        type: 'idle_too_long',
                        message: `Idle for ${Math.round(idleMinutes)} minutes`,
                        severity: idleMinutes > 60 ? 'high' : 'medium',
                        triggered_at: new Date().toISOString()
                    });
                    healthScore -= 20;
                }
            }

            // Check failure rate
            const failureRate = recentMetrics.filter(m => m.status === 'failure').length / Math.max(recentMetrics.length, 1);
            if (failureRate > 0.3) {
                alerts.push({
                    type: 'high_failure_rate',
                    message: `${Math.round(failureRate * 100)}% failure rate`,
                    severity: failureRate > 0.5 ? 'critical' : 'high',
                    triggered_at: new Date().toISOString()
                });
                healthScore -= 30;
            }

            // Update status if needed
            if (status && (alerts.length > 0 || status.alerts?.length !== alerts.length)) {
                await base44.entities.AgentStatus.update(status.id, {
                    alerts,
                    health_score: Math.max(0, healthScore),
                    last_activity: new Date().toISOString()
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading agent monitor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Real-Time Agent Monitor
                        </h1>
                        <p className="text-slate-600 mt-1">Live agent status and performance tracking</p>
                    </div>
                    <Button onClick={loadData} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <AlertsPanel alerts={alerts} onDismiss={loadData} />
                )}

                {/* Agent Status Grid */}
                <AgentStatusGrid
                    agents={agents}
                    statuses={agentStatuses}
                    metrics={metrics}
                />

                {/* Performance Metrics */}
                <PerformanceMetricsPanel
                    agents={agents}
                    metrics={metrics}
                />

                {/* Tasks Timeline */}
                <AgentTasksTimeline
                    agents={agents}
                    statuses={agentStatuses}
                />
            </div>
        </div>
    );
}