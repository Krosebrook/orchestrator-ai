import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function ProductDashboard({ user }) {
    const [features, setFeatures] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const featuresData = await base44.entities.Feature.list('-updated_date', 20);
            setFeatures(featuresData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            backlog: 'bg-slate-100 text-slate-700',
            planned: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            review: 'bg-purple-100 text-purple-700',
            shipped: 'bg-green-500 text-white',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const inProgress = features.filter(f => f.status === 'in_progress');
    const shipped = features.filter(f => f.status === 'shipped');
    const planned = features.filter(f => f.status === 'planned');

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Dashboard</h2>
                    <p className="text-slate-600">Feature roadmap and development progress</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Feature
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Features</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{features.length}</p>
                            </div>
                            <Rocket className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Progress</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{inProgress.length}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Shipped</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{shipped.length}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Planned</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{planned.length}</p>
                            </div>
                            <AlertCircle className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Feature Roadmap</CardTitle>
                </CardHeader>
                <CardContent>
                    {features.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No features yet. Add your first feature to the roadmap.</p>
                    ) : (
                        <div className="space-y-3">
                            {features.map((feature) => (
                                <div key={feature.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-800">{feature.title}</h3>
                                                <Badge className={getStatusColor(feature.status)}>{feature.status}</Badge>
                                                {feature.priority && (
                                                    <Badge variant="outline">{feature.priority}</Badge>
                                                )}
                                            </div>
                                            {feature.description && (
                                                <p className="text-sm text-slate-600 mb-2">{feature.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                {feature.effort_estimate && <span>Effort: {feature.effort_estimate}</span>}
                                                {feature.target_release && <span>Target: {feature.target_release}</span>}
                                                {feature.owner && <span>Owner: {feature.owner}</span>}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">Details</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}