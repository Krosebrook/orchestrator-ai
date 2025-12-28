import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function RealTimeMetricsChart({ metrics, type = 'response_time' }) {
    // Process metrics for visualization
    const processMetrics = () => {
        const agentData = {};
        
        metrics.slice(0, 100).forEach(metric => {
            if (!agentData[metric.agent_name]) {
                agentData[metric.agent_name] = {
                    name: metric.agent_name,
                    total: 0,
                    success: 0,
                    failure: 0,
                    totalTime: 0,
                    count: 0
                };
            }
            
            agentData[metric.agent_name].total++;
            if (metric.status === 'success') agentData[metric.agent_name].success++;
            if (metric.status === 'failure') agentData[metric.agent_name].failure++;
            if (metric.execution_time_ms) {
                agentData[metric.agent_name].totalTime += metric.execution_time_ms;
                agentData[metric.agent_name].count++;
            }
        });

        return Object.values(agentData).map(agent => ({
            name: agent.name,
            'Avg Response (s)': agent.count > 0 ? (agent.totalTime / agent.count / 1000).toFixed(2) : 0,
            'Success Rate (%)': agent.total > 0 ? ((agent.success / agent.total) * 100).toFixed(0) : 0,
            'Success': agent.success,
            'Failures': agent.failure
        }));
    };

    const data = processMetrics();

    if (type === 'response_time') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Average Response Time by Agent
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Bar dataKey="Avg Response (s)" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    }

    if (type === 'success_rate') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Success Rate by Agent
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Bar dataKey="Success Rate (%)" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    }

    if (type === 'errors') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Success vs Failures
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Success" fill="#10b981" stackId="a" />
                            <Bar dataKey="Failures" fill="#ef4444" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    }

    return null;
}