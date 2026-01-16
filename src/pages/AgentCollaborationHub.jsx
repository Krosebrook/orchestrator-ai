// Refactored to modern React patterns with custom hooks and component extraction
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Activity } from 'lucide-react';
import CollaborationWorkspace from '../components/collaboration/CollaborationWorkspace';
import NewCollaborationDialog from '../components/collaboration/NewCollaborationDialog';
import CollaborationStats from '../components/collaboration/CollaborationStats';
import SessionsList from '../components/collaboration/SessionsList';
import { useCollaborationData } from '../components/collaboration/useCollaborationData.jsx';

export default function AgentCollaborationHubPage() {
    // Custom hook handles all data fetching and state management
    const { sessions, agents, loading, loadData, createSession } = useCollaborationData();
    
    // Local UI state
    const [selectedSession, setSelectedSession] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);

    // Handler for creating new session
    const handleCreateSession = async (sessionData) => {
        try {
            const newSession = await createSession(sessionData);
            setShowNewDialog(false);
            setSelectedSession(newSession);
        } catch (error) {
            // Error already logged in hook
        }
    };

    // Loading state - early return pattern
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

    // Workspace view - early return pattern for cleaner code
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

    // Main hub view - extracted components for better modularity
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Agent Collaboration Hub
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Multi-agent real-time collaboration workspace
                        </p>
                    </div>
                    <Button 
                        onClick={() => setShowNewDialog(true)} 
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Collaboration
                    </Button>
                </div>

                {/* Stats cards - extracted to separate component */}
                <CollaborationStats sessions={sessions} agentsCount={agents.length} />

                {/* Sessions list - extracted to separate component */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                        Collaboration Sessions
                    </h2>
                    <SessionsList 
                        sessions={sessions}
                        onSelectSession={setSelectedSession}
                        onCreateSession={() => setShowNewDialog(true)}
                    />
                </div>

                {/* New collaboration dialog */}
                <NewCollaborationDialog
                    open={showNewDialog}
                    onClose={() => setShowNewDialog(false)}
                    agents={agents}
                    onCreate={handleCreateSession}
                />
            </div>
        </div>
    );
}