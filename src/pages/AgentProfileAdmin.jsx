import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, FileText } from 'lucide-react';
import AgentSelfReportManager from '../components/agents/AgentSelfReportManager';
import AgentErrorLogViewer from '../components/agents/AgentErrorLogViewer';
import TaskPerformanceBreakdownView from '../components/agents/TaskPerformanceBreakdownView';
import AISkillGapAnalysis from '../components/agents/AISkillGapAnalysis';
import AILearningPathGenerator from '../components/agents/AILearningPathGenerator';
import AIFeedbackSynthesizer from '../components/agents/AIFeedbackSynthesizer';
import { Badge } from "@/components/ui/badge";

export default function AgentProfileAdminPage() {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [user, setUser] = useState(null);
    const [agentProfiles, setAgentProfiles] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [currentUser, agentsList, profilesList] = await Promise.all([
                base44.auth.me(),
                base44.agents.listAgents(),
                base44.entities.AgentProfile.list()
            ]);
            
            setUser(currentUser);
            setAgents(agentsList || []);
            setAgentProfiles(profilesList || []);
            if (agentsList && agentsList.length > 0) {
                setSelectedAgent(agentsList[0].name);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card>
                        <CardContent className="pt-12 pb-12 text-center">
                            <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
                            <p className="text-slate-600">Admin access required</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Agent Profile Administration
                    </h1>
                    <p className="text-slate-600 mt-2">Review self-reports, error logs, and performance data</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Select Agent</span>
                            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                <SelectTrigger className="w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map((agent) => (
                                        <SelectItem key={agent.name} value={agent.name}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardTitle>
                    </CardHeader>
                </Card>

                {selectedAgent && (
                    <Tabs defaultValue="ai-insights">
                        <TabsList className="bg-white">
                            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
                            <TabsTrigger value="reports">
                                <FileText className="h-4 w-4 mr-2" />
                                Self-Reports
                            </TabsTrigger>
                            <TabsTrigger value="errors">Error Logs</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="ai-insights" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AISkillGapAnalysis 
                                    agentName={selectedAgent} 
                                    profile={agentProfiles.find(p => p.agent_name === selectedAgent)}
                                />
                                <AILearningPathGenerator 
                                    agentName={selectedAgent}
                                    profile={agentProfiles.find(p => p.agent_name === selectedAgent)}
                                />
                            </div>
                            <div className="mt-6">
                                <AIFeedbackSynthesizer agentName={selectedAgent} />
                            </div>
                        </TabsContent>

                        <TabsContent value="reports" className="mt-6">
                            <AgentSelfReportManager agentName={selectedAgent} isAdmin={true} />
                        </TabsContent>

                        <TabsContent value="errors" className="mt-6">
                            <AgentErrorLogViewer agentName={selectedAgent} />
                        </TabsContent>

                        <TabsContent value="performance" className="mt-6">
                            <TaskPerformanceBreakdownView agentName={selectedAgent} />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}