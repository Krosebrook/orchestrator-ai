import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, CheckCircle2, AlertCircle, Activity, RotateCcw, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import moment from 'moment';

export default function EnvironmentCard({ environment, deployments, onRollback }) {
    const getEnvironmentColor = (name) => {
        switch (name) {
            case 'development':
                return 'from-blue-500 to-cyan-500';
            case 'staging':
                return 'from-orange-500 to-yellow-500';
            case 'production':
                return 'from-red-500 to-pink-500';
            default:
                return 'from-slate-500 to-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'maintenance':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            case 'inactive':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Activity className="h-4 w-4 text-slate-600" />;
        }
    };

    const recentDeployments = deployments
        .filter(d => d.status === 'completed')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 3);

    const successRate = deployments.length > 0
        ? Math.round((deployments.filter(d => d.status === 'completed').length / deployments.length) * 100)
        : 0;

    return (
        <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            getEnvironmentColor(environment.name)
                        )}>
                            <Server className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{environment.display_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(environment.status)}
                                <span className="text-xs text-slate-600 capitalize">{environment.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Version Info */}
                <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-600">Current Version</span>
                        <Badge variant="outline">{environment.current_version || 'N/A'}</Badge>
                    </div>
                    {environment.last_deployed_at && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {moment(environment.last_deployed_at).fromNow()}
                        </div>
                    )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-700">Success Rate</p>
                        <p className="text-lg font-bold text-green-800">{successRate}%</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700">Total Deploys</p>
                        <p className="text-lg font-bold text-blue-800">{deployments.length}</p>
                    </div>
                </div>

                {/* Recent Deployments */}
                {recentDeployments.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">Recent Deployments</p>
                        <div className="space-y-1">
                            {recentDeployments.map((dep, idx) => (
                                <div key={dep.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-slate-100">
                                    <span className="font-mono text-slate-600">{dep.version}</span>
                                    <span className="text-slate-500">{moment(dep.created_date).format('MMM D, HH:mm')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {recentDeployments.length > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onRollback(environment)}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rollback
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}