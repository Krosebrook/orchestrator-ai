import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles, Workflow as WorkflowIcon } from 'lucide-react';
import AgentCard from '../components/agents/AgentCard';
import ConversationList from '../components/agents/ConversationList';
import ChatWindow from '../components/agents/ChatWindow';
import AgentVersionManager from '../components/agents/AgentVersionManager';
import AgentProfileCard from '../components/agents/AgentProfileCard';

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [versionManagerOpen, setVersionManagerOpen] = useState(false);
    const [selectedAgentForVersions, setSelectedAgentForVersions] = useState(null);
    const [showCapabilities, setShowCapabilities] = useState(false);
    const [agentProfiles, setAgentProfiles] = useState([]);

    useEffect(() => {
        loadAgents();
    }, []);

    useEffect(() => {
        if (selectedAgent) {
            loadConversations();
        }
    }, [selectedAgent]);

    const loadAgents = async () => {
        try {
            const [agentsList, profilesList] = await Promise.all([
                base44.agents.listAgents(),
                base44.entities.AgentProfile.list()
            ]);
            setAgents(agentsList || []);
            setAgentProfiles(profilesList || []);
            if (agentsList && agentsList.length > 0) {
                setSelectedAgent(agentsList[0]);
            }
        } catch (error) {
            console.error('Failed to load agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadConversations = async () => {
        if (!selectedAgent) return;
        
        try {
            const convList = await base44.agents.listConversations({
                agent_name: selectedAgent.name
            });
            setConversations(convList || []);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const handleNewConversation = async () => {
        if (!selectedAgent) return;

        try {
            const newConv = await base44.agents.createConversation({
                agent_name: selectedAgent.name,
                metadata: {
                    name: `New Chat - ${new Date().toLocaleDateString()}`,
                    description: 'Agent conversation'
                }
            });
            setConversations([newConv, ...conversations]);
            setSelectedConversation(newConv);
            setMobileMenuOpen(false);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleSelectConversation = (conv) => {
        setSelectedConversation(conv);
        setMobileMenuOpen(false);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-slate-600">Loading agents...</p>
                </div>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center space-y-4 max-w-md">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
                        <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">No Agents Found</h2>
                    <p className="text-slate-600">
                        Create an agent configuration in the <code className="bg-slate-200 px-2 py-1 rounded">agents/</code> directory to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="lg:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 p-0">
                                <ConversationList
                                    conversations={conversations}
                                    selectedConversation={selectedConversation}
                                    onSelectConversation={handleSelectConversation}
                                    onNewConversation={handleNewConversation}
                                />
                            </SheetContent>
                        </Sheet>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Agent Orchestration
                            </h1>
                            <p className="text-sm text-slate-500">Manage your AI agents</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/Workflows'}
                        variant="outline"
                        className="hidden md:flex"
                    >
                        <WorkflowIcon className="h-4 w-4 mr-2" />
                        Workflows
                    </Button>
                </div>
            </div>

            {/* Agent Selection */}
            {!selectedConversation && (
                <div className="flex-1 overflow-auto px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-xl font-semibold text-slate-800 mb-6">Select an Agent</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map((agent) => {
                                const profile = agentProfiles.find(p => p.agent_name === agent.name);
                                return (
                                    <AgentCard
                                        key={agent.name}
                                        agent={agent}
                                        profile={profile}
                                        onSelect={setSelectedAgent}
                                        isSelected={selectedAgent?.name === agent.name}
                                        onManageVersions={(agent) => {
                                            setSelectedAgentForVersions(agent);
                                            setVersionManagerOpen(true);
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {selectedAgent && conversations.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-xl font-semibold text-slate-800 mb-6">Recent Conversations</h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {conversations.slice(0, 5).map((conv) => (
                                        <div
                                            key={conv.id}
                                            onClick={() => handleSelectConversation(conv)}
                                            className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                                        >
                                            <p className="font-medium text-slate-800">
                                                {conv.metadata?.name || 'Conversation'}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {conv.messages?.length || 0} messages
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat Interface */}
            {selectedConversation && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Desktop */}
                    <div className="hidden lg:block w-80 overflow-hidden">
                        <ConversationList
                            conversations={conversations}
                            selectedConversation={selectedConversation}
                            onSelectConversation={setSelectedConversation}
                            onNewConversation={handleNewConversation}
                        />
                    </div>

                    {/* Chat Window */}
                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1">
                            <ChatWindow 
                                conversation={selectedConversation} 
                                agent={selectedAgent}
                            />
                        </div>
                        <div className="hidden xl:block w-80 border-l bg-slate-50 overflow-y-auto p-4">
                            <AgentProfileCard 
                                profile={agentProfiles.find(p => p.agent_name === selectedAgent?.name)}
                                agent={selectedAgent}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Version Manager Dialog */}
            {selectedAgentForVersions && (
                <AgentVersionManager
                    open={versionManagerOpen}
                    onClose={() => {
                        setVersionManagerOpen(false);
                        setSelectedAgentForVersions(null);
                    }}
                    agentName={selectedAgentForVersions.name}
                    currentConfig={selectedAgentForVersions}
                />
            )}
        </div>
    );
}