import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

export default function CostAnalysisDashboard({ executions, workflow }) {
    // Calculate costs
    const totalCost = executions.reduce((acc, e) => acc + (e.total_cost || 0), 0) / 100;
    const avgCostPerExecution = executions.length > 0 ? totalCost / executions.length : 0;

    // Cost by day
    const costByDay = executions.reduce((acc, exec) => {
        const date = new Date(exec.created_date).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { date, cost: 0, count: 0 };
        }
        acc[date].cost += (exec.total_cost || 0) / 100;
        acc[date].count++;
        return acc;
    }, {});

    const costTimeSeriesData = Object.values(costByDay).slice(-14);

    // Cost by step
    const costByStep = {};
    executions.forEach(exec => {
        if (exec.step_results) {
            exec.step_results.forEach((step, idx) => {
                const key = `Step ${idx + 1}`;
                if (!costByStep[key]) {
                    costByStep[key] = { name: key, cost: 0 };
                }
                costByStep[key].cost += (step.cost || 0) / 100;
            });
        }
    });

    const stepCostData = Object.values(costByStep).map(s => ({
        ...s,
        cost: parseFloat(s.cost.toFixed(2))
    }));

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    // Cost trend
    const recentCosts = costTimeSeriesData.slice(-7);
    const previousCosts = costTimeSeriesData.slice(-14, -7);
    const recentAvg = recentCosts.reduce((a, b) => a + b.cost, 0) / recentCosts.length;
    const previousAvg = previousCosts.reduce((a, b) => a + b.cost, 0) / previousCosts.length || 1;
    const costTrend = ((recentAvg - previousAvg) / previousAvg) * 100;

    return (
        <div className="space-y-6">
            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Cost</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    ${totalCost.toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Avg Per Execution</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    ${avgCostPerExecution.toFixed(3)}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">7-Day Trend</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className={`text-2xl font-bold ${
                                        costTrend > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {Math.abs(costTrend).toFixed(1)}%
                                    </p>
                                    {costTrend > 0 ? (
                                        <TrendingUp className="h-5 w-5 text-red-600" />
                                    ) : (
                                        <TrendingDown className="h-5 w-5 text-green-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Over Time */}
            <Card>
                <CardHeader>
                    <CardTitle>Cost Trend (Last 14 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={costTimeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="cost" stroke="#f59e0b" name="Daily Cost ($)" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Cost by Step */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cost by Step</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stepCostData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                <Bar dataKey="cost" fill="#f59e0b" name="Total Cost ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cost Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stepCostData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: $${entry.cost.toFixed(2)}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="cost"
                                >
                                    {stepCostData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Optimization Tips */}
            <Card>
                <CardHeader>
                    <CardTitle>Cost Optimization Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stepCostData.sort((a, b) => b.cost - a.cost).slice(0, 3).map((step, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{step.name}</p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            This step accounts for ${step.cost.toFixed(2)} of total costs
                                        </p>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-700">
                                        ${step.cost.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}