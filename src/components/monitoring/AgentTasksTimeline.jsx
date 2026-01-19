import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from 'lucide-react';

export default function AgentTasksTimeline({ agents, statuses }) {
    const activeAgents = statuses.filter(s => s.current_task);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Active Tasks
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activeAgents.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No active tasks</p>
                ) : (
                    <div className="space-y-3">
                        {activeAgents.map((status) => (
                            <div key={status.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{status.agent_name}</p>
                                    <p className="text-xs text-slate-600 mt-1">{status.current_task.task_type}</p>
                                </div>
                                <Badge className="bg-blue-100 text-blue-700">
                                    {Math.round((new Date() - new Date(status.current_task.started_at)) / 1000 / 60)}m
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}