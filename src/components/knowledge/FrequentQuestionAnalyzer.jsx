import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function FrequentQuestionAnalyzer({ onCreateArticle }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [gaps, setGaps] = useState([]);
    const [lastAnalysis, setLastAnalysis] = useState(null);

    useEffect(() => {
        loadLastAnalysis();
    }, []);

    const loadLastAnalysis = async () => {
        try {
            const queries = await base44.entities.KnowledgeQuery.filter(
                { knowledge_gap_identified: true },
                '-created_date',
                1
            );
            if (queries && queries.length > 0) {
                setLastAnalysis(queries[0].created_date);
            }
        } catch (error) {
            console.error('Failed to load last analysis:', error);
        }
    };

    const analyzeFrequentQuestions = async () => {
        setAnalyzing(true);
        try {
            const [queries, articles] = await Promise.all([
                base44.entities.KnowledgeQuery.list('-created_date', 500),
                base44.entities.KnowledgeArticle.list()
            ]);

            // Group queries by similarity
            const queryTexts = queries.map(q => q.query).filter(q => q);
            
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these user queries to identify knowledge gaps:

Recent Queries (${queries.length} total):
${queryTexts.slice(0, 100).map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}

Existing Knowledge Base Articles (${articles.length} total):
${articles.map(a => `- ${a.title} (${a.category}): ${a.content.substring(0, 100)}...`).join('\n')}

Analysis Required:
1. Identify frequently asked questions (patterns, similar queries)
2. Determine which questions have NO adequate articles in the knowledge base
3. Cluster related questions into topics
4. Prioritize gaps based on:
   - Frequency of questions
   - Impact on users (how critical the information is)
   - Absence of existing coverage
5. Suggest specific articles that should be created

For each identified gap, provide:
- Topic/question cluster
- Why it's a gap (what's missing)
- Number of related queries
- Suggested article title and outline
- Priority level`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        identified_gaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                    question_cluster: { type: "array", items: { type: "string" } },
                                    query_count: { type: "number" },
                                    gap_reason: { type: "string" },
                                    suggested_article_title: { type: "string" },
                                    article_outline: { type: "array", items: { type: "string" } },
                                    priority: { type: "string" },
                                    category: { type: "string" },
                                    estimated_impact: { type: "string" }
                                }
                            }
                        },
                        summary: { type: "string" },
                        total_unanswered_queries: { type: "number" }
                    }
                }
            });

            setGaps(result.identified_gaps || []);

            // Mark queries as having gaps identified
            for (const gap of result.identified_gaps || []) {
                for (const question of gap.question_cluster.slice(0, 5)) {
                    const matchingQuery = queries.find(q => q.query?.includes(question.substring(0, 20)));
                    if (matchingQuery) {
                        await base44.entities.KnowledgeQuery.update(matchingQuery.id, {
                            knowledge_gap_identified: true,
                            suggested_article_title: gap.suggested_article_title
                        });
                    }
                }
            }

            toast.success(`Found ${result.identified_gaps?.length || 0} knowledge gaps`);
            setLastAnalysis(new Date().toISOString());
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze questions');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCreateArticle = (gap) => {
        if (onCreateArticle) {
            onCreateArticle({
                title: gap.suggested_article_title,
                category: gap.category,
                content: `# ${gap.suggested_article_title}\n\n## Overview\n\nThis article addresses: ${gap.topic}\n\n## Key Points\n\n${gap.article_outline.map(point => `- ${point}`).join('\n')}\n\n## Details\n\n(Add detailed content here)`,
                tags: gap.question_cluster.slice(0, 3)
            });
        }
    };

    const priorityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                                Frequent Question Analysis
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Automatically identify knowledge gaps from user queries
                            </p>
                            {lastAnalysis && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Last analyzed: {moment(lastAnalysis).fromNow()}
                                </p>
                            )}
                        </div>
                        <Button 
                            onClick={analyzeFrequentQuestions} 
                            disabled={analyzing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Analyze Questions
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {gaps.length > 0 && (
                <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                        {gaps.map((gap, idx) => (
                            <Card key={idx} className="border-2">
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">{gap.topic}</h3>
                                                <Badge className={priorityColors[gap.priority]}>
                                                    {gap.priority} priority
                                                </Badge>
                                                <Badge variant="outline">
                                                    {gap.query_count} questions
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{gap.gap_reason}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded mb-3">
                                        <p className="text-xs font-semibold text-slate-700 mb-1">Suggested Article:</p>
                                        <p className="text-sm font-medium text-slate-800 mb-2">
                                            {gap.suggested_article_title}
                                        </p>
                                        <p className="text-xs text-slate-600 mb-2">
                                            <strong>Outline:</strong>
                                        </p>
                                        <ul className="text-xs text-slate-600 space-y-1">
                                            {gap.article_outline.map((point, i) => (
                                                <li key={i}>• {point}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded mb-3">
                                        <p className="text-xs font-semibold text-blue-900 mb-1">
                                            Common Questions ({gap.question_cluster.length}):
                                        </p>
                                        {gap.question_cluster.slice(0, 5).map((q, i) => (
                                            <p key={i} className="text-xs text-blue-800">• "{q}"</p>
                                        ))}
                                        {gap.question_cluster.length > 5 && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                ...and {gap.question_cluster.length - 5} more
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{gap.category}</Badge>
                                            <span className="text-xs text-slate-600">
                                                Impact: {gap.estimated_impact}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleCreateArticle(gap)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Create Article
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}