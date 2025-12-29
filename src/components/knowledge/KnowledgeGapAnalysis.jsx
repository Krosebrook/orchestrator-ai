import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function KnowledgeGapAnalysis({ queries, articles, onCreateArticle }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [gaps, setGaps] = useState([]);

    const analyzeGaps = async () => {
        setAnalyzing(true);
        try {
            const unsatisfiedQueries = queries.filter(q => !q.results_found || q.satisfaction === 'unsatisfied');

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze knowledge gaps from user queries:

Queries without good results:
${unsatisfiedQueries.slice(0, 20).map(q => `- ${q.query}`).join('\n')}

Existing articles cover:
${articles.map(a => `- ${a.title} (${a.category})`).join('\n')}

Identify:
1. Common themes in unanswered queries
2. Missing knowledge areas
3. Suggested new articles to create
4. Priority level for each gap`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        knowledge_gaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    gap_title: { type: "string" },
                                    description: { type: "string" },
                                    affected_queries_count: { type: "number" },
                                    suggested_article_title: { type: "string" },
                                    suggested_content_outline: { type: "string" },
                                    priority: { type: "string" },
                                    category: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setGaps(result.knowledge_gaps || []);
            toast.success('Analysis completed');
        } catch (error) {
            console.error('Gap analysis failed:', error);
            toast.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const priorityColors = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-blue-100 text-blue-700'
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-600" />
                                AI Knowledge Gap Analysis
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Identify missing knowledge from agent queries
                            </p>
                        </div>
                        <Button onClick={analyzeGaps} disabled={analyzing}>
                            {analyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Analyze'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {gaps.length > 0 && (
                <div className="space-y-3">
                    {gaps.map((gap, idx) => (
                        <Card key={idx}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">{gap.gap_title}</h3>
                                            <Badge className={priorityColors[gap.priority]}>
                                                {gap.priority} priority
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{gap.description}</p>
                                        <p className="text-xs text-slate-500">
                                            Affects {gap.affected_queries_count} queries
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">
                                        Suggested Article: {gap.suggested_article_title}
                                    </p>
                                    <p className="text-xs text-blue-700">{gap.suggested_content_outline}</p>
                                </div>

                                <Button size="sm" onClick={onCreateArticle}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Create Article
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}