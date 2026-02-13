import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingDown, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import WorkflowPerformanceInsights from '../components/analytics/WorkflowPerformanceInsights';
import BottleneckAnalyzer from '../components/analytics/BottleneckAnalyzer';
import ABTestingDashboard from '../components/analytics/ABTestingDashboard';
import CostAnalysisDashboard from '../components/analytics/CostAnalysisDashboard';

export default function WorkflowAnalyticsPage() {
    const [workflows, setWorkflows] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [workflowsList, executionsList] = await Promise.all([
                base44.entities.Workflow.list(),
                base44.entities.WorkflowExecution.list('-created_date', 200)
            ]);
            
            setWorkflows(workflowsList || []);
            setExecutions(executionsList || []);
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExecutions = selectedWorkflowId === 'all' 
        ? executions 
        : executions.filter(e => e.workflow_id === selectedWorkflowId);

    const selectedWorkflow = selectedWorkflowId === 'all' 
        ? null 
        : workflows.find(w => w.id === selectedWorkflowId);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-blue-600 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Workflow Analytics</h1>
                        <p className="text-slate-600 mt-1">Deep insights into workflow performance and optimization</p>
                    </div>
                    <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                        <SelectTrigger className="w-64 bg-white">
                            <SelectValue placeholder="Select workflow" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Workflows</SelectItem>
                            {workflows.map((wf) => (
                                <SelectItem key={wf.id} value={wf.id}>
                                    {wf.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Executions</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        {filteredExecutions.length}
                                    </p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Success Rate</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {filteredExecutions.length > 0
                                            ? Math.round((filteredExecutions.filter(e => e.status === 'completed').length / filteredExecutions.length) * 100)
                                            : 0}%
                                    </p>
                                </div>
                                <Zap className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Avg Duration</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        {filteredExecutions.length > 0
                                            ? Math.round(filteredExecutions.reduce((acc, e) => acc + (e.execution_time_ms || 0), 0) / filteredExecutions.length / 1000)
                                            : 0}s
                                    </p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Cost</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        ${(filteredExecutions.reduce((acc, e) => acc + (e.total_cost || 0), 0) / 100).toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Tabs */}
                <Tabs defaultValue="performance" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="performance">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Performance
                        </TabsTrigger>
                        <TabsTrigger value="bottlenecks">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Bottlenecks
                        </TabsTrigger>
                        <TabsTrigger value="abtesting">
                            <Zap className="h-4 w-4 mr-2" />
                            A/B Testing
                        </TabsTrigger>
                        <TabsTrigger value="costs">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Cost Analysis
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="performance">
                        <WorkflowPerformanceInsights 
                            executions={filteredExecutions}
                            workflow={selectedWorkflow}
                        />
                    </TabsContent>

                    <TabsContent value="bottlenecks">
                        <BottleneckAnalyzer 
                            executions={filteredExecutions}
                            workflow={selectedWorkflow}
                        />
                    </TabsContent>

                    <TabsContent value="abtesting">
                        <ABTestingDashboard 
                            workflows={workflows}
                            executions={executions}
                        />
                    </TabsContent>

                    <TabsContent value="costs">
                        <CostAnalysisDashboard 
                            executions={filteredExecutions}
                            workflow={selectedWorkflow}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}