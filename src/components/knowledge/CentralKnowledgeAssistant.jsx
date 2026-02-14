import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Search, BookOpen, TrendingUp, AlertCircle, Zap, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CentralKnowledgeAssistant({ onNavigate }) {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState(null);
    const [stats, setStats] = useState({});

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [articles, gaps, access] = await Promise.all([
                base44.entities.KnowledgeArticle.list(),
                base44.entities.KnowledgeQuery.filter({ results_found: false }),
                base44.entities.AgentKnowledgeAccess.list('-created_date', 100)
            ]);

            const recentAccess = access.filter(a => {
                const date = new Date(a.created_date);
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 1);
                return date > dayAgo;
            });

            setStats({
                totalArticles: articles.length,
                knowledgeGaps: gaps.length,
                accessesToday: recentAccess.length,
                verified: articles.filter(a => a.verified).length
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const search = async () => {
        if (!query.trim()) {
            toast.error('Enter a search query');
            return;
        }

        setSearching(true);
        try {
            const [articles, workflows, agents] = await Promise.all([
                base44.entities.KnowledgeArticle.list(),
                base44.entities.Workflow.list().catch(() => []),
                base44.agents.listAgents().catch(() => [])
            ]);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `User asks: "${query}"

Knowledge Articles:
${articles.map(a => `- [${a.category}] ${a.title}: ${a.content.substring(0, 150)}...`).join('\n')}

Available Workflows:
${workflows.map(w => `- ${w.name}: ${w.description || 'No description'}`).join('\n')}

Available Agents:
${agents.map(a => a.name).join(', ')}

Provide:
1. Direct answer if possible
2. Relevant knowledge articles (by title)
3. Related workflows if applicable
4. Suggested agents to ask
5. Whether this reveals a knowledge gap`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        answer: { type: "string" },
                        relevant_articles: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    relevance: { type: "string" }
                                }
                            }
                        },
                        suggested_workflows: {
                            type: "array",
                            items: { type: "string" }
                        },
                        suggested_agents: {
                            type: "array",
                            items: { type: "string" }
                        },
                        knowledge_gap: { type: "boolean" },
                        gap_description: { type: "string" }
                    }
                }
            });

            // Track the query
            const user = await base44.auth.me().catch(() => ({ email: 'system' }));
            await base44.entities.KnowledgeQuery.create({
                query,
                queried_by: user.email,
                results_found: result.relevant_articles?.length > 0,
                knowledge_gap_identified: result.knowledge_gap,
                suggested_article_title: result.gap_description
            }).catch(console.error);

            setResults(result);
        } catch (error) {
            console.error('Search failed:', error);
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-600">{stats.totalArticles || 0}</p>
                            <p className="text-xs text-slate-600">Articles</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-amber-600">{stats.knowledgeGaps || 0}</p>
                            <p className="text-xs text-slate-600">Knowledge Gaps</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-600">{stats.accessesToday || 0}</p>
                            <p className="text-xs text-slate-600">Views Today</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-600">{stats.verified || 0}</p>
                            <p className="text-xs text-slate-600">Verified</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Interface */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        Knowledge Assistant
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && search()}
                            placeholder="Ask anything... 'How to create a workflow?' 'What agents are available?'"
                            className="flex-1"
                        />
                        <Button onClick={search} disabled={searching}>
                            {searching ? (
                                <Brain className="h-4 w-4 animate-pulse" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {results && (
                        <div className="space-y-4">
                            {/* Direct Answer */}
                            {results.answer && (
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">Answer:</p>
                                    <p className="text-sm text-slate-700">{results.answer}</p>
                                </div>
                            )}

                            {/* Relevant Articles */}
                            {results.relevant_articles?.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Relevant Articles:
                                    </p>
                                    <div className="space-y-2">
                                        {results.relevant_articles.map((article, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded border hover:shadow-md transition-all cursor-pointer"
                                                 onClick={() => onNavigate?.('KnowledgeBase', { search: article.title })}>
                                                <p className="font-medium text-sm text-slate-800">{article.title}</p>
                                                <p className="text-xs text-slate-600">{article.relevance}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Actions */}
                            {(results.suggested_workflows?.length > 0 || results.suggested_agents?.length > 0) && (
                                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                                    <p className="text-sm font-semibold text-purple-900 mb-2">You might want to:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {results.suggested_workflows?.map((wf, idx) => (
                                            <Badge key={idx} variant="outline" className="cursor-pointer"
                                                   onClick={() => onNavigate?.('Workflows')}>
                                                Workflow: {wf}
                                            </Badge>
                                        ))}
                                        {results.suggested_agents?.map((agent, idx) => (
                                            <Badge key={idx} variant="outline" className="cursor-pointer"
                                                   onClick={() => onNavigate?.('Agents')}>
                                                Agent: {agent}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Knowledge Gap Warning */}
                            {results.knowledge_gap && (
                                <div className="bg-amber-50 p-3 rounded border-2 border-amber-200 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-amber-900 mb-1">Knowledge Gap Detected</p>
                                        <p className="text-xs text-amber-700 mb-2">{results.gap_description}</p>
                                        <Button size="sm" variant="outline"
                                                onClick={() => onNavigate?.('KnowledgeBase', { create: true })}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Create Article
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}