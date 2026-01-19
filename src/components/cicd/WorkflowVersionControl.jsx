import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock } from 'lucide-react';

export default function WorkflowVersionControl({ workflows, versions }) {
    const groupedVersions = versions.reduce((acc, version) => {
        if (!acc[version.workflow_id]) acc[version.workflow_id] = [];
        acc[version.workflow_id].push(version);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {workflows.map((workflow) => {
                const workflowVersions = (groupedVersions[workflow.id] || [])
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

                return (
                    <Card key={workflow.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5" />
                                {workflow.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {workflowVersions.map((version) => (
                                    <div key={version.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">v{version.version}</Badge>
                                                {version.is_active && (
                                                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{version.description}</p>
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            {new Date(version.created_date).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}