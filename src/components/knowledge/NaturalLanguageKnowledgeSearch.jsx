import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, BookOpen, ThumbsUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function NaturalLanguageKnowledgeSearch({ onArticleSelect }) {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState(null);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        try {
            const allArticles = await base44.entities.KnowledgeArticle.list('-relevance_score', 200);

            // Log the search query
            await base44.entities.KnowledgeQuery.create({
                query: query,
                queried_by: (await base44.auth.me())?.email || 'Unknown',
                results_found: allArticles.length > 0
            });

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Natural language search query: "${query}"

Available Knowledge Base Articles:
${allArticles.map((a, idx) => 
    `${idx + 1}. ${a.title}
   Category: ${a.category}
   Content: ${a.content}
   Tags: ${a.tags?.join(', ')}
   Verified: ${a.verified ? 'Yes' : 'No'}`
).join('\n\n')}

Analyze the user's query intent and provide:
1. Top 5-10 most relevant articles (ranked by relevance)
2. A direct answer to the query if possible (synthesized from the articles)
3. Related topics the user might want to explore
4. Whether the query reveals a knowledge gap (no good answers available)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        direct_answer: { type: "string" },
                        answer_confidence: { type: "number" },
                        relevant_articles: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    article_title: { type: "string" },
                                    relevance_score: { type: "number" },
                                    why_relevant: { type: "string" },
                                    key_excerpt: { type: "string" }
                                }
                            }
                        },
                        related_topics: { type: "array", items: { type: "string" } },
                        knowledge_gap_detected: { type: "boolean" },
                        gap_description: { type: "string" }
                    }
                }
            });

            const enrichedResults = {
                ...result,
                articles: result.relevant_articles.map(ra => {
                    const article = allArticles.find(a => a.title === ra.article_title);
                    return { ...ra, article };
                }).filter(r => r.article)
            };

            setResults(enrichedResults);

            if (result.knowledge_gap_detected) {
                toast.info('Knowledge gap detected - consider creating a new article');
            }
        } catch (error) {
            console.error('Search failed:', error);
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleArticleClick = async (article) => {
        try {
            await base44.entities.KnowledgeArticle.update(article.id, {
                access_count: (article.access_count || 0) + 1
            });
            if (onArticleSelect) {
                onArticleSelect(article);
            }
        } catch (error) {
            console.error('Failed to update article:', error);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold">AI-Powered Natural Language Search</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                        Ask questions in plain English - AI will understand your intent and find the best answers
                    </p>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., How do I optimize workflow performance?"
                            className="flex-1"
                        />
                        <Button type="submit" disabled={searching || !query.trim()}>
                            {searching ? (
                                <Sparkles className="h-4 w-4 animate-pulse" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {results && (
                <div className="space-y-4">
                    {/* Direct Answer */}
                    <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-green-900">AI Answer</h3>
                                <Badge className={
                                    results.answer_confidence > 0.8 ? 'bg-green-600' :
                                    results.answer_confidence > 0.5 ? 'bg-yellow-600' :
                                    'bg-orange-600'
                                }>
                                    {Math.round(results.answer_confidence * 100)}% confident
                                </Badge>
                            </div>
                            <p className="text-sm text-green-800">{results.direct_answer}</p>
                        </CardContent>
                    </Card>

                    {/* Relevant Articles */}
                    {results.articles?.length > 0 && (
                        <Card>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    Relevant Articles ({results.articles.length})
                                </h3>
                                <ScrollArea className="h-96">
                                    <div className="space-y-3">
                                        {results.articles.map((result, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleArticleClick(result.article)}
                                                className="bg-slate-50 p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-slate-800 flex-1">
                                                        {result.article.title}
                                                    </h4>
                                                    <Badge className="bg-blue-600 flex-shrink-0">
                                                        {Math.round(result.relevance_score * 100)}%
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600 mb-2">
                                                    <strong>Why relevant:</strong> {result.why_relevant}
                                                </p>
                                                <div className="bg-white p-2 rounded mb-2">
                                                    <p className="text-xs text-slate-700 italic">
                                                        "{result.key_excerpt}"
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="text-xs">
                                                        {result.article.category}
                                                    </Badge>
                                                    {result.article.verified && (
                                                        <Badge className="bg-green-600 text-xs">Verified</Badge>
                                                    )}
                                                    <span className="text-xs text-slate-500">
                                                        {result.article.access_count || 0} views • {result.article.helpful_count || 0} helpful
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}

                    {/* Related Topics */}
                    {results.related_topics?.length > 0 && (
                        <Card>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold mb-3 text-slate-800">Related Topics</h3>
                                <div className="flex flex-wrap gap-2">
                                    {results.related_topics.map((topic, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-slate-100"
                                            onClick={() => setQuery(topic)}
                                        >
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Knowledge Gap Warning */}
                    {results.knowledge_gap_detected && (
                        <Card className="border-2 border-orange-200 bg-orange-50">
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-2">
                                    <ExternalLink className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-orange-900 mb-1">Knowledge Gap Detected</h3>
                                        <p className="text-sm text-orange-800">{results.gap_description}</p>
                                        <p className="text-xs text-orange-700 mt-2">
                                            Consider creating a new article to address this topic.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}