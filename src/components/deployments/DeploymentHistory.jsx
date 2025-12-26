import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Loader2, RotateCcw, Clock, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import moment from 'moment';

export default function DeploymentHistory({ deployments }) {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'in_progress':
                return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
            case 'rolled_back':
                return <RotateCcw className="h-4 w-4 text-orange-600" />;
            default:
                return <Clock className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'rolled_back':
                return 'bg-orange-100 text-orange-700 border-orange-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const getEnvironmentColor = (env) => {
        switch (env) {
            case 'development':
                return 'bg-blue-100 text-blue-700';
            case 'staging':
                return 'bg-orange-100 text-orange-700';
            case 'production':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Deployment History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {deployments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Clock className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p>No deployments yet</p>
                    </div>
                ) : (
                    <ScrollArea className="h-96">
                        <div className="space-y-3">
                            {deployments.map((deployment) => (
                                <div
                                    key={deployment.id}
                                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(deployment.status)}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-slate-800">
                                                        {deployment.version}
                                                    </span>
                                                    <Badge className={getEnvironmentColor(deployment.environment)}>
                                                        {deployment.environment}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {deployment.commit_message || 'No commit message'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn("border", getStatusColor(deployment.status))}>
                                            {deployment.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {deployment.deployed_by}
                                            </div>
                                            {deployment.duration_seconds && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {deployment.duration_seconds}s
                                                </div>
                                            )}
                                        </div>
                                        <span>{moment(deployment.created_date).fromNow()}</span>
                                    </div>

                                    {deployment.error_message && (
                                        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                                            <p className="text-xs text-red-700">{deployment.error_message}</p>
                                        </div>
                                    )}

                                    {deployment.source_environment && (
                                        <div className="mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                Promoted from {deployment.source_environment}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}