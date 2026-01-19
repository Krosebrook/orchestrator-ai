import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function DeploymentHistory({ deployments, workflows, versions }) {
    const getWorkflowName = (workflowId) => {
        const workflow = workflows.find(w => w.id === workflowId);
        return workflow?.name || 'Unknown';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'deployed': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
            case 'rolled_back': return <ArrowLeft className="h-4 w-4 text-orange-600" />;
            default: return <Clock className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'deployed': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'rolled_back': return 'bg-orange-100 text-orange-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {deployments.map((deployment) => (
                        <div key={deployment.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            {getStatusIcon(deployment.status)}
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{getWorkflowName(deployment.workflow_id)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">v{deployment.version}</Badge>
                                    <Badge variant="outline" className="text-xs">{deployment.environment}</Badge>
                                    <Badge className={`${getStatusColor(deployment.status)} text-xs`}>
                                        {deployment.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                                {new Date(deployment.created_date).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}