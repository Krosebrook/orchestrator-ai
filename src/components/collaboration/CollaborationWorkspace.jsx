import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, FileText } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import AgentInteractionTimeline from './AgentInteractionTimeline';
import SharedContextPanel from './SharedContextPanel';
import ProposalVotingSystem from './ProposalVotingSystem';

export default function CollaborationWorkspace({ session, agents, onBack }) {
    const [currentSession, setCurrentSession] = useState(session);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            refreshSession();
        }, 3000);
        return () => clearInterval(interval);
    }, [currentSession.id]);

    const refreshSession = async () => {
        try {
            const updated = await base44.entities.AgentCollaborationSession.filter({ id: currentSession.id });
            if (updated && updated[0]) {
                setCurrentSession(updated[0]);
            }
        } catch (error) {
            console.error('Failed to refresh session:', error);
        }
    };

    const sendToAgents = async () => {
        if (!userInput.trim()) return;

        setLoading(true);
        try {
            const interactions = [...(currentSession.interactions || [])];
            
            interactions.push({
                from_agent: 'user',
                to_agent: 'all',
                message: userInput,
                timestamp: new Date().toISOString(),
                type: 'broadcast'
            });

            for (const agent of currentSession.participating_agents) {
                const conv = await base44.agents.getConversation(agent.conversation_id);
                
                const contextMessage = `COLLABORATION SESSION: ${currentSession.name}
Goal: ${currentSession.goal}
Participating Agents: ${currentSession.participating_agents.map(a => a.agent_name).join(', ')}

Shared Context: ${JSON.stringify(currentSession.shared_context)}

User Message: ${userInput}

Please respond with your contribution to this collaboration.`;

                await base44.agents.addMessage(conv, {
                    role: 'user',
                    content: contextMessage
                });

                // Poll for response
                const response = await pollForResponse(agent.conversation_id);
                
                interactions.push({
                    from_agent: agent.agent_name,
                    to_agent: 'all',
                    message: response,
                    timestamp: new Date().toISOString(),
                    type: 'response'
                });
            }

            await base44.entities.AgentCollaborationSession.update(currentSession.id, {
                interactions,
                metrics: {
                    ...currentSession.metrics,
                    total_interactions: interactions.length
                }
            });

            setUserInput('');
            await refreshSession();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    const pollForResponse = async (conversationId, maxAttempts = 30) => {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const conv = await base44.agents.getConversation(conversationId);
            const lastMessage = conv.messages[conv.messages.length - 1];
            if (lastMessage?.role === 'assistant' && lastMessage.content) {
                return lastMessage.content;
            }
        }
        return 'No response received';
    };

    const updateSharedContext = async (newContext) => {
        await base44.entities.AgentCollaborationSession.update(currentSession.id, {
            shared_context: { ...currentSession.shared_context, ...newContext }
        });
        await refreshSession();
    };

    const createProposal = async (proposal) => {
        const proposals = [...(currentSession.proposals || [])];
        proposals.push({
            id: `prop_${Date.now()}`,
            ...proposal,
            votes: {},
            status: 'pending'
        });

        await base44.entities.AgentCollaborationSession.update(currentSession.id, {
            proposals,
            metrics: {
                ...currentSession.metrics,
                proposals_made: proposals.length
            }
        });
        await refreshSession();
    };

    const voteOnProposal = async (proposalId, vote) => {
        const user = await base44.auth.me();
        const proposals = currentSession.proposals.map(p => {
            if (p.id === proposalId) {
                return {
                    ...p,
                    votes: { ...p.votes, [user.email]: vote }
                };
            }
            return p;
        });

        await base44.entities.AgentCollaborationSession.update(currentSession.id, { proposals });
        await refreshSession();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{currentSession.name}</h1>
                            <p className="text-sm text-slate-600">{currentSession.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-slate-600">Goal:</span>
                        <span className="font-medium">{currentSession.goal}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <AgentInteractionTimeline
                            interactions={currentSession.interactions || []}
                            agents={currentSession.participating_agents || []}
                        />

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Send Message to Agents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Textarea
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="What would you like the agents to work on?"
                                        rows={3}
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    onClick={sendToAgents}
                                    disabled={loading || !userInput.trim()}
                                    className="mt-3 w-full"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {loading ? 'Processing...' : 'Send to All Agents'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <SharedContextPanel
                            context={currentSession.shared_context || {}}
                            onUpdate={updateSharedContext}
                        />

                        <ProposalVotingSystem
                            proposals={currentSession.proposals || []}
                            agents={currentSession.participating_agents || []}
                            onCreate={createProposal}
                            onVote={voteOnProposal}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}