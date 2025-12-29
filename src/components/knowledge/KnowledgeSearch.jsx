import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function KnowledgeSearch({ articles, onArticleSelect }) {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setSearching(true);
        try {
            const user = await base44.auth.me().catch(() => ({ email: 'system' }));

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `User query: "${query}"

Available knowledge articles:
${articles.map(a => `- ${a.title}: ${a.content.substring(0, 200)}...`).join('\n')}

Find the most relevant articles and rank them by relevance. Return article titles in order of relevance.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        relevant_articles: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    relevance_reason: { type: "string" }
                                }
                            }
                        },
                        knowledge_gap: { type: "boolean" },
                        suggested_article: { type: "string" }
                    }
                }
            });

            const foundArticles = result.relevant_articles.map(ra => {
                const article = articles.find(a => a.title === ra.title);
                return article ? { ...article, relevance_reason: ra.relevance_reason } : null;
            }).filter(Boolean);

            setResults(foundArticles);

            await base44.entities.KnowledgeQuery.create({
                query,
                queried_by: user.email,
                results_found: foundArticles.length > 0,
                knowledge_gap_identified: result.knowledge_gap,
                suggested_article_title: result.suggested_article
            });

            if (foundArticles.length === 0) {
                toast.info('No results found', {
                    description: result.suggested_article || 'Try different keywords'
                });
            }
        } catch (error) {
            console.error('Search failed:', error);
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                    <div className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ask anything about agents, workflows, or integrations..."
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} disabled={searching}>
                            {searching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {results.length > 0 && (
                <div className="space-y-3">
                    {results.map((article, idx) => (
                        <Card key={article.id} className="cursor-pointer hover:shadow-lg transition-all"
                              onClick={() => onArticleSelect(article)}>
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-blue-600 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">{article.title}</h3>
                                        <p className="text-sm text-slate-600 mb-2">{article.content.substring(0, 200)}...</p>
                                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                            💡 {article.relevance_reason}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}