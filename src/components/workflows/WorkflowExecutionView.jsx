import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import MessageBubble from '../agents/MessageBubble';

export default function WorkflowExecutionView({ execution, workflow }) {
    const [stepConversations, setStepConversations] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (execution?.step_results) {
            execution.step_results.forEach((result) => {
                if (result.conversation_id && !stepConversations[result.conversation_id]) {
                    loadStepConversation(result.conversation_id);
                }
            });
        }
    }, [execution?.step_results]);

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

    const steps = workflow?.steps || [];

    return (
        <div className="space-y-6">
            {/* Execution Header */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                                {workflow?.name || 'Workflow Execution'}
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">{workflow?.description}</p>
                        </div>
                        <Badge
                            className={cn(
                                execution?.status === 'completed' && 'bg-green-500',
                                execution?.status === 'running' && 'bg-blue-500',
                                execution?.status === 'failed' && 'bg-red-500',
                                'text-white'
                            )}
                        >
                            {execution?.status || 'initializing'}
                        </Badge>
                    </div>
                </CardHeader>
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
                            </Card>

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