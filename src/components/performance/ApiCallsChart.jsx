import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

export default function ApiCallsChart({ metrics }) {
    const apiMetrics = metrics.filter(m => m.metric_type === 'api_call');
    
    // Group by date
    const byDate = apiMetrics.reduce((acc, m) => {
        const date = format(new Date(m.created_date), 'MM/dd');
        if (!acc[date]) {
            acc[date] = { success: 0, failure: 0 };
        }
        acc[date][m.status]++;
        return acc;
    }, {});

    const timelineData = Object.entries(byDate).map(([date, data]) => ({
        date,
        success: data.success,
        failure: data.failure
    }));

    // Group by endpoint
    const byEndpoint = apiMetrics.reduce((acc, m) => {
        const endpoint = m.api_endpoint || 'Unknown';
        if (!acc[endpoint]) {
            acc[endpoint] = { success: 0, failure: 0 };
        }
        acc[endpoint][m.status]++;
        return acc;
    }, {});

    const endpointData = Object.entries(byEndpoint).map(([endpoint, data]) => ({
        endpoint: endpoint.substring(0, 30) + (endpoint.length > 30 ? '...' : ''),
        success: data.success,
        failure: data.failure,
        total: data.success + data.failure,
        successRate: ((data.success / (data.success + data.failure)) * 100).toFixed(1)
    })).sort((a, b) => b.total - a.total).slice(0, 10);

    return (
        <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">API Calls Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timelineData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="success" stroke="#10b981" name="Success" />
                            <Line type="monotone" dataKey="failure" stroke="#ef4444" name="Failure" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Top API Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={endpointData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="endpoint" type="category" width={150} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="success" fill="#10b981" name="Success" />
                            <Bar dataKey="failure" fill="#ef4444" name="Failure" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}