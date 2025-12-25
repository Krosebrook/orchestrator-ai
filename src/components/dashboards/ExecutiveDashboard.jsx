import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ExecutiveDashboard({ user }) {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const data = await base44.entities.Metric.list('-updated_date', 20);
            setMetrics(data || []);
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMetricsByCategory = (category) => {
        return metrics.filter(m => m.category === category);
    };

    const calculateProgress = (value, target) => {
        if (!target) return 0;
        return Math.min((value / target) * 100, 100);
    };

    const KPICard = ({ title, value, target, trend, icon: Icon, color }) => (
        <Card className="hover:shadow-lg transition-all">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-slate-800">{value}</p>
                        {target && (
                            <p className="text-sm text-slate-500 mt-1">Target: {target}</p>
                        )}
                    </div>
                    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center", color)}>
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                </div>
                {trend && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={cn("text-sm", trend === 'up' ? 'text-green-600' : 'text-red-600')}>
                            {trend === 'up' ? 'Trending up' : 'Trending down'}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const revenueMetrics = getMetricsByCategory('revenue');
    const growthMetrics = getMetricsByCategory('growth');
    const customerMetrics = getMetricsByCategory('customer');
    const teamMetrics = getMetricsByCategory('team');

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Executive Overview</h2>
                <p className="text-slate-600">Key performance indicators and business metrics</p>
            </div>

            {/* Primary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Monthly Revenue"
                    value="$125K"
                    target="$150K"
                    trend="up"
                    icon={DollarSign}
                    color="bg-gradient-to-br from-green-500 to-emerald-600"
                />
                <KPICard
                    title="Active Users"
                    value="2,847"
                    target="3,000"
                    trend="up"
                    icon={Users}
                    color="bg-gradient-to-br from-blue-500 to-cyan-600"
                />
                <KPICard
                    title="Conversion Rate"
                    value="3.2%"
                    target="4.0%"
                    trend="down"
                    icon={Target}
                    color="bg-gradient-to-br from-purple-500 to-pink-600"
                />
                <KPICard
                    title="Team Productivity"
                    value="87%"
                    target="90%"
                    trend="up"
                    icon={Activity}
                    color="bg-gradient-to-br from-orange-500 to-red-600"
                />
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueMetrics.length === 0 ? (
                            <p className="text-slate-500 text-sm">No revenue metrics available</p>
                        ) : (
                            <div className="space-y-4">
                                {revenueMetrics.map((metric) => (
                                    <div key={metric.id}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                                            <span className="text-sm text-slate-600">
                                                {metric.value} {metric.unit}
                                            </span>
                                        </div>
                                        {metric.target && (
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${calculateProgress(metric.value, metric.target)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Growth Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {growthMetrics.length === 0 ? (
                            <p className="text-slate-500 text-sm">No growth metrics available</p>
                        ) : (
                            <div className="space-y-4">
                                {growthMetrics.map((metric) => (
                                    <div key={metric.id}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                                            <span className="text-sm text-slate-600">
                                                {metric.value} {metric.unit}
                                            </span>
                                        </div>
                                        {metric.target && (
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${calculateProgress(metric.value, metric.target)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Strategic Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Revenue Growth</p>
                            <p className="text-2xl font-bold text-blue-700">+23%</p>
                            <p className="text-xs text-blue-600 mt-1">vs last quarter</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-1">Customer Acquisition</p>
                            <p className="text-2xl font-bold text-green-700">+15%</p>
                            <p className="text-xs text-green-600 mt-1">vs last month</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm font-semibold text-purple-900 mb-1">Team Efficiency</p>
                            <p className="text-2xl font-bold text-purple-700">92%</p>
                            <p className="text-xs text-purple-600 mt-1">above target</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}