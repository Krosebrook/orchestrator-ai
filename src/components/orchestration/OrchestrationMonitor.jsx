import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function OrchestrationMonitor({ orchestrations, handoffs }) {
    const recentHandoffs = handoffs.slice(0, 20);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Active Orchestrations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {orchestrations.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                            No active orchestrations
                        </p>
                    ) : (
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                                {orchestrations.map((orch) => (
                                    <div key={orch.id} className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-semibold">{orch.name}</p>
                                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-600">
                                            {orch.agents?.map((agent, idx) => (
                                                <span key={idx} className="flex items-center">
                                                    {agent.agent_name}
                                                    {idx < orch.agents.length - 1 && (
                                                        <ArrowRight className="h-3 w-3 mx-1" />
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Handoffs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {recentHandoffs.map((handoff) => (
                                <div key={handoff.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">{handoff.from_agent}</span>
                                            <ArrowRight className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium">{handoff.to_agent}</span>
                                        </div>
                                        {handoff.status === 'completed' ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : handoff.status === 'failed' ? (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-yellow-600" />
                                        )}
                                    </div>
                                    {handoff.handoff_reason && (
                                        <p className="text-xs text-slate-600 mb-1">{handoff.handoff_reason}</p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>
                                            {formatDistanceToNow(new Date(handoff.created_date), { addSuffix: true })}
                                        </span>
                                        {handoff.execution_time_ms && (
                                            <span>{(handoff.execution_time_ms / 1000).toFixed(2)}s</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}