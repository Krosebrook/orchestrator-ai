import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Activity, Zap } from 'lucide-react';
import CollaborationSessionCard from '../components/collaboration/CollaborationSessionCard';
import CollaborationWorkspace from '../components/collaboration/CollaborationWorkspace';
import NewCollaborationDialog from '../components/collaboration/NewCollaborationDialog';

export default function AgentCollaborationHubPage() {
    const [sessions, setSessions] = useState([]);
    const [agents, setAgents] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sessionData, agentsList] = await Promise.all([
                base44.entities.AgentCollaborationSession.list('-updated_date'),
                base44.agents.listAgents()
            ]);
            setSessions(sessionData || []);
            setAgents(agentsList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSession = async (sessionData) => {
        try {
            const newSession = await base44.entities.AgentCollaborationSession.create({
                ...sessionData,
                status: 'active',
                interactions: [],
                proposals: [],
                shared_context: {},
                metrics: {
                    total_interactions: 0,
                    proposals_made: 0,
                    proposals_executed: 0,
                    start_time: new Date().toISOString()
                }
            });
            
            // Initialize conversations for each agent
            const updatedAgents = await Promise.all(
                sessionData.participating_agents.map(async (agent) => {
                    const conv = await base44.agents.createConversation({
                        agent_name: agent.agent_name,
                        metadata: {
                            name: `Collaboration: ${sessionData.name}`,
                            collaboration_session_id: newSession.id
                        }
                    });
                    return { ...agent, conversation_id: conv.id };
                })
            );

            await base44.entities.AgentCollaborationSession.update(newSession.id, {
                participating_agents: updatedAgents
            });

            setSessions([newSession, ...sessions]);
            setShowNewDialog(false);
            setSelectedSession(newSession);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Activity className="h-12 w-12 text-blue-600 mx-auto mb-3 animate-spin" />
                    <p className="text-slate-600">Loading collaboration hub...</p>
                </div>
            </div>
        );
    }

    if (selectedSession) {
        return (
            <CollaborationWorkspace
                session={selectedSession}
                agents={agents}
                onBack={() => {
                    setSelectedSession(null);
                    loadData();
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Agent Collaboration Hub
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Multi-agent real-time collaboration workspace
                        </p>
                    </div>
                    <Button onClick={() => setShowNewDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                        <Plus className="h-4 w-4 mr-2" />
                        New Collaboration
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Sessions</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {sessions.filter(s => s.status === 'active').length}
                                    </p>
                                </div>
                                <Activity className="h-10 w-10 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Agents</p>
                                    <p className="text-3xl font-bold text-slate-800">{agents.length}</p>
                                </div>
                                <Users className="h-10 w-10 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Completed</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {sessions.filter(s => s.status === 'completed').length}
                                    </p>
                                </div>
                                <Zap className="h-10 w-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Collaboration Sessions</h2>
                    {sessions.length === 0 ? (
                        <Card>
                            <CardContent className="pt-12 pb-12 text-center">
                                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 mb-4">No collaboration sessions yet</p>
                                <Button onClick={() => setShowNewDialog(true)}>
                                    Create Your First Collaboration
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sessions.map((session) => (
                                <CollaborationSessionCard
                                    key={session.id}
                                    session={session}
                                    onClick={() => setSelectedSession(session)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <NewCollaborationDialog
                    open={showNewDialog}
                    onClose={() => setShowNewDialog(false)}
                    agents={agents}
                    onCreate={createSession}
                />
            </div>
        </div>
    );
}