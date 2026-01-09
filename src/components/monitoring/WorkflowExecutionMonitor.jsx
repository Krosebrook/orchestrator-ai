import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Clock, Pause, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function WorkflowExecutionMonitor() {
    const [executions, setExecutions] = useState([]);
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        failed: 0,
        avgDuration: 0
    });

    useEffect(() => {
        loadExecutions();
        const interval = setInterval(loadExecutions, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadExecutions = async () => {
        const allExecutions = await base44.entities.WorkflowExecution.list('-updated_date', 50);
        setExecutions(allExecutions);

        const active = allExecutions.filter(e => e.status === 'running').length;
        const completed = allExecutions.filter(e => e.status === 'completed').length;
        const failed = allExecutions.filter(e => e.status === 'failed').length;

        const completedExecs = allExecutions.filter(e => e.status === 'completed' && e.created_date && e.updated_date);
        const avgDuration = completedExecs.length > 0
            ? completedExecs.reduce((sum, e) => {
                const start = new Date(e.created_date).getTime();
                const end = new Date(e.updated_date).getTime();
                return sum + (end - start);
            }, 0) / completedExecs.length / 1000
            : 0;

        setStats({ active, completed, failed, avgDuration });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
            default: return <Clock className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'paused': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const activeExecutions = executions.filter(e => e.status === 'running');
    const recentExecutions = executions.slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Active</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                            </div>
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Failed</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Avg Duration</p>
                                <p className="text-2xl font-bold text-slate-700">{stats.avgDuration.toFixed(0)}s</p>
                            </div>
                            <Clock className="h-8 w-8 text-slate-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Executions */}
            {activeExecutions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Active Workflow Executions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeExecutions.map(exec => {
                                const progress = exec.step_results?.length || 0;
                                const totalSteps = exec.workflow?.nodes?.length || 10;
                                const percentage = (progress / totalSteps) * 100;

                                return (
                                    <div key={exec.id} className="bg-slate-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(exec.status)}
                                                <span className="font-semibold">{exec.workflow_name}</span>
                                            </div>
                                            <Badge className={getStatusColor(exec.status)}>
                                                {exec.status}
                                            </Badge>
                                        </div>
                                        <Progress value={percentage} className="mb-2" />
                                        <p className="text-xs text-slate-500">
                                            Step {progress} of {totalSteps} • Started {new Date(exec.created_date).toLocaleTimeString()}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Executions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Executions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recentExecutions.map(exec => (
                            <div key={exec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(exec.status)}
                                    <div>
                                        <p className="font-medium text-sm">{exec.workflow_name}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(exec.created_date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <Badge className={getStatusColor(exec.status)}>
                                    {exec.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}