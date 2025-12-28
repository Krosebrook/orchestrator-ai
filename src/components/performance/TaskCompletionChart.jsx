import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function TaskCompletionChart({ metrics }) {
    const taskMetrics = metrics.filter(m => m.metric_type === 'task_completion');
    
    // Group by agent
    const byAgent = taskMetrics.reduce((acc, m) => {
        if (!acc[m.agent_name]) {
            acc[m.agent_name] = { success: 0, failure: 0, pending: 0 };
        }
        acc[m.agent_name][m.status]++;
        return acc;
    }, {});

    const chartData = Object.entries(byAgent).map(([agent, data]) => ({
        agent,
        success: data.success,
        failure: data.failure,
        pending: data.pending,
        total: data.success + data.failure + data.pending
    }));

    const statusData = [
        { name: 'Success', value: taskMetrics.filter(m => m.status === 'success').length },
        { name: 'Failure', value: taskMetrics.filter(m => m.status === 'failure').length },
        { name: 'Pending', value: taskMetrics.filter(m => m.status === 'pending').length }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Task Completion by Agent</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="agent" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="success" fill="#10b981" name="Success" />
                            <Bar dataKey="failure" fill="#ef4444" name="Failure" />
                            <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Overall Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}