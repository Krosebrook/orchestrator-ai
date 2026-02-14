import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, BookOpen, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function RealtimeArticleSuggester({ conversation, visible = true }) {
    const [suggestions, setSuggestions] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (conversation?.messages?.length > 0 && visible) {
            analyzeConversation();
        }
    }, [conversation?.messages?.length, visible]);

    const analyzeConversation = async () => {
        if (analyzing) return;
        
        setAnalyzing(true);
        try {
            const recentMessages = conversation.messages?.slice(-5) || [];
            if (recentMessages.length === 0) return;

            const [articles, queries] = await Promise.all([
                base44.entities.KnowledgeArticle.list('-access_count', 50),
                base44.entities.KnowledgeQuery.filter({ results_found: false }, '-created_date', 20).catch(() => [])
            ]);

            const conversationContext = recentMessages.map(m => 
                `${m.role}: ${m.content?.substring(0, 200)}`
            ).join('\n');

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this conversation and suggest relevant knowledge articles:

Conversation Context:
${conversationContext}

Available Articles:
${articles.slice(0, 30).map(a => `- ${a.title} (${a.category}): ${a.content.substring(0, 150)}...`).join('\n')}

Unanswered Questions (gaps):
${queries.slice(0, 10).map(q => `- ${q.query}`).join('\n')}

Suggest 2-3 most relevant articles that would help with this conversation.
If there's a clear knowledge gap (question not covered), flag it.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        relevant_articles: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    article_title: { type: "string" },
                                    relevance: { type: "string" },
                                    confidence: { type: "number" }
                                }
                            }
                        },
                        knowledge_gap: { type: "boolean" },
                        gap_description: { type: "string" }
                    }
                }
            });

            const matchedArticles = result.relevant_articles
                .map(ra => {
                    const article = articles.find(a => a.title === ra.article_title);
                    return article ? { ...article, relevance: ra.relevance, confidence: ra.confidence } : null;
                })
                .filter(a => a && !dismissed.has(a.id));

            setSuggestions(matchedArticles);

            // Track knowledge gap
            if (result.knowledge_gap) {
                await base44.entities.KnowledgeQuery.create({
                    query: result.gap_description,
                    queried_by: 'conversation-analysis',
                    results_found: false,
                    knowledge_gap_identified: true,
                    conversation_id: conversation.id
                }).catch(console.error);
            }
        } catch (error) {
            console.error('Failed to analyze conversation:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const dismissSuggestion = (articleId) => {
        setDismissed(prev => new Set([...prev, articleId]));
        setSuggestions(prev => prev.filter(s => s.id !== articleId));
    };

    const trackArticleView = async (article) => {
        try {
            await base44.entities.KnowledgeArticle.update(article.id, {
                access_count: (article.access_count || 0) + 1,
                last_accessed: new Date().toISOString()
            });

            await base44.entities.AgentKnowledgeAccess.create({
                agent_name: conversation.agent_name || 'user',
                knowledge_article_id: article.id,
                access_type: 'read',
                context: {
                    conversation_id: conversation.id,
                    triggered_by: 'realtime-suggestion'
                }
            }).catch(console.error);
        } catch (error) {
            console.error('Failed to track access:', error);
        }
    };

    if (!visible || suggestions.length === 0) return null;

    return (
        <div className="space-y-2">
            {suggestions.map(article => (
                <Card key={article.id} className="border-2 border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-slate-800 truncate">
                                            {article.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                                            {article.relevance}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => dismissSuggestion(article.id)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {article.category}
                                    </Badge>
                                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                        {Math.round(article.confidence * 100)}% match
                                    </Badge>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => {
                                            trackArticleView(article);
                                            window.open(`/KnowledgeBase?article=${article.id}`, '_blank');
                                        }}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}