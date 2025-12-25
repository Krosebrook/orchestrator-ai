import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

export default function AnalystDashboard({ user }) {
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const metricsData = await base44.entities.Metric.list('-updated_date', 30);
            setMetrics(metricsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const categories = ['revenue', 'growth', 'operations', 'customer', 'product', 'team'];
    
    const getMetricsByCategory = (category) => {
        return metrics.filter(m => m.category === category);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Data Analyst Dashboard</h2>
                <p className="text-slate-600">Business intelligence and analytics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Metrics</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{metrics.length}</p>
                            </div>
                            <BarChart3 className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Categories</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{categories.length}</p>
                            </div>
                            <PieChart className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Trending Up</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">
                                    {metrics.filter(m => m.trend === 'up').length}
                                </p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active Tracking</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{metrics.length}</p>
                            </div>
                            <Activity className="h-10 w-10 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categories.map((category) => {
                    const categoryMetrics = getMetricsByCategory(category);
                    return (
                        <Card key={category}>
                            <CardHeader>
                                <CardTitle className="capitalize">{category} Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {categoryMetrics.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No metrics in this category</p>
                                ) : (
                                    <div className="space-y-3">
                                        {categoryMetrics.map((metric) => (
                                            <div key={metric.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-slate-800">{metric.name}</span>
                                                    <span className="text-sm text-slate-600">
                                                        {metric.value} {metric.unit}
                                                    </span>
                                                </div>
                                                {metric.target && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    metric.value >= metric.target ? 'bg-green-600' : 'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-500">
                                                            {metric.target} {metric.unit}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}