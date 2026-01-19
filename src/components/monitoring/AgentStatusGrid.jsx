import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AgentStatusGrid({ agents, statuses, metrics }) {
    const getAgentStatus = (agentName) => {
        return statuses.find(s => s.agent_name === agentName) || {
            status: 'offline',
            health_score: 0
        };
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <Activity className="h-4 w-4 text-green-600" />;
            case 'busy': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
            case 'idle': return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
            default: return <AlertTriangle className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'busy': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'idle': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'error': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => {
                const status = getAgentStatus(agent.name);
                const hasAlerts = status.alerts && status.alerts.length > 0;

                return (
                    <Card key={agent.name} className={hasAlerts ? 'border-2 border-red-300' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-sm">{agent.name}</CardTitle>
                                {getStatusIcon(status.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Badge className={`${getStatusColor(status.status)} w-full justify-center`}>
                                {status.status}
                            </Badge>

                            {/* Current Task */}
                            {status.current_task && (
                                <div className="bg-blue-50 p-2 rounded text-xs">
                                    <p className="font-semibold text-blue-700">Current Task:</p>
                                    <p className="text-blue-600 truncate">{status.current_task.task_type}</p>
                                </div>
                            )}

                            {/* Health Score */}
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-600">Health Score</span>
                                    <span className={`font-bold ${getHealthColor(status.health_score || 0)}`}>
                                        {Math.round(status.health_score || 0)}%
                                    </span>
                                </div>
                                <Progress value={status.health_score || 0} className="h-2" />
                            </div>

                            {/* Performance Snapshot */}
                            {status.performance_snapshot && (
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Today's Tasks:</span>
                                        <span className="font-semibold">
                                            {status.performance_snapshot.tasks_completed_today || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Success Rate:</span>
                                        <span className="font-semibold text-green-600">
                                            {Math.round((status.performance_snapshot.success_rate || 0) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Alerts */}
                            {hasAlerts && (
                                <div className="space-y-1">
                                    {status.alerts.map((alert, idx) => (
                                        <div key={idx} className="bg-red-50 p-2 rounded text-xs">
                                            <div className="flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3 text-red-600" />
                                                <span className="text-red-700 font-semibold">{alert.type}</span>
                                            </div>
                                            <p className="text-red-600 mt-1">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}