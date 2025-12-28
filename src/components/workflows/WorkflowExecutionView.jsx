import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Loader2, AlertCircle, ArrowRight, Sparkles, Play, Pause, RotateCcw, FileText, XCircle, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import MessageBubble from '../agents/MessageBubble';

export default function WorkflowExecutionView({ execution, workflow, onRefresh, onRetry, onPause, onResume }) {
    const [stepConversations, setStepConversations] = useState({});
    const [loading, setLoading] = useState(false);
    const [showLogs, setShowLogs] = useState({});
    const [retryParams, setRetryParams] = useState({});
    const [showRetryDialog, setShowRetryDialog] = useState(null);
    const [executionLogs, setExecutionLogs] = useState([]);

    useEffect(() => {
        if (execution?.step_results) {
            execution.step_results.forEach((result) => {
                if (result.conversation_id && !stepConversations[result.conversation_id]) {
                    loadStepConversation(result.conversation_id);
                }
            });
        }

        // Simulate execution logs
        generateExecutionLogs();
        
        // Auto-refresh every 3 seconds if running
        if (execution?.status === 'running' && onRefresh) {
            const interval = setInterval(() => {
                onRefresh();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [execution?.step_results, execution?.status]);

    const loadStepConversation = async (conversationId) => {
        try {
            const conversation = await base44.agents.getConversation(conversationId);
            setStepConversations(prev => ({
                ...prev,
                [conversationId]: conversation
            }));

            // Subscribe to real-time updates
            const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
                setStepConversations(prev => ({
                    ...prev,
                    [conversationId]: data
                }));
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Failed to load step conversation:', error);
        }
    };

    const getStepStatus = (stepIndex) => {
        if (!execution?.step_results) return 'pending';
        
        const result = execution.step_results.find(r => r.step_index === stepIndex);
        if (!result) {
            return stepIndex < (execution.current_step || 0) ? 'completed' : 
                   stepIndex === (execution.current_step || 0) ? 'running' : 'pending';
        }
        return result.status || 'pending';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'running':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'failed':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Circle className="h-5 w-5 text-slate-300" />;
        }
    };

    const getStepOutput = (stepIndex) => {
        if (!execution?.step_results) return null;
        const result = execution.step_results.find(r => r.step_index === stepIndex);
        return result?.output;
    };

    const generateExecutionLogs = () => {
        const logs = [];
        logs.push({ timestamp: new Date(execution?.created_date).toISOString(), level: 'info', message: `Workflow "${workflow?.name}" started` });
        
        execution?.step_results?.forEach((result, index) => {
            logs.push({ 
                timestamp: result.started_at || new Date().toISOString(), 
                level: 'info', 
                message: `Step ${index + 1} (${result.agent_name}) started` 
            });
            
            if (result.status === 'completed') {
                logs.push({ 
                    timestamp: result.completed_at || new Date().toISOString(), 
                    level: 'success', 
                    message: `Step ${index + 1} completed successfully` 
                });
            } else if (result.status === 'failed') {
                logs.push({ 
                    timestamp: result.completed_at || new Date().toISOString(), 
                    level: 'error', 
                    message: `Step ${index + 1} failed: ${result.error || 'Unknown error'}` 
                });
            }
        });

        if (execution?.status === 'completed') {
            logs.push({ timestamp: new Date().toISOString(), level: 'success', message: 'Workflow completed successfully' });
        } else if (execution?.status === 'failed') {
            logs.push({ timestamp: new Date().toISOString(), level: 'error', message: 'Workflow execution failed' });
        } else if (execution?.status === 'paused') {
            logs.push({ timestamp: new Date().toISOString(), level: 'warning', message: 'Workflow paused' });
        }

        setExecutionLogs(logs);
    };

    const handleRetryStep = async (stepIndex) => {
        try {
            toast.info(`Retrying step ${stepIndex + 1}...`);
            if (onRetry) {
                await onRetry(stepIndex, retryParams[stepIndex]);
            }
            setShowRetryDialog(null);
            setRetryParams({});
        } catch (error) {
            toast.error('Failed to retry step');
        }
    };

    const handleRetryWorkflow = async () => {
        try {
            toast.info('Retrying entire workflow...');
            if (onRetry) {
                await onRetry('all', { initial_input: execution?.initial_input });
            }
        } catch (error) {
            toast.error('Failed to retry workflow');
        }
    };

    const handlePauseResume = async () => {
        try {
            if (execution?.status === 'running') {
                if (onPause) await onPause();
                toast.success('Workflow paused');
            } else if (execution?.status === 'paused') {
                if (onResume) await onResume();
                toast.success('Workflow resumed');
            }
        } catch (error) {
            toast.error('Failed to pause/resume workflow');
        }
    };

    const toggleLogs = (stepIndex) => {
        setShowLogs(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
    };

    const steps = workflow?.steps || [];

    // Use enhanced monitor if available
    if (workflow.nodes && workflow.nodes.length > 0) {
        return <WorkflowExecutionMonitor execution={execution} workflow={workflow} onRefresh={onRefresh} />;
    }

    return (
        <div className="space-y-6">
            {/* Execution Header */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                                {workflow?.name || 'Workflow Execution'}
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">{workflow?.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <Badge
                                    className={cn(
                                        execution?.status === 'completed' && 'bg-green-500',
                                        execution?.status === 'running' && 'bg-blue-500 animate-pulse',
                                        execution?.status === 'failed' && 'bg-red-500',
                                        execution?.status === 'paused' && 'bg-yellow-500',
                                        'text-white'
                                    )}
                                >
                                    {execution?.status || 'initializing'}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                    Step {(execution?.current_step || 0) + 1} of {steps.length}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {execution?.status === 'running' && (
                                <Button variant="outline" size="sm" onClick={handlePauseResume}>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                </Button>
                            )}
                            {execution?.status === 'paused' && (
                                <Button variant="outline" size="sm" onClick={handlePauseResume}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Resume
                                </Button>
                            )}
                            {(execution?.status === 'failed' || execution?.status === 'completed') && (
                                <Button variant="outline" size="sm" onClick={handleRetryWorkflow}>
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Retry All
                                </Button>
                            )}
                            {onRefresh && (
                                <Button variant="ghost" size="sm" onClick={onRefresh}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Execution Logs */}
            <Card>
                <CardHeader className="cursor-pointer" onClick={() => setShowLogs(prev => ({ ...prev, 'main': !prev['main'] }))}>
                    <CardTitle className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Execution Logs ({executionLogs.length})
                        </span>
                        <Button variant="ghost" size="sm">
                            {showLogs['main'] ? 'Hide' : 'Show'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                {showLogs['main'] && (
                    <CardContent>
                        <ScrollArea className="h-64 rounded-lg border border-slate-200 bg-slate-900 p-4">
                            <div className="space-y-1 font-mono text-xs">
                                {executionLogs.map((log, idx) => (
                                    <div key={idx} className={cn(
                                        "flex gap-3",
                                        log.level === 'error' && 'text-red-400',
                                        log.level === 'success' && 'text-green-400',
                                        log.level === 'warning' && 'text-yellow-400',
                                        log.level === 'info' && 'text-blue-400'
                                    )}>
                                        <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        <span className="uppercase font-semibold">[{log.level}]</span>
                                        <span className="text-slate-300">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                )}
            </Card>

            {/* Initial Input */}
            {execution?.initial_input && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Initial Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-700">{execution.initial_input}</p>
                    </CardContent>
                </Card>
            )}

            {/* Pipeline Steps */}
            <div className="space-y-4">
                {steps.map((step, index) => {
                    const status = getStepStatus(index);
                    const output = getStepOutput(index);
                    const stepResult = execution?.step_results?.find(r => r.step_index === index);
                    const conversation = stepResult?.conversation_id ? stepConversations[stepResult.conversation_id] : null;

                    return (
                        <div key={index}>
                            <Card className={cn(
                                "border-2 transition-all",
                                status === 'completed' && "border-green-200 bg-green-50",
                                status === 'running' && "border-blue-200 bg-blue-50",
                                status === 'failed' && "border-red-200 bg-red-50",
                                status === 'pending' && "border-slate-200"
                            )}>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-base">{step.step_name}</CardTitle>
                                            <p className="text-sm text-slate-600">Agent: {step.agent_name}</p>
                                        </div>
                                        {getStatusIcon(status)}
                                    </div>
                                    {step.instructions && (
                                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                                            <p className="text-xs text-slate-600">
                                                <span className="font-semibold">Instructions:</span> {step.instructions}
                                            </p>
                                        </div>
                                    )}
                                </CardHeader>

                                {/* Show conversation messages if step is running or completed */}
                                {conversation && (
                                    <CardContent>
                                        <div className="space-y-3 bg-white rounded-lg p-4 border border-slate-200">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Agent Conversation</p>
                                            <ScrollArea className="max-h-96">
                                                <div className="space-y-3">
                                                    {conversation.messages?.map((message, idx) => (
                                                        <MessageBubble key={idx} message={message} />
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </CardContent>
                                )}

                                {/* Show output if step is completed */}
                                {status === 'completed' && output && (
                                    <CardContent>
                                        <div className="bg-white rounded-lg p-4 border border-green-200">
                                            <p className="text-xs font-semibold text-green-700 uppercase mb-2">Step Output</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{output}</p>
                                        </div>
                                    </CardContent>
                                )}

                                {/* Show error and retry options if step failed */}
                                {status === 'failed' && (
                                    <CardContent>
                                        <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-3">
                                            <div className="flex items-start gap-2">
                                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-red-700">Step Failed</p>
                                                    <p className="text-sm text-red-600 mt-1">
                                                        {stepResult?.error || 'An error occurred during execution'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                                    onClick={() => setShowRetryDialog(index)}
                                                >
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    Retry Step
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => toggleLogs(index)}
                                                >
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    View Logs
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}

                                {/* Step-specific logs */}
                                {showLogs[index] && (
                                    <CardContent>
                                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                                            <p className="text-xs font-semibold text-slate-300 uppercase mb-2">Step Logs</p>
                                            <div className="space-y-1 font-mono text-xs text-slate-400">
                                                <div>[{stepResult?.started_at}] Step started</div>
                                                <div>[{stepResult?.started_at}] Agent: {step.agent_name}</div>
                                                <div>[{stepResult?.started_at}] Conversation ID: {stepResult?.conversation_id}</div>
                                                {status === 'completed' && (
                                                    <div className="text-green-400">[{stepResult?.completed_at}] Step completed successfully</div>
                                                )}
                                                {status === 'failed' && (
                                                    <div className="text-red-400">[{stepResult?.completed_at}] Step failed: {stepResult?.error}</div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Retry Dialog */}
                            {showRetryDialog === index && (
                                <Card className="border-2 border-orange-200 bg-orange-50 mt-4">
                                    <CardHeader>
                                        <CardTitle className="text-sm">Retry Step with Updated Parameters</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-700 mb-1 block">
                                                Modified Instructions (optional)
                                            </label>
                                            <Textarea
                                                placeholder="Enter new instructions or leave empty to use original..."
                                                value={retryParams[index]?.instructions || ''}
                                                onChange={(e) => setRetryParams(prev => ({
                                                    ...prev,
                                                    [index]: { ...prev[index], instructions: e.target.value }
                                                }))}
                                                rows={3}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => setShowRetryDialog(null)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                size="sm"
                                                className="bg-orange-600 hover:bg-orange-700"
                                                onClick={() => handleRetryStep(index)}
                                            >
                                                <RotateCcw className="h-3 w-3 mr-1" />
                                                Retry Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Arrow between steps */}
                            {index < steps.length - 1 && (
                                <div className="flex justify-center py-2">
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                                        status === 'completed' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        Handoff
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Final Output */}
            {execution?.status === 'completed' && execution?.final_output && (
                <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-5 w-5" />
                            Final Output
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                            <p className="text-slate-700 whitespace-pre-wrap">{execution.final_output}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}