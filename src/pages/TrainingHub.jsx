import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GraduationCap, Plus, BookOpen, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import TrainingModuleCreator from '../components/training/TrainingModuleCreator';
import TrainingModuleCard from '../components/training/TrainingModuleCard';
import ScenarioSimulator from '../components/training/ScenarioSimulator';
import TrainingRecommendations from '../components/training/TrainingRecommendations';
import TrainingAnalytics from '../components/training/TrainingAnalytics';

export default function TrainingHubPage() {
    const [agents, setAgents] = useState([]);
    const [modules, setModules] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModuleCreator, setShowModuleCreator] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [activeSimulation, setActiveSimulation] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [agentsList, modulesList, sessionsList, recsList] = await Promise.all([
                base44.agents.listAgents(),
                base44.entities.TrainingModule.list('-updated_date'),
                base44.entities.TrainingSession.list('-created_date', 100),
                base44.entities.TrainingRecommendation.filter({ status: 'pending' })
            ]);

            setAgents(agentsList || []);
            setModules(modulesList || []);
            setSessions(sessionsList || []);
            setRecommendations(recsList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load training data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateModule = async (moduleData) => {
        try {
            await base44.entities.TrainingModule.create(moduleData);
            toast.success('Training module created');
            await loadData();
            setShowModuleCreator(false);
        } catch (error) {
            console.error('Failed to create module:', error);
            toast.error('Failed to create training module');
        }
    };

    const handleStartSimulation = (module, scenario) => {
        setActiveSimulation({ module, scenario });
    };

    const handleSimulationComplete = async (sessionData) => {
        try {
            await base44.entities.TrainingSession.create(sessionData);
            toast.success('Training session completed');
            await loadData();
            setActiveSimulation(null);
        } catch (error) {
            console.error('Failed to save session:', error);
            toast.error('Failed to save training session');
        }
    };

    const stats = {
        totalModules: modules.length,
        activeTraining: sessions.filter(s => s.status === 'in_progress').length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        avgScore: sessions.length > 0 
            ? (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length).toFixed(1)
            : 0
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <GraduationCap className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading training hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AI Training Hub
                        </h1>
                        <p className="text-slate-600 mt-1">Develop and enhance agent capabilities</p>
                    </div>
                    <Button onClick={() => setShowModuleCreator(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Module
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Training Modules</p>
                                    <p className="text-3xl font-bold text-slate-800">{stats.totalModules}</p>
                                </div>
                                <BookOpen className="h-10 w-10 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Sessions</p>
                                    <p className="text-3xl font-bold text-slate-800">{stats.activeTraining}</p>
                                </div>
                                <Target className="h-10 w-10 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Completed</p>
                                    <p className="text-3xl font-bold text-slate-800">{stats.completedSessions}</p>
                                </div>
                                <GraduationCap className="h-10 w-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Avg Score</p>
                                    <p className="text-3xl font-bold text-slate-800">{stats.avgScore}</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="modules">
                    <TabsList className="bg-white">
                        <TabsTrigger value="modules">Training Modules</TabsTrigger>
                        <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="modules" className="mt-6 space-y-6">
                        {modules.length === 0 ? (
                            <Card>
                                <CardContent className="pt-12 pb-12 text-center">
                                    <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 mb-4">No training modules yet</p>
                                    <Button onClick={() => setShowModuleCreator(true)}>
                                        Create Your First Module
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {modules.map(module => (
                                    <TrainingModuleCard
                                        key={module.id}
                                        module={module}
                                        onStart={handleStartSimulation}
                                        sessions={sessions.filter(s => s.module_id === module.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="recommendations" className="mt-6">
                        <TrainingRecommendations
                            agents={agents}
                            modules={modules}
                            onRecommendationAccepted={loadData}
                        />
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-6">
                        <TrainingAnalytics sessions={sessions} modules={modules} agents={agents} />
                    </TabsContent>
                </Tabs>

                {/* Module Creator Dialog */}
                <TrainingModuleCreator
                    open={showModuleCreator}
                    onClose={() => setShowModuleCreator(false)}
                    agents={agents}
                    onCreate={handleCreateModule}
                />

                {/* Scenario Simulator */}
                {activeSimulation && (
                    <ScenarioSimulator
                        open={!!activeSimulation}
                        onClose={() => setActiveSimulation(null)}
                        module={activeSimulation.module}
                        scenario={activeSimulation.scenario}
                        agents={agents}
                        onComplete={handleSimulationComplete}
                    />
                )}
            </div>
        </div>
    );
}