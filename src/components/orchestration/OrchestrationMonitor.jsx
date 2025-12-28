import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Clock, CheckCircle, XCircle, ArrowRight, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RealTimeMetricsChart from './RealTimeMetricsChart';
import PredictiveAlerts from './PredictiveAlerts';
import PerformanceThresholdSettings from './PerformanceThresholdSettings';
import { toast } from 'sonner';

export default function OrchestrationMonitor({ orchestrations, handoffs }) {
    const [metrics, setMetrics] = useState([]);
    const [thresholds, setThresholds] = useState({
        responseTime: 5,
        successRate: 80,
        errorRate: 20,
        handoffTime: 3
    });
    const [showSettings, setShowSettings] = useState(false);
    const [bottlenecks, setBottlenecks] = useState([]);
    const recentHandoffs = handoffs.slice(0, 20);

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        identifyBottlenecks();
    }, [metrics, thresholds]);

    const loadMetrics = async () => {
        try {
            const metricsData = await base44.entities.AgentPerformanceMetric.list('-updated_date', 200);
            setMetrics(metricsData || []);
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    };

    const identifyBottlenecks = () => {
        const agentStats = {};
        
        metrics.slice(0, 100).forEach(m => {
            if (!agentStats[m.agent_name]) {
                agentStats[m.agent_name] = { total: 0, failures: 0, totalTime: 0, count: 0 };
            }
            agentStats[m.agent_name].total++;
            if (m.status === 'failure') agentStats[m.agent_name].failures++;
            if (m.execution_time_ms) {
                agentStats[m.agent_name].totalTime += m.execution_time_ms;
                agentStats[m.agent_name].count++;
            }
        });

        const detected = [];
        Object.entries(agentStats).forEach(([agent, stats]) => {
            const avgTime = stats.count > 0 ? stats.totalTime / stats.count / 1000 : 0;
            const errorRate = (stats.failures / stats.total) * 100;

            if (avgTime > thresholds.responseTime) {
                detected.push({
                    agent,
                    type: 'slow_response',
                    value: `${avgTime.toFixed(1)}s`,
                    severity: 'medium'
                });
            }
            if (errorRate > thresholds.errorRate) {
                detected.push({
                    agent,
                    type: 'high_errors',
                    value: `${errorRate.toFixed(0)}%`,
                    severity: 'high'
                });
            }
        });

        setBottlenecks(detected);
    };

    const handleSaveThresholds = (newThresholds) => {
        setThresholds(newThresholds);
        setShowSettings(false);
        toast.success('Thresholds updated');
    };

    return (
        <div className="space-y-6">
            {/* Header with Settings */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Live Monitoring Dashboard</h2>
                    <p className="text-sm text-slate-600">Real-time performance metrics and alerts</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Thresholds
                </Button>
            </div>

            {/* Predictive Alerts */}
            <PredictiveAlerts 
                orchestrations={orchestrations}
                metrics={metrics}
                thresholds={thresholds}
            />

            {/* Bottlenecks */}
            {bottlenecks.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Detected Bottlenecks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {bottlenecks.map((bottleneck, idx) => (
                                <div key={idx} className="p-3 bg-white rounded border border-yellow-200">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm">{bottleneck.agent}</p>
                                        <Badge className={
                                            bottleneck.severity === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                                        }>
                                            {bottleneck.type === 'slow_response' ? 'Slow' : 'Errors'}
                                        </Badge>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 mt-1">{bottleneck.value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs for different views */}
            <Tabs defaultValue="metrics">
                <TabsList>
                    <TabsTrigger value="metrics">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance Metrics
                    </TabsTrigger>
                    <TabsTrigger value="live">
                        <Activity className="h-4 w-4 mr-2" />
                        Live Activity
                    </TabsTrigger>
                    {showSettings && (
                        <TabsTrigger value="settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="metrics" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <RealTimeMetricsChart metrics={metrics} type="response_time" />
                        <RealTimeMetricsChart metrics={metrics} type="success_rate" />
                    </div>
                    <RealTimeMetricsChart metrics={metrics} type="errors" />
                </TabsContent>

                <TabsContent value="live" className="mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Active Orchestrations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {orchestrations.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-8">
                                        No active orchestrations
                                    </p>
                                ) : (
                                    <ScrollArea className="h-[400px]">
                                        <div className="space-y-3">
                                            {orchestrations.map((orch) => (
                                                <div key={orch.id} className="p-3 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-semibold">{orch.name}</p>
                                                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-600 flex-wrap">
                                                        {orch.agents?.map((agent, idx) => (
                                                            <span key={idx} className="flex items-center">
                                                                {agent.agent_name}
                                                                {idx < orch.agents.length - 1 && (
                                                                    <ArrowRight className="h-3 w-3 mx-1" />
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Recent Handoffs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {recentHandoffs.map((handoff) => (
                                            <div key={handoff.id} className="p-3 border rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium">{handoff.from_agent}</span>
                                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                                        <span className="font-medium">{handoff.to_agent}</span>
                                                    </div>
                                                    {handoff.status === 'completed' ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : handoff.status === 'failed' ? (
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                    )}
                                                </div>
                                                {handoff.handoff_reason && (
                                                    <p className="text-xs text-slate-600 mb-1">{handoff.handoff_reason}</p>
                                                )}
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>
                                                        {formatDistanceToNow(new Date(handoff.created_date), { addSuffix: true })}
                                                    </span>
                                                    {handoff.execution_time_ms && (
                                                        <span>{(handoff.execution_time_ms / 1000).toFixed(2)}s</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {showSettings && (
                    <TabsContent value="settings" className="mt-4">
                        <PerformanceThresholdSettings 
                            thresholds={thresholds}
                            onSave={handleSaveThresholds}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}