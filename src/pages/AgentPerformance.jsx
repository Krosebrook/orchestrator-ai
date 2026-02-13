import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Clock, Star, AlertCircle, Download } from 'lucide-react';
import PerformanceOverview from '../components/performance/PerformanceOverview';
import TaskCompletionChart from '../components/performance/TaskCompletionChart';
import ApiCallsChart from '../components/performance/ApiCallsChart';
import ExecutionTimeChart from '../components/performance/ExecutionTimeChart';
import SatisfactionChart from '../components/performance/SatisfactionChart';
import MetricsTable from '../components/performance/MetricsTable';
import AutomatedPerformanceEvaluator from '../components/performance/AutomatedPerformanceEvaluator';

export default function AgentPerformancePage() {
    const [metrics, setMetrics] = useState([]);
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('all');
    const [timeRange, setTimeRange] = useState('7d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [selectedAgent, timeRange]);

    const loadData = async () => {
        try {
            const [metricsData, agentsData] = await Promise.all([
                base44.entities.AgentPerformanceMetric.list('-created_date', 500),
                base44.agents.listAgents()
            ]);
            
            let filteredMetrics = metricsData || [];
            
            // Filter by agent
            if (selectedAgent !== 'all') {
                filteredMetrics = filteredMetrics.filter(m => m.agent_name === selectedAgent);
            }
            
            // Filter by time range
            const now = new Date();
            const timeRangeMs = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000
            };
            
            if (timeRangeMs[timeRange]) {
                const cutoff = new Date(now - timeRangeMs[timeRange]);
                filteredMetrics = filteredMetrics.filter(m => 
                    new Date(m.created_date) >= cutoff
                );
            }
            
            setMetrics(filteredMetrics);
            setAgents(agentsData || []);
        } catch (error) {
            console.error('Failed to load performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        const csv = [
            ['Agent', 'Type', 'Status', 'Execution Time', 'Rating', 'Date'],
            ...metrics.map(m => [
                m.agent_name,
                m.metric_type,
                m.status,
                m.execution_time_ms || '',
                m.satisfaction_rating || '',
                new Date(m.created_date).toLocaleString()
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-performance-${Date.now()}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading performance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900">
                            Performance
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">Monitor and analyze agent metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                            <SelectTrigger className="w-48 bg-white">
                                <SelectValue placeholder="All Agents" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Agents</SelectItem>
                                {agents.map((agent) => (
                                    <SelectItem key={agent.name} value={agent.name}>
                                        {agent.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-40 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="90d">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={exportData} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Overview Cards */}
                <PerformanceOverview metrics={metrics} />

                {/* Charts */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="overview">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            AI Evaluation
                        </TabsTrigger>
                        <TabsTrigger value="completion">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Task Completion
                        </TabsTrigger>
                        <TabsTrigger value="api">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            API Calls
                        </TabsTrigger>
                        <TabsTrigger value="execution">
                            <Clock className="h-4 w-4 mr-2" />
                            Execution Time
                        </TabsTrigger>
                        <TabsTrigger value="satisfaction">
                            <Star className="h-4 w-4 mr-2" />
                            Satisfaction
                        </TabsTrigger>
                        <TabsTrigger value="details">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Details
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <AutomatedPerformanceEvaluator agents={agents} />
                    </TabsContent>

                    <TabsContent value="completion">
                        <TaskCompletionChart metrics={metrics} />
                    </TabsContent>

                    <TabsContent value="api">
                        <ApiCallsChart metrics={metrics} />
                    </TabsContent>

                    <TabsContent value="execution">
                        <ExecutionTimeChart metrics={metrics} />
                    </TabsContent>

                    <TabsContent value="satisfaction">
                        <SatisfactionChart metrics={metrics} />
                    </TabsContent>

                    <TabsContent value="details">
                        <MetricsTable metrics={metrics} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}