import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ExecutionTimeChart({ metrics }) {
    const workflowMetrics = metrics.filter(m => m.metric_type === 'workflow_execution' && m.execution_time_ms);
    
    // Group by agent
    const byAgent = workflowMetrics.reduce((acc, m) => {
        if (!acc[m.agent_name]) {
            acc[m.agent_name] = [];
        }
        acc[m.agent_name].push(m.execution_time_ms / 1000); // Convert to seconds
        return acc;
    }, {});

    const avgByAgent = Object.entries(byAgent).map(([agent, times]) => ({
        agent,
        avgTime: (times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(2),
        minTime: Math.min(...times).toFixed(2),
        maxTime: Math.max(...times).toFixed(2),
        count: times.length
    }));

    // Time distribution
    const timeRanges = [
        { range: '0-1s', min: 0, max: 1000 },
        { range: '1-3s', min: 1000, max: 3000 },
        { range: '3-5s', min: 3000, max: 5000 },
        { range: '5-10s', min: 5000, max: 10000 },
        { range: '10s+', min: 10000, max: Infinity }
    ];

    const distribution = timeRanges.map(range => ({
        range: range.range,
        count: workflowMetrics.filter(m => 
            m.execution_time_ms >= range.min && m.execution_time_ms < range.max
        ).length
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Average Execution Time by Agent</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={avgByAgent}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="agent" />
                            <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (s)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Execution Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" name="Workflows" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}