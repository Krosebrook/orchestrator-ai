import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function RealTimeMetrics({ agents, workflows, metrics, executions }) {
    const [selectedAgent, setSelectedAgent] = useState('all');
    const [selectedWorkflow, setSelectedWorkflow] = useState('all');

    const filteredMetrics = selectedAgent === 'all' 
        ? metrics 
        : metrics.filter(m => m.agent_name === selectedAgent);

    const filteredExecutions = selectedWorkflow === 'all'
        ? executions
        : executions.filter(e => e.workflow_id === selectedWorkflow);

    // Agent Metrics
    const agentStats = {
        successRate: filteredMetrics.length > 0
            ? ((filteredMetrics.filter(m => m.status === 'success').length / filteredMetrics.length) * 100).toFixed(1)
            : 0,
        avgResponseTime: filteredMetrics.length > 0
            ? (filteredMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / filteredMetrics.length / 1000).toFixed(2)
            : 0,
        errorRate: filteredMetrics.length > 0
            ? ((filteredMetrics.filter(m => m.status === 'failure').length / filteredMetrics.length) * 100).toFixed(1)
            : 0,
        totalCost: filteredMetrics.reduce((sum, m) => sum + (m.metadata?.cost || 0), 0).toFixed(2)
    };

    // Workflow Stats
    const workflowStats = {
        running: filteredExecutions.filter(e => e.status === 'running').length,
        completed: filteredExecutions.filter(e => e.status === 'completed').length,
        failed: filteredExecutions.filter(e => e.status === 'failed').length,
        successRate: filteredExecutions.length > 0
            ? ((filteredExecutions.filter(e => e.status === 'completed').length / filteredExecutions.length) * 100).toFixed(1)
            : 0
    };

    // Time series data
    const timeSeriesData = filteredMetrics
        .slice(-20)
        .map((metric, idx) => ({
            time: idx + 1,
            responseTime: (metric.execution_time_ms || 0) / 1000,
            success: metric.status === 'success' ? 1 : 0
        }));

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Filter by agent" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        {agents.map(agent => (
                            <SelectItem key={agent.name} value={agent.name}>
                                {agent.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Filter by workflow" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Workflows</SelectItem>
                        {workflows.map(workflow => (
                            <SelectItem key={workflow.id} value={workflow.id}>
                                {workflow.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Success Rate</span>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-600">{agentStats.successRate}%</p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">+2.3%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Avg Response</span>
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{agentStats.avgResponseTime}s</p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingDown className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">-0.5s</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Error Rate</span>
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-red-600">{agentStats.errorRate}%</p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingDown className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">-1.2%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Total Cost</span>
                            <DollarSign className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-600">${agentStats.totalCost}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-orange-600">+$12.34</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Response Time Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Workflow Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
                                    <span className="text-sm font-medium">Running</span>
                                </div>
                                <Badge className="bg-blue-600">{workflowStats.running}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Completed</span>
                                </div>
                                <Badge className="bg-green-600">{workflowStats.completed}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium">Failed</span>
                                </div>
                                <Badge className="bg-red-600">{workflowStats.failed}</Badge>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">Success Rate</span>
                                    <span className="text-2xl font-bold text-green-600">{workflowStats.successRate}%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}