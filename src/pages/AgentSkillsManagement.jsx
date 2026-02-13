import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Search, Plus, TrendingUp, Book, Shield, Users } from 'lucide-react';
import AgentSkillMatrix from '../components/skills/AgentSkillMatrix';
import SkillDefinitionManager from '../components/skills/SkillDefinitionManager';
import KnowledgeAccessDashboard from '../components/skills/KnowledgeAccessDashboard';
import SkillLearningAnalytics from '../components/skills/SkillLearningAnalytics';
import SkillVerificationPanel from '../components/skills/SkillVerificationPanel';
import CrossAgentSkillComparison from '../components/skills/CrossAgentSkillComparison';
import { toast } from 'sonner';

export default function AgentSkillsManagementPage() {
    const [agents, setAgents] = useState([]);
    const [skills, setSkills] = useState([]);
    const [knowledgeAccess, setKnowledgeAccess] = useState([]);
    const [knowledgeArticles, setKnowledgeArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [agentsList, skillsList, accessList, articlesList] = await Promise.all([
                base44.agents.listAgents(),
                base44.entities.AgentSkill.list('-updated_date'),
                base44.entities.AgentKnowledgeAccess.list('-created_date', 100),
                base44.entities.KnowledgeArticle.list('-updated_date')
            ]);
            
            setAgents(agentsList || []);
            setSkills(skillsList || []);
            setKnowledgeAccess(accessList || []);
            setKnowledgeArticles(articlesList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load skills data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSkill = async (skillData) => {
        try {
            await base44.entities.AgentSkill.create(skillData);
            toast.success('Skill created successfully');
            await loadData();
        } catch (error) {
            console.error('Failed to create skill:', error);
            toast.error('Failed to create skill');
        }
    };

    const handleUpdateSkill = async (skillId, updates) => {
        try {
            await base44.entities.AgentSkill.update(skillId, updates);
            toast.success('Skill updated');
            await loadData();
        } catch (error) {
            console.error('Failed to update skill:', error);
            toast.error('Failed to update skill');
        }
    };

    const handleDeleteSkill = async (skillId) => {
        if (!confirm('Delete this skill?')) return;
        
        try {
            await base44.entities.AgentSkill.delete(skillId);
            toast.success('Skill deleted');
            await loadData();
        } catch (error) {
            console.error('Failed to delete skill:', error);
            toast.error('Failed to delete skill');
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading agent skills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Agent Skills & Knowledge
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Manage agent capabilities and shared knowledge base
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search agents, skills, or knowledge..."
                        className="pl-10 bg-white"
                    />
                </div>

                {/* Tabs */}
                <Tabs defaultValue="matrix" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="matrix">
                            <Brain className="h-4 w-4 mr-2" />
                            Skills Matrix
                        </TabsTrigger>
                        <TabsTrigger value="comparison">
                            <Users className="h-4 w-4 mr-2" />
                            Compare
                        </TabsTrigger>
                        <TabsTrigger value="manage">
                            <Plus className="h-4 w-4 mr-2" />
                            Manage Skills
                        </TabsTrigger>
                        <TabsTrigger value="verification">
                            <Shield className="h-4 w-4 mr-2" />
                            Verification
                        </TabsTrigger>
                        <TabsTrigger value="knowledge">
                            <Book className="h-4 w-4 mr-2" />
                            Knowledge Access
                        </TabsTrigger>
                        <TabsTrigger value="learning">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Learning Analytics
                        </TabsTrigger>
                    </TabsList>

                    {/* Skills Matrix Tab */}
                    <TabsContent value="matrix">
                        <AgentSkillMatrix
                            agents={agents}
                            skills={skills}
                            searchQuery={searchQuery}
                            onSelectAgent={setSelectedAgent}
                        />
                    </TabsContent>

                    {/* Manage Skills Tab */}
                    <TabsContent value="manage">
                        <SkillDefinitionManager
                            agents={agents}
                            skills={skills}
                            onCreate={handleCreateSkill}
                            onUpdate={handleUpdateSkill}
                            onDelete={handleDeleteSkill}
                        />
                    </TabsContent>

                    {/* Verification Tab */}
                    <TabsContent value="verification">
                        <SkillVerificationPanel onRefresh={loadData} />
                    </TabsContent>

                    {/* Knowledge Access Tab */}
                    <TabsContent value="knowledge">
                        <KnowledgeAccessDashboard
                            agents={agents}
                            knowledgeAccess={knowledgeAccess}
                            knowledgeArticles={knowledgeArticles}
                            skills={skills}
                            onRefresh={loadData}
                        />
                    </TabsContent>

                    {/* Learning Analytics Tab */}
                    <TabsContent value="learning">
                        <SkillLearningAnalytics
                            agents={agents}
                            skills={skills}
                            knowledgeAccess={knowledgeAccess}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}