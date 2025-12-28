import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Loader2, XCircle, Clock, GitBranch, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VisualWorkflowCanvas({ orchestration, handoffs, realTime = true }) {
    const [activeHandoffs, setActiveHandoffs] = useState([]);
    const [agentStatuses, setAgentStatuses] = useState({});

    useEffect(() => {
        if (!orchestration) return;
        
        // Filter handoffs for this orchestration
        const orchHandoffs = handoffs.filter(h => h.orchestration_id === orchestration.id);
        setActiveHandoffs(orchHandoffs);

        // Calculate agent statuses based on handoffs
        const statuses = {};
        orchestration.agents?.forEach(agent => {
            const agentHandoffs = orchHandoffs.filter(h => 
                h.from_agent === agent.agent_name || h.to_agent === agent.agent_name
            );
            
            const hasActive = agentHandoffs.some(h => h.status === 'pending');
            const hasCompleted = agentHandoffs.some(h => h.status === 'completed');
            const hasFailed = agentHandoffs.some(h => h.status === 'failed');
            
            if (hasActive) {
                statuses[agent.agent_name] = 'active';
            } else if (hasFailed) {
                statuses[agent.agent_name] = 'failed';
            } else if (hasCompleted) {
                statuses[agent.agent_name] = 'completed';
            } else {
                statuses[agent.agent_name] = 'idle';
            }
        });
        setAgentStatuses(statuses);

        // Auto-refresh in real-time mode
        if (realTime) {
            const interval = setInterval(() => {
                // Trigger re-render for animations
                setAgentStatuses({...statuses});
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [orchestration, handoffs, realTime]);

    if (!orchestration || !orchestration.agents || orchestration.agents.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <p>No orchestration data to visualize</p>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'completed': return <CheckCircle className="h-4 w-4" />;
            case 'failed': return <XCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200';
            case 'completed': return 'border-green-500 bg-green-50';
            case 'failed': return 'border-red-500 bg-red-50';
            default: return 'border-slate-300 bg-white';
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'active': return 'bg-blue-600 text-white animate-pulse';
            case 'completed': return 'bg-green-600 text-white';
            case 'failed': return 'bg-red-600 text-white';
            default: return 'bg-slate-400 text-white';
        }
    };

    const getHandoffStatus = (fromAgent, toAgent) => {
        const handoff = activeHandoffs.find(h => 
            h.from_agent === fromAgent && h.to_agent === toAgent
        );
        return handoff?.status || null;
    };

    const isConditional = orchestration.communication_protocol === 'conditional';
    const isParallel = orchestration.communication_protocol === 'parallel';
    const agents = orchestration.agents;

    return (
        <div className="space-y-6">
            {/* Protocol Info */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <Zap className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                        {orchestration.communication_protocol.toUpperCase()} Protocol
                    </p>
                    <p className="text-xs text-slate-600">
                        {isParallel && 'Agents execute in parallel'}
                        {isConditional && 'Flow branches based on conditions'}
                        {!isParallel && !isConditional && 'Agents execute sequentially'}
                    </p>
                </div>
                {realTime && (
                    <Badge className="bg-green-600">
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            Live
                        </div>
                    </Badge>
                )}
            </div>

            {/* Visual Workflow */}
            <Card>
                <CardContent className="pt-6">
                    {isParallel ? (
                        // Parallel Layout
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="inline-block px-4 py-2 bg-slate-100 rounded-lg border-2 border-slate-300">
                                    <p className="text-sm font-semibold">Workflow Start</p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <GitBranch className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {agents.map((agent, idx) => {
                                    const status = agentStatuses[agent.agent_name] || 'idle';
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <Card className={cn(
                                                'border-2 transition-all duration-300',
                                                getStatusColor(status)
                                            )}>
                                                <CardContent className="pt-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Badge className={getStatusBadgeColor(status)}>
                                                            {getStatusIcon(status)}
                                                            <span className="ml-1 text-xs">{status}</span>
                                                        </Badge>
                                                    </div>
                                                    <p className="font-semibold text-sm">{agent.agent_name}</p>
                                                    <p className="text-xs text-slate-600 capitalize">{agent.role}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : isConditional ? (
                        // Conditional/Branching Layout
                        <div className="space-y-6">
                            {agents.map((agent, idx) => {
                                const status = agentStatuses[agent.agent_name] || 'idle';
                                const nextAgent = agents[idx + 1];
                                const handoffRule = orchestration.handoff_rules?.find(r => 
                                    r.from_agent === agent.agent_name
                                );

                                return (
                                    <div key={idx}>
                                        {/* Agent Node */}
                                        <Card className={cn(
                                            'border-2 transition-all duration-300',
                                            getStatusColor(status)
                                        )}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{agent.agent_name}</p>
                                                            <p className="text-xs text-slate-600 capitalize">{agent.role}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={getStatusBadgeColor(status)}>
                                                        {getStatusIcon(status)}
                                                        <span className="ml-1">{status}</span>
                                                    </Badge>
                                                </div>
                                                
                                                {/* Conditional Branch Info */}
                                                {handoffRule && handoffRule.condition && (
                                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                                        <p className="font-semibold text-yellow-800">Condition:</p>
                                                        <code className="text-yellow-700">{handoffRule.condition}</code>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Handoff Connector */}
                                        {nextAgent && (
                                            <div className="flex flex-col items-center py-2">
                                                <div className={cn(
                                                    'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
                                                    getHandoffStatus(agent.agent_name, nextAgent.agent_name) === 'pending' 
                                                        ? 'bg-blue-600 animate-pulse' 
                                                        : getHandoffStatus(agent.agent_name, nextAgent.agent_name) === 'completed'
                                                        ? 'bg-green-600'
                                                        : 'bg-slate-300'
                                                )}>
                                                    <ArrowRight className="h-4 w-4 text-white" />
                                                </div>
                                                {handoffRule && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        {handoffRule.to_agent}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Sequential Layout
                        <div className="space-y-4">
                            {agents.map((agent, idx) => {
                                const status = agentStatuses[agent.agent_name] || 'idle';
                                const nextAgent = agents[idx + 1];
                                const handoffStatus = nextAgent 
                                    ? getHandoffStatus(agent.agent_name, nextAgent.agent_name)
                                    : null;

                                return (
                                    <div key={idx}>
                                        {/* Agent Node */}
                                        <Card className={cn(
                                            'border-2 transition-all duration-300',
                                            getStatusColor(status)
                                        )}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-lg">{agent.agent_name}</p>
                                                            <p className="text-sm text-slate-600 capitalize">{agent.role}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn('px-3 py-1', getStatusBadgeColor(status))}>
                                                        {getStatusIcon(status)}
                                                        <span className="ml-2">{status}</span>
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Handoff Indicator */}
                                        {nextAgent && (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={cn(
                                                        'h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500',
                                                        handoffStatus === 'pending' && 'bg-blue-600 shadow-lg shadow-blue-300 animate-pulse scale-110',
                                                        handoffStatus === 'completed' && 'bg-green-600',
                                                        handoffStatus === 'failed' && 'bg-red-600',
                                                        !handoffStatus && 'bg-slate-300'
                                                    )}>
                                                        <ArrowRight className="h-6 w-6 text-white" />
                                                    </div>
                                                    {handoffStatus === 'pending' && (
                                                        <Badge className="bg-blue-600 animate-pulse">
                                                            Handoff in Progress
                                                        </Badge>
                                                    )}
                                                    {handoffStatus === 'completed' && (
                                                        <Badge className="bg-green-600">
                                                            Handoff Complete
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* Workflow End */}
                            <div className="text-center pt-2">
                                <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg">
                                    <p className="text-white font-semibold flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        Workflow Complete
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Active Handoffs Legend */}
            <Card className="bg-slate-50">
                <CardContent className="pt-4">
                    <p className="text-sm font-semibold mb-3">Status Legend</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-slate-400" />
                            <span>Idle</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
                            <span>Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-600" />
                            <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-600" />
                            <span>Failed</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}