import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, Loader2, Play, Pause, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowExecutionMonitor({ execution, workflow, onRefresh }) {
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    const getNodeStatus = (nodeId) => {
        const nodeResult = execution.node_results?.find(r => r.node_id === nodeId);
        return nodeResult?.status || 'pending';
    };

    const getNodeOutput = (nodeId) => {
        const nodeResult = execution.node_results?.find(r => r.node_id === nodeId);
        return nodeResult?.output;
    };

    const getNodeError = (nodeId) => {
        const nodeResult = execution.node_results?.find(r => r.node_id === nodeId);
        return nodeResult?.error;
    };

    const toggleExpanded = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'running':
                return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
            case 'pending':
                return <Clock className="h-5 w-5 text-slate-400" />;
            default:
                return <Clock className="h-5 w-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'running':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'pending':
                return 'bg-slate-100 text-slate-700 border-slate-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const executionPath = execution.execution_path || [];
    const orderedNodes = workflow.nodes.filter(n => executionPath.includes(n.id));

    return (
        <div className="space-y-6">
            {/* Execution Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(execution.status)}
                            <div>
                                <CardTitle className="text-base">{workflow.name}</CardTitle>
                                <p className="text-sm text-slate-600">
                                    Started {formatDistanceToNow(new Date(execution.created_date), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={cn('border-2', getStatusColor(execution.status))}>
                                {execution.status}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={onRefresh}>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Execution Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Execution Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        <div className="space-y-3">
                            {orderedNodes.map((node, index) => {
                                const status = getNodeStatus(node.id);
                                const output = getNodeOutput(node.id);
                                const error = getNodeError(node.id);
                                const isExpanded = expandedNodes.has(node.id);

                                return (
                                    <div key={node.id} className="relative">
                                        {index < orderedNodes.length - 1 && (
                                            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-200" />
                                        )}
                                        
                                        <Card className={cn(
                                            'border-2 transition-all',
                                            status === 'completed' && 'border-green-200',
                                            status === 'failed' && 'border-red-200',
                                            status === 'running' && 'border-blue-200'
                                        )}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getStatusIcon(status)}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <p className="font-semibold text-slate-800">
                                                                    {node.label || node.type}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Step {index + 1} of {orderedNodes.length}
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs">
                                                                {node.type}
                                                            </Badge>
                                                        </div>

                                                        {node.type === 'condition' && node.config?.conditions && (
                                                            <div className="mb-2 p-2 bg-slate-50 rounded text-xs">
                                                                <p className="font-medium text-slate-700 mb-1">Conditions:</p>
                                                                {node.config.conditions.map((cond, idx) => (
                                                                    <p key={idx} className="text-slate-600">
                                                                        {cond.field} {cond.operator} {cond.value}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {node.config?.actions && node.config.actions.length > 0 && (
                                                            <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
                                                                <p className="font-medium text-blue-700 mb-1">Actions:</p>
                                                                {node.config.actions.map((action, idx) => (
                                                                    <p key={idx} className="text-blue-600">
                                                                        {action.type} {action.entity && `→ ${action.entity}`}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {(output || error) && (
                                                            <button
                                                                onClick={() => toggleExpanded(node.id)}
                                                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                                            >
                                                                <ChevronRight className={cn(
                                                                    'h-3 w-3 transition-transform',
                                                                    isExpanded && 'rotate-90'
                                                                )} />
                                                                {isExpanded ? 'Hide' : 'Show'} details
                                                            </button>
                                                        )}

                                                        {isExpanded && output && (
                                                            <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                                                                <p className="text-xs font-semibold text-green-700 mb-1">Output:</p>
                                                                <pre className="text-xs text-green-600 whitespace-pre-wrap overflow-x-auto">
                                                                    {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {isExpanded && error && (
                                                            <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
                                                                <p className="text-xs font-semibold text-red-700 mb-1">Error:</p>
                                                                <p className="text-xs text-red-600">{error}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Final Output */}
            {execution.final_output && (
                <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-sm text-green-800">Final Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm text-green-700 whitespace-pre-wrap">
                            {execution.final_output}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}