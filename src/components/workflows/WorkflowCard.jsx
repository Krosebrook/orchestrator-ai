import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Edit, Trash2, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function WorkflowCard({ workflow, onExecute, onEdit, onDelete }) {
    const categoryColors = {
        research: "bg-blue-100 text-blue-700 border-blue-200",
        content_creation: "bg-purple-100 text-purple-700 border-purple-200",
        data_analysis: "bg-green-100 text-green-700 border-green-200",
        task_automation: "bg-orange-100 text-orange-700 border-orange-200",
        custom: "bg-slate-100 text-slate-700 border-slate-200"
    };

    return (
        <Card className="hover:shadow-lg transition-all">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription className="mt-1">{workflow.description}</CardDescription>
                    </div>
                    <Badge className={cn("border", categoryColors[workflow.category])}>
                        {workflow.category.replace(/_/g, ' ')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {/* Pipeline Preview */}
                <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Pipeline ({workflow.steps?.length || 0} steps)
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {workflow.steps?.map((step, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                    {step.agent_name}
                                </div>
                                {index < workflow.steps.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => onExecute(workflow)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onEdit(workflow)}
                        size="icon"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onDelete(workflow)}
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}