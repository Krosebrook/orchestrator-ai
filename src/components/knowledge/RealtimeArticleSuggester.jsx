import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, BookOpen } from 'lucide-react';

export default function RealtimeArticleSuggester({ conversationId, currentMessages }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentMessages && currentMessages.length > 0) {
            const lastMessage = currentMessages[currentMessages.length - 1];
            if (lastMessage?.role === 'user' && lastMessage?.content) {
                suggestArticles(lastMessage.content);
            }
        }
    }, [currentMessages?.length]);

    const suggestArticles = async (messageContent) => {
        setLoading(true);
        try {
            const articles = await base44.entities.KnowledgeArticle.list('-relevance_score', 100);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Based on this user message, suggest the most relevant knowledge articles:

User Message: "${messageContent}"

Available Articles:
${articles.slice(0, 50).map((a, idx) => 
    `${idx + 1}. ${a.title} (Category: ${a.category})
   Content: ${a.content.substring(0, 200)}...
   Tags: ${a.tags?.join(', ')}`
).join('\n\n')}

Analyze the user's intent and information needs, then suggest the top 3-5 most relevant articles that could help address their query or provide useful context.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    article_title: { type: "string" },
                                    relevance_reason: { type: "string" },
                                    relevance_score: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            const enrichedSuggestions = result.suggestions.map(sug => {
                const article = articles.find(a => a.title === sug.article_title);
                return { ...sug, article };
            }).filter(s => s.article);

            setSuggestions(enrichedSuggestions);
        } catch (error) {
            console.error('Failed to suggest articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArticleClick = async (article) => {
        try {
            await base44.entities.KnowledgeArticle.update(article.id, {
                access_count: (article.access_count || 0) + 1
            });
        } catch (error) {
            console.error('Failed to update access count:', error);
        }
    };

    if (suggestions.length === 0 && !loading) {
        return null;
    }

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Suggested Knowledge Articles</h3>
                </div>
                
                {loading ? (
                    <p className="text-sm text-slate-600">Analyzing context...</p>
                ) : (
                    <ScrollArea className="h-64">
                        <div className="space-y-3">
                            {suggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleArticleClick(suggestion.article)}
                                    className="bg-white p-3 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                            <h4 className="font-semibold text-sm text-slate-800">
                                                {suggestion.article.title}
                                            </h4>
                                        </div>
                                        <Badge className="bg-blue-600 flex-shrink-0">
                                            {Math.round(suggestion.relevance_score * 100)}%
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">
                                        {suggestion.relevance_reason}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {suggestion.article.category}
                                        </Badge>
                                        {suggestion.article.tags?.slice(0, 2).map((tag, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}