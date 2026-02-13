import { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export default function LiveActivityRail() {
    const [activeStatuses, setActiveStatuses] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
        const interval = setInterval(loadActivities, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadActivities = async () => {
        try {
            const [statuses, workflowExecs] = await Promise.all([
                base44.entities.AgentStatus.filter({ status: ['active', 'busy'] }),
                base44.entities.WorkflowExecution.filter({ status: 'running' })
            ]);
            
            setActiveStatuses(statuses || []);
            setExecutions(workflowExecs || []);
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalActive = activeStatuses.length + executions.length;

    if (totalActive === 0 && !loading) return null;

    return (
        <div className="fixed top-20 right-6 w-80 z-40">
            <Card className="bg-white shadow-xl border-l-4 border-blue-600">
                <div className="p-4 border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                            <span className="font-semibold text-sm text-slate-900">Live Activity</span>
                        </div>
                        <Badge className="bg-blue-600 text-white">{totalActive}</Badge>
                    </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                    {/* Active Agents */}
                    {activeStatuses.map((status) => (
                        <div key={status.id} className="p-3 border-b hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-2">
                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {status.agent_name}
                                    </p>
                                    <p className="text-xs text-slate-600 truncate">
                                        {status.current_task?.task_type || 'Processing...'}
                                    </p>
                                    {status.current_task?.started_at && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            {Math.round((new Date() - new Date(status.current_task.started_at)) / 1000)}s elapsed
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            </div>
                        </div>
                    ))}

                    {/* Running Workflows */}
                    {executions.map((exec) => (
                        <div key={exec.id} className="p-3 border-b hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-2">
                                <Loader2 className="h-4 w-4 text-purple-600 animate-spin mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        Workflow Execution
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Step {exec.current_step_index + 1} of {exec.total_steps}
                                    </p>
                                    {exec.current_agent && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Agent: {exec.current_agent}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}