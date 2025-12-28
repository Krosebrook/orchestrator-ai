import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitMerge, Plus, Activity, TrendingUp, Sparkles } from 'lucide-react';
import OrchestrationBuilder from '../components/orchestration/OrchestrationBuilder';
import OrchestrationMonitor from '../components/orchestration/OrchestrationMonitor';
import AgentCollaborationView from '../components/orchestration/AgentCollaborationView';
import VisualWorkflowCanvas from '../components/orchestration/VisualWorkflowCanvas';
import OptimizationRecommendations from '../components/orchestration/OptimizationRecommendations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function OrchestrationPage() {
    const [orchestrations, setOrchestrations] = useState([]);
    const [agents, setAgents] = useState([]);
    const [handoffs, setHandoffs] = useState([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingOrchestration, setEditingOrchestration] = useState(null);
    const [selectedOrchestration, setSelectedOrchestration] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [orchestrationsData, agentsData, handoffsData] = await Promise.all([
                base44.entities.AgentOrchestration.list('-updated_date'),
                base44.agents.listAgents(),
                base44.entities.AgentHandoff.list('-created_date', 100)
            ]);
            
            setOrchestrations(orchestrationsData || []);
            setAgents(agentsData || []);
            setHandoffs(handoffsData || []);
        } catch (error) {
            console.error('Failed to load orchestration data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOrchestration = async (data) => {
        try {
            if (editingOrchestration) {
                await base44.entities.AgentOrchestration.update(editingOrchestration.id, data);
                toast.success('Orchestration updated');
            } else {
                await base44.entities.AgentOrchestration.create(data);
                toast.success('Orchestration created');
            }
            await loadData();
            setShowBuilder(false);
            setEditingOrchestration(null);
        } catch (error) {
            console.error('Failed to save orchestration:', error);
            toast.error('Failed to save orchestration');
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <GitMerge className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading orchestration data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Agent Orchestration Layer
                        </h1>
                        <p className="text-slate-600 mt-1">Design and monitor multi-agent collaboration workflows</p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingOrchestration(null);
                            setShowBuilder(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Orchestration
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Orchestrations</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {orchestrations.filter(o => o.status === 'active').length}
                                    </p>
                                </div>
                                <Activity className="h-10 w-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Agent Handoffs</p>
                                    <p className="text-3xl font-bold text-slate-800">{handoffs.length}</p>
                                </div>
                                <GitMerge className="h-10 w-10 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Success Rate</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {handoffs.length > 0 
                                            ? `${((handoffs.filter(h => h.status === 'completed').length / handoffs.length) * 100).toFixed(0)}%`
                                            : '0%'
                                        }
                                    </p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="orchestrations" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="orchestrations">Orchestrations</TabsTrigger>
                        <TabsTrigger value="visual">Visual Workflow</TabsTrigger>
                        <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
                        <TabsTrigger value="collaboration">Collaboration View</TabsTrigger>
                        <TabsTrigger value="optimization">
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Optimization
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="orchestrations">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orchestrations.map((orch) => (
                                <Card key={orch.id} className="hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => setSelectedOrchestration(orch)}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-base">{orch.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-600 mb-3">{orch.description}</p>
                                        <div className="space-y-2 text-xs">
                                            <p><strong>Agents:</strong> {orch.agents?.length || 0}</p>
                                            <p><strong>Protocol:</strong> {orch.communication_protocol}</p>
                                            <p><strong>Status:</strong> <span className="capitalize">{orch.status}</span></p>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingOrchestration(orch);
                                                    setShowBuilder(true);
                                                }}
                                                className="flex-1"
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="visual">
                        {selectedOrchestration ? (
                            <div className="space-y-4">
                                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{selectedOrchestration.name}</h3>
                                                <p className="text-sm text-slate-600">{selectedOrchestration.description}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedOrchestration(null)}
                                            >
                                                Back to List
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <VisualWorkflowCanvas 
                                    orchestration={selectedOrchestration}
                                    handoffs={handoffs}
                                    realTime={true}
                                />
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="pt-12 pb-12 text-center">
                                    <GitMerge className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 mb-4">Select an orchestration to visualize its workflow</p>
                                    <Button onClick={() => orchestrations.length > 0 && setSelectedOrchestration(orchestrations[0])}>
                                        View First Orchestration
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="monitor">
                        <OrchestrationMonitor 
                            orchestrations={orchestrations.filter(o => o.status === 'active')}
                            handoffs={handoffs}
                        />
                    </TabsContent>

                    <TabsContent value="collaboration">
                        <AgentCollaborationView 
                            orchestrations={orchestrations}
                            handoffs={handoffs}
                            agents={agents}
                        />
                    </TabsContent>

                    <TabsContent value="optimization">
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                                            AI-Powered Orchestration Optimization
                                        </h3>
                                        <p className="text-slate-600">
                                            Get intelligent recommendations based on agent profiles, historical performance, 
                                            and workflow analysis. Discover optimal agent pairings, identify bottlenecks, 
                                            and unlock efficiency improvements.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {orchestrations.length === 0 ? (
                                <Card>
                                    <CardContent className="pt-12 pb-12 text-center">
                                        <Sparkles className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">
                                            Create an orchestration to get AI-powered optimization recommendations
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {orchestrations.map((orch) => (
                                        <Card key={orch.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{orch.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <OptimizationRecommendations
                                                    orchestration={orch}
                                                    onApplyOptimization={async (sequence) => {
                                                        const updatedAgents = sequence.map((agentName, idx) => ({
                                                            agent_name: agentName,
                                                            role: `Step ${idx + 1}`,
                                                            sequence: idx
                                                        }));
                                                        await base44.entities.AgentOrchestration.update(orch.id, {
                                                            agents: updatedAgents
                                                        });
                                                        toast.success('Orchestration updated with optimized sequence!');
                                                        loadData();
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Builder Dialog */}
                <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingOrchestration ? 'Edit' : 'Create'} Orchestration
                            </DialogTitle>
                        </DialogHeader>
                        <OrchestrationBuilder
                            orchestration={editingOrchestration}
                            agents={agents}
                            onSave={handleSaveOrchestration}
                            onCancel={() => {
                                setShowBuilder(false);
                                setEditingOrchestration(null);
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}