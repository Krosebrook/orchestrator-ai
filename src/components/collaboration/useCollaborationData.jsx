// Custom hook for data fetching and session management
// Separates business logic from presentation layer
import { useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";

export function useCollaborationData() {
    const [sessions, setSessions] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Memoized data loading function
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [sessionData, agentsList] = await Promise.all([
                base44.entities.AgentCollaborationSession.list('-updated_date'),
                base44.agents.listAgents()
            ]);
            setSessions(sessionData || []);
            setAgents(agentsList || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Create new collaboration session
    const createSession = useCallback(async (sessionData) => {
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

            // Update local state with new session
            setSessions(prev => [newSession, ...prev]);
            return newSession;
        } catch (err) {
            console.error('Failed to create session:', err);
            throw err;
        }
    }, []);

    return {
        sessions,
        agents,
        loading,
        error,
        loadData,
        createSession
    };
}