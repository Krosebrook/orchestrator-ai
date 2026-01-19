import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, CheckCircle } from 'lucide-react';

export default function EnvironmentManager({ environments, deployments }) {
    const envTypes = ['development', 'staging', 'production'];

    const getEnvDeployments = (envName) => {
        return deployments.filter(d => d.environment === envName && d.status === 'deployed');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {envTypes.map((envType) => {
                const envDeployments = getEnvDeployments(envType);

                return (
                    <Card key={envType}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                {envType.charAt(0).toUpperCase() + envType.slice(1)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Active Deployments</span>
                                <Badge variant="outline">{envDeployments.length}</Badge>
                            </div>

                            {envDeployments.slice(0, 5).map((deployment) => (
                                <div key={deployment.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{deployment.workflow_id}</p>
                                        <p className="text-xs text-slate-500">v{deployment.version}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}