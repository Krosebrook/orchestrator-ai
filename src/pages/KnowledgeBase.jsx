import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, Plus, TrendingUp, Brain } from 'lucide-react';
import { toast } from 'sonner';
import KnowledgeArticleCard from '../components/knowledge/KnowledgeArticleCard';
import KnowledgeArticleEditor from '../components/knowledge/KnowledgeArticleEditor';
import KnowledgeGapAnalysis from '../components/knowledge/KnowledgeGapAnalysis';
import AIKnowledgeManager from '../components/knowledge/AIKnowledgeManager';
import NaturalLanguageKnowledgeSearch from '../components/knowledge/NaturalLanguageKnowledgeSearch';
import FrequentQuestionAnalyzer from '../components/knowledge/FrequentQuestionAnalyzer';
import CentralKnowledgeAssistant from '../components/knowledge/CentralKnowledgeAssistant';
import KnowledgeConsistencyChecker from '../components/knowledge/KnowledgeConsistencyChecker';

export default function KnowledgeBasePage() {
    const [articles, setArticles] = useState([]);
    const [queries, setQueries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showEditor, setShowEditor] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [articlesList, queriesList] = await Promise.all([
                base44.entities.KnowledgeArticle.list('-updated_date'),
                base44.entities.KnowledgeQuery.list('-created_date', 100)
            ]);
            setArticles(articlesList || []);
            setQueries(queriesList || []);
        } catch (error) {
            console.error('Failed to load knowledge base:', error);
            toast.error('Failed to load knowledge base');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveArticle = async (articleData) => {
        try {
            const user = await base44.auth.me();
            if (editingArticle) {
                await base44.entities.KnowledgeArticle.update(editingArticle.id, articleData);
                toast.success('Article updated');
            } else {
                await base44.entities.KnowledgeArticle.create({
                    ...articleData,
                    contributed_by: user.email
                });
                toast.success('Article created');
            }
            await loadData();
            setShowEditor(false);
            setEditingArticle(null);
        } catch (error) {
            console.error('Failed to save article:', error);
            toast.error('Failed to save article');
        }
    };

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-blue-600 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Knowledge Base
                        </h1>
                        <p className="text-slate-600 mt-1">Centralized knowledge for all agents</p>
                    </div>
                    <Button onClick={() => {
                        setEditingArticle(null);
                        setShowEditor(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Article
                    </Button>
                </div>

                <Tabs defaultValue="assistant">
                    <TabsList className="bg-white">
                        <TabsTrigger value="assistant">
                            <Brain className="h-4 w-4 mr-2" />
                            Assistant
                        </TabsTrigger>
                        <TabsTrigger value="ai-search">
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </TabsTrigger>
                        <TabsTrigger value="browse">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Browse
                        </TabsTrigger>
                        <TabsTrigger value="gaps">
                            <Brain className="h-4 w-4 mr-2" />
                            Gaps & Quality
                        </TabsTrigger>
                        <TabsTrigger value="trending">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Trending
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="assistant" className="space-y-6">
                        <CentralKnowledgeAssistant 
                            onNavigate={(page, params) => {
                                if (params?.create) {
                                    setShowEditor(true);
                                }
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="ai-search" className="space-y-6">
                        <NaturalLanguageKnowledgeSearch 
                            onArticleSelect={(article) => {
                                setEditingArticle(article);
                                setShowEditor(true);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="browse" className="space-y-4">
                        <div className="flex gap-4">
                            <Input
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1"
                            />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border rounded-lg"
                            >
                                <option value="all">All Categories</option>
                                <option value="agent_best_practices">Agent Best Practices</option>
                                <option value="workflow_patterns">Workflow Patterns</option>
                                <option value="integration_guides">Integration Guides</option>
                                <option value="troubleshooting">Troubleshooting</option>
                                <option value="api_documentation">API Documentation</option>
                                <option value="business_rules">Business Rules</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredArticles.map(article => (
                                <KnowledgeArticleCard
                                    key={article.id}
                                    article={article}
                                    onEdit={(a) => {
                                        setEditingArticle(a);
                                        setShowEditor(true);
                                    }}
                                    onDelete={async (id) => {
                                        await base44.entities.KnowledgeArticle.delete(id);
                                        await loadData();
                                        toast.success('Article deleted');
                                    }}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="questions" className="space-y-6">
                        <FrequentQuestionAnalyzer 
                            onCreateArticle={(articleData) => {
                                setEditingArticle(articleData);
                                setShowEditor(true);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="gaps" className="space-y-6">
                        <AIKnowledgeManager onArticleGenerated={loadData} />
                        <KnowledgeConsistencyChecker 
                            articles={articles}
                            onFixRequired={(issue, affectedArticles) => {
                                if (affectedArticles.length > 0) {
                                    setEditingArticle(affectedArticles[0]);
                                    setShowEditor(true);
                                }
                            }}
                        />
                        <KnowledgeGapAnalysis queries={queries} articles={articles} onCreateArticle={() => setShowEditor(true)} />
                    </TabsContent>

                    <TabsContent value="trending">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {articles
                                .sort((a, b) => (b.access_count || 0) - (a.access_count || 0))
                                .slice(0, 9)
                                .map(article => (
                                    <KnowledgeArticleCard
                                        key={article.id}
                                        article={article}
                                        onEdit={(a) => {
                                            setEditingArticle(a);
                                            setShowEditor(true);
                                        }}
                                        onDelete={async (id) => {
                                            await base44.entities.KnowledgeArticle.delete(id);
                                            await loadData();
                                        }}
                                    />
                                ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {showEditor && (
                    <KnowledgeArticleEditor
                        article={editingArticle}
                        open={showEditor}
                        onClose={() => {
                            setShowEditor(false);
                            setEditingArticle(null);
                        }}
                        onSave={handleSaveArticle}
                    />
                )}
            </div>
        </div>
    );
}