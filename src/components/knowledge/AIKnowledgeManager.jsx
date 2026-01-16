import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIKnowledgeManager({ onArticleGenerated }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const analyzeInteractions = async () => {
        setAnalyzing(true);
        try {
            const [collaborations, executions, errors, queries] = await Promise.all([
                base44.entities.AgentCollaborationSession.list('-created_date', 50),
                base44.entities.WorkflowExecution.list('-created_date', 100),
                base44.entities.AgentErrorLog.filter({ resolved: false }, '-created_date', 50),
                base44.entities.KnowledgeQuery.filter({ results_found: false }, '-created_date', 100)
            ]);

            const failedExecutions = executions.filter(e => e.status === 'failed');
            const recurringErrors = errors.reduce((acc, err) => {
                const key = err.error_type;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze agent interactions and identify knowledge gaps:

Collaboration Sessions: ${collaborations.length}
Recent interactions: ${collaborations.slice(0, 5).map(c => 
    `Session: ${c.name}, Interactions: ${c.interactions?.length || 0}`
).join('\n')}

Failed Workflows: ${failedExecutions.length}
Failed examples: ${failedExecutions.slice(0, 5).map(e => 
    `${e.workflow_name}: ${e.error_message || 'unknown error'}`
).join('\n')}

Recurring Errors: ${Object.entries(recurringErrors).map(([type, count]) => 
    `${type}: ${count} occurrences`
).join('\n')}

Unanswered Queries: ${queries.length}
Examples: ${queries.slice(0, 10).map(q => q.query).join('\n')}

Identify:
1. Recurring issues that need documentation
2. Novel problems that were successfully resolved
3. Common questions without good answers
4. Existing knowledge that needs updates

For each, suggest:
- Article title
- Category
- Draft content outline
- Priority (high/medium/low)
- Whether to create new or update existing`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    title: { type: "string" },
                                    category: { type: "string" },
                                    draft_content: { type: "string" },
                                    priority: { type: "string" },
                                    reason: { type: "string" },
                                    based_on: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setSuggestions(result.suggestions || []);
            toast.success(`Found ${result.suggestions?.length || 0} knowledge suggestions`);
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const createArticle = async (suggestion) => {
        try {
            const user = await base44.auth.me().catch(() => ({ email: 'ai-system' }));
            await base44.entities.KnowledgeArticle.create({
                title: suggestion.title,
                content: suggestion.draft_content,
                category: suggestion.category,
                tags: ['ai-generated', 'auto-created'],
                contributed_by: user.email,
                verified: false
            });
            toast.success('Article created');
            setSuggestions(suggestions.filter(s => s !== suggestion));
            onArticleGenerated?.();
        } catch (error) {
            console.error('Failed to create article:', error);
            toast.error('Failed to create article');
        }
    };

    const priorityColors = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-blue-100 text-blue-700'
    };

    return (
        <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-600" />
                                AI Knowledge Manager
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Monitors interactions and auto-generates knowledge articles
                            </p>
                        </div>
                        <Button onClick={analyzeInteractions} disabled={analyzing}>
                            {analyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Analyze Now'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {suggestions.length > 0 && (
                <div className="space-y-3">
                    {suggestions.map((suggestion, idx) => (
                        <Card key={idx} className="border-2">
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            <h3 className="font-semibold">{suggestion.title}</h3>
                                            <Badge className={priorityColors[suggestion.priority]}>
                                                {suggestion.priority}
                                            </Badge>
                                            <Badge variant="outline">{suggestion.category}</Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{suggestion.reason}</p>
                                        <p className="text-xs text-slate-500">Based on: {suggestion.based_on}</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Draft Content:</p>
                                    <p className="text-xs text-blue-700 whitespace-pre-wrap">
                                        {suggestion.draft_content}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => createArticle(suggestion)}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Create Article
                                    </Button>
                                    <Button size="sm" variant="outline" 
                                            onClick={() => setSuggestions(suggestions.filter(s => s !== suggestion))}>
                                        Dismiss
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}