import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, Target, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MessageBubble from '../agents/MessageBubble';

export default function ScenarioSimulator({ open, onClose, module, scenario, agents, onComplete }) {
    const [selectedAgent, setSelectedAgent] = useState('');
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [running, setRunning] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        if (open) {
            const targetAgents = module.target_agents || [];
            if (targetAgents.length > 0 && agents.some(a => a.name === targetAgents[0])) {
                setSelectedAgent(targetAgents[0]);
            }
        }
    }, [open, module, agents]);

    const startSimulation = async () => {
        if (!selectedAgent) {
            toast.error('Please select an agent');
            return;
        }

        setRunning(true);
        setStartTime(Date.now());

        try {
            const conv = await base44.agents.createConversation({
                agent_name: selectedAgent,
                metadata: {
                    name: `Training: ${scenario.name}`,
                    training_module_id: module.id,
                    scenario_id: scenario.id
                }
            });

            setConversation(conv);

            await base44.agents.addMessage(conv, {
                role: 'user',
                content: scenario.initial_prompt
            });

            const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
                setMessages(data.messages || []);
            });

            setTimeout(() => {
                unsubscribe();
                completeSimulation(conv.id);
            }, 60000);

        } catch (error) {
            console.error('Failed to start simulation:', error);
            toast.error('Failed to start simulation');
            setRunning(false);
        }
    };

    const completeSimulation = async (convId) => {
        try {
            const finalConv = await base44.agents.getConversation(convId);
            const agentMessages = (finalConv.messages || []).filter(m => m.role === 'assistant');
            const conversationText = agentMessages.map(m => m.content).join('\n\n');

            const feedbackResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Evaluate this agent's performance in a training scenario.

Scenario: ${scenario.name}
Description: ${scenario.description}
Expected Behaviors: ${scenario.expected_behaviors?.join(', ')}
Success Criteria: ${scenario.success_criteria?.join(', ')}

Agent's Response:
${conversationText}

Provide detailed feedback with:
1. Score (0-100)
2. Strengths demonstrated
3. Weaknesses identified
4. Specific suggestions for improvement
5. Overall assessment`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        score: { type: "number" },
                        strengths: { type: "array", items: { type: "string" } },
                        weaknesses: { type: "array", items: { type: "string" } },
                        suggestions: { type: "array", items: { type: "string" } },
                        overall_assessment: { type: "string" },
                        behaviors_demonstrated: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setFeedback(feedbackResult);
            setCompleted(true);
            setRunning(false);

            const completionTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            await onComplete({
                agent_name: selectedAgent,
                module_id: module.id,
                module_title: module.title,
                scenario_id: scenario.id,
                conversation_id: convId,
                status: 'completed',
                score: feedbackResult.score,
                feedback: {
                    strengths: feedbackResult.strengths,
                    weaknesses: feedbackResult.weaknesses,
                    suggestions: feedbackResult.suggestions,
                    overall_assessment: feedbackResult.overall_assessment
                },
                behaviors_demonstrated: feedbackResult.behaviors_demonstrated,
                completion_time_seconds: completionTime,
                attempts: 1
            });

        } catch (error) {
            console.error('Failed to complete simulation:', error);
            toast.error('Failed to evaluate performance');
            setRunning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Training Simulation: {scenario.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4">
                    <div className="col-span-2 flex flex-col">
                        {!conversation ? (
                            <Card className="flex-1">
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Scenario Description</h3>
                                        <p className="text-sm text-slate-600">{scenario.description}</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Initial Prompt</h3>
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                                            {scenario.initial_prompt}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Select Agent</label>
                                        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose an agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {agents.map(agent => (
                                                    <SelectItem key={agent.name} value={agent.name}>
                                                        {agent.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button onClick={startSimulation} className="w-full" disabled={!selectedAgent}>
                                        Start Simulation
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex-1 flex flex-col bg-white rounded-lg border overflow-hidden">
                                <div className="p-3 border-b bg-slate-50">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">Agent: {selectedAgent}</span>
                                        {running && (
                                            <Badge className="bg-blue-600">
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Running
                                            </Badge>
                                        )}
                                        {completed && (
                                            <Badge className="bg-green-600">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Completed
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {messages.map((msg, idx) => (
                                            <MessageBubble key={idx} message={msg} />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold text-sm mb-2">Expected Behaviors</h3>
                                <div className="space-y-1">
                                    {scenario.expected_behaviors?.map((behavior, idx) => (
                                        <div key={idx} className="text-xs flex items-start gap-1">
                                            <span>•</span>
                                            <span>{behavior}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold text-sm mb-2">Success Criteria</h3>
                                <div className="space-y-1">
                                    {scenario.success_criteria?.map((criteria, idx) => (
                                        <div key={idx} className="text-xs flex items-start gap-1">
                                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                                            <span>{criteria}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {feedback && (
                            <Card className="border-2 border-purple-200 bg-purple-50">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="h-4 w-4 text-purple-600" />
                                        <h3 className="font-semibold text-sm">AI Feedback</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-white p-2 rounded">
                                            <p className="text-xs font-semibold">Score</p>
                                            <p className="text-2xl font-bold text-purple-600">{feedback.score}/100</p>
                                        </div>
                                        {feedback.strengths?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold mb-1 text-green-700">Strengths</p>
                                                {feedback.strengths.map((s, i) => (
                                                    <p key={i} className="text-xs text-slate-600">✓ {s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {feedback.suggestions?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold mb-1 text-blue-700">Suggestions</p>
                                                {feedback.suggestions.map((s, i) => (
                                                    <p key={i} className="text-xs text-slate-600">💡 {s}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}