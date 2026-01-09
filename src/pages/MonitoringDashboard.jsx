import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, TrendingUp, Zap, Workflow, Bot } from 'lucide-react';
import { toast } from 'sonner';
import RealTimeMetrics from '../components/monitoring/RealTimeMetrics';
import AnomalyDetector from '../components/monitoring/AnomalyDetector';
import PredictiveInsights from '../components/monitoring/PredictiveInsights';
import AlertsPanel from '../components/monitoring/AlertsPanel';
import WorkflowExecutionMonitor from '../components/monitoring/WorkflowExecutionMonitor';
import AgentHealthMonitor from '../components/monitoring/AgentHealthMonitor';
import BottleneckAnalyzer from '../components/monitoring/BottleneckAnalyzer';
import CriticalAlertSystem from '../components/monitoring/CriticalAlertSystem';

export default function MonitoringDashboardPage() {
    const [agents, setAgents] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [agentsList, workflowsList, alertsList, metricsList, executionsList] = await Promise.all([
                base44.agents.listAgents(),
                base44.entities.Workflow.list(),
                base44.entities.MonitoringAlert.filter({ status: 'active' }, '-created_date', 50),
                base44.entities.AgentPerformanceMetric.list('-created_date', 500),
                base44.entities.WorkflowExecution.list('-created_date', 100)
            ]);

            setAgents(agentsList || []);
            setWorkflows(workflowsList || []);
            setAlerts(alertsList || []);
            setMetrics(metricsList || []);
            setExecutions(executionsList || []);
        } catch (error) {
            console.error('Failed to load monitoring data:', error);
            toast.error('Failed to load monitoring data');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledgeAlert = async (alertId) => {
        try {
            await base44.entities.MonitoringAlert.update(alertId, {
                status: 'acknowledged'
            });
            await loadData();
            toast.success('Alert acknowledged');
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            toast.error('Failed to acknowledge alert');
        }
    };

    const handleResolveAlert = async (alertId) => {
        try {
            const user = await base44.auth.me();
            await base44.entities.MonitoringAlert.update(alertId, {
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                resolved_by: user.email
            });
            await loadData();
            toast.success('Alert resolved');
        } catch (error) {
            console.error('Failed to resolve alert:', error);
            toast.error('Failed to resolve alert');
        }
    };

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const activeWorkflows = executions.filter(e => e.status === 'running').length;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading monitoring dashboard...</p>
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
                            AI Monitoring Dashboard
                        </h1>
                        <p className="text-slate-600 mt-1">Real-time performance monitoring and anomaly detection</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-slate-600">Live</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Agents</p>
                                    <p className="text-3xl font-bold text-slate-800">{agents.length}</p>
                                </div>
                                <Zap className="h-10 w-10 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Running Workflows</p>
                                    <p className="text-3xl font-bold text-slate-800">{activeWorkflows}</p>
                                </div>
                                <Activity className="h-10 w-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Alerts</p>
                                    <p className="text-3xl font-bold text-slate-800">{alerts.length}</p>
                                </div>
                                <AlertTriangle className="h-10 w-10 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={criticalAlerts > 0 ? 'border-2 border-red-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Critical Issues</p>
                                    <p className="text-3xl font-bold text-red-600">{criticalAlerts}</p>
                                </div>
                                <AlertTriangle className="h-10 w-10 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview">
                    <TabsList className="bg-white">
                        <TabsTrigger value="overview">
                            <Activity className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="workflows">
                            <Workflow className="h-4 w-4 mr-2" />
                            Workflows
                        </TabsTrigger>
                        <TabsTrigger value="agents">
                            <Bot className="h-4 w-4 mr-2" />
                            Agents
                        </TabsTrigger>
                        <TabsTrigger value="metrics">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Real-Time Metrics
                        </TabsTrigger>
                        <TabsTrigger value="anomalies">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Anomaly Detection
                        </TabsTrigger>
                        <TabsTrigger value="predictions">
                            <Activity className="h-4 w-4 mr-2" />
                            Predictive Insights
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            <Zap className="h-4 w-4 mr-2" />
                            Alerts ({alerts.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <CriticalAlertSystem />
                            <BottleneckAnalyzer />
                        </div>
                        <RealTimeMetrics 
                            agents={agents}
                            workflows={workflows}
                            metrics={metrics}
                            executions={executions}
                        />
                    </TabsContent>

                    <TabsContent value="workflows" className="mt-6">
                        <WorkflowExecutionMonitor />
                    </TabsContent>

                    <TabsContent value="agents" className="mt-6">
                        <AgentHealthMonitor />
                    </TabsContent>

                    <TabsContent value="metrics" className="mt-6">
                        <RealTimeMetrics 
                            agents={agents}
                            workflows={workflows}
                            metrics={metrics}
                            executions={executions}
                        />
                    </TabsContent>

                    <TabsContent value="anomalies" className="mt-6">
                        <AnomalyDetector
                            agents={agents}
                            metrics={metrics}
                            executions={executions}
                            onAlertGenerated={loadData}
                        />
                    </TabsContent>

                    <TabsContent value="predictions" className="mt-6">
                        <PredictiveInsights
                            agents={agents}
                            workflows={workflows}
                            metrics={metrics}
                            executions={executions}
                            onPredictionGenerated={loadData}
                        />
                    </TabsContent>

                    <TabsContent value="alerts" className="mt-6">
                        <AlertsPanel
                            alerts={alerts}
                            onAcknowledge={handleAcknowledgeAlert}
                            onResolve={handleResolveAlert}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}