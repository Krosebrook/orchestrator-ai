import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export default function DeploymentPipeline({ workflows, versions, deployments, onDeploy, onRefresh }) {
    const getLatestDeployments = (workflowId) => {
        return ['development', 'staging', 'production'].map(env => {
            const envDeployments = deployments.filter(d => 
                d.workflow_id === workflowId && d.environment === env
            ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            return envDeployments[0] || null;
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'deployed': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
            case 'deploying':
            case 'testing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
            default: return <Clock className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'deployed': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'deploying':
            case 'testing': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {workflows.map((workflow) => {
                const [devDeploy, stagingDeploy, prodDeploy] = getLatestDeployments(workflow.id);
                const latestVersion = versions
                    .filter(v => v.workflow_id === workflow.id)
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

                return (
                    <Card key={workflow.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{workflow.name}</CardTitle>
                                {latestVersion && (
                                    <Badge variant="outline">v{latestVersion.version}</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                {/* Development */}
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Development</p>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        {devDeploy ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    {getStatusIcon(devDeploy.status)}
                                                    <Badge className={getStatusColor(devDeploy.status)}>
                                                        {devDeploy.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600">v{devDeploy.version}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Not deployed</p>
                                        )}
                                        {latestVersion && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full mt-2"
                                                onClick={() => onDeploy(workflow.id, latestVersion.id, 'development')}
                                            >
                                                <Play className="h-3 w-3 mr-1" />
                                                Deploy
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <ArrowRight className="h-4 w-4 text-slate-300" />

                                {/* Staging */}
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Staging</p>
                                    <div className="bg-yellow-50 p-3 rounded-lg">
                                        {stagingDeploy ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    {getStatusIcon(stagingDeploy.status)}
                                                    <Badge className={getStatusColor(stagingDeploy.status)}>
                                                        {stagingDeploy.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600">v{stagingDeploy.version}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Not deployed</p>
                                        )}
                                        {devDeploy?.status === 'deployed' && latestVersion && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full mt-2"
                                                onClick={() => onDeploy(workflow.id, latestVersion.id, 'staging')}
                                            >
                                                <Play className="h-3 w-3 mr-1" />
                                                Deploy
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <ArrowRight className="h-4 w-4 text-slate-300" />

                                {/* Production */}
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Production</p>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        {prodDeploy ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    {getStatusIcon(prodDeploy.status)}
                                                    <Badge className={getStatusColor(prodDeploy.status)}>
                                                        {prodDeploy.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600">v{prodDeploy.version}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Not deployed</p>
                                        )}
                                        {stagingDeploy?.status === 'deployed' && latestVersion && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full mt-2"
                                                onClick={() => onDeploy(workflow.id, latestVersion.id, 'production')}
                                            >
                                                <Play className="h-3 w-3 mr-1" />
                                                Deploy
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}