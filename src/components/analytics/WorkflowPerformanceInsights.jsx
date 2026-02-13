import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function WorkflowPerformanceInsights({ executions, workflow }) {
    // Group executions by day
    const executionsByDay = executions.reduce((acc, exec) => {
        const date = new Date(exec.created_date).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { date, completed: 0, failed: 0, avgDuration: 0, count: 0 };
        }
        acc[date].count++;
        if (exec.status === 'completed') acc[date].completed++;
        if (exec.status === 'failed') acc[date].failed++;
        if (exec.execution_time_ms) {
            acc[date].avgDuration = (acc[date].avgDuration * (acc[date].count - 1) + exec.execution_time_ms) / acc[date].count;
        }
        return acc;
    }, {});

    const timeSeriesData = Object.values(executionsByDay).slice(-14);

    // Step performance analysis
    const stepPerformance = {};
    executions.forEach(exec => {
        if (exec.step_results) {
            exec.step_results.forEach((step, idx) => {
                const key = `Step ${idx + 1}`;
                if (!stepPerformance[key]) {
                    stepPerformance[key] = { name: key, avgTime: 0, count: 0, failures: 0 };
                }
                stepPerformance[key].count++;
                if (step.execution_time_ms) {
                    stepPerformance[key].avgTime = 
                        (stepPerformance[key].avgTime * (stepPerformance[key].count - 1) + step.execution_time_ms) 
                        / stepPerformance[key].count;
                }
                if (step.status === 'failed') stepPerformance[key].failures++;
            });
        }
    });

    const stepData = Object.values(stepPerformance).map(s => ({
        ...s,
        avgTime: Math.round(s.avgTime / 1000)
    }));

    return (
        <div className="space-y-6">
            {/* Execution Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Execution Trend (Last 14 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                            <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Step Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Step-by-Step Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stepData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (s)" />
                            <Bar dataKey="failures" fill="#ef4444" name="Failures" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Performance Metrics Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left p-3 font-semibold text-slate-700">Step</th>
                                    <th className="text-right p-3 font-semibold text-slate-700">Executions</th>
                                    <th className="text-right p-3 font-semibold text-slate-700">Avg Time</th>
                                    <th className="text-right p-3 font-semibold text-slate-700">Success Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stepData.map((step, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-3">{step.name}</td>
                                        <td className="p-3 text-right">{step.count}</td>
                                        <td className="p-3 text-right">{step.avgTime}s</td>
                                        <td className="p-3 text-right">
                                            <span className={`font-semibold ${
                                                ((step.count - step.failures) / step.count) >= 0.9 ? 'text-green-600' : 'text-amber-600'
                                            }`}>
                                                {Math.round(((step.count - step.failures) / step.count) * 100)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}