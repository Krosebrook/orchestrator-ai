import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MessageCircle, Lightbulb, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function WorkflowAIAssistant({ currentWorkflow, agents, onApplySuggestion }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const askAssistant = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const context = {
                workflow: currentWorkflow,
                agents: agents.map(a => ({ name: a.name, description: a.description })),
                query
            };

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an AI workflow optimization expert helping users configure workflows.

Current Workflow:
${JSON.stringify(currentWorkflow, null, 2)}

Available Agents:
${agents.map(a => `- ${a.name}: ${a.description}`).join('\n')}

User Question: ${query}

Provide helpful suggestions and configuration advice. If you suggest changes, provide:
1. suggestion_type: "add_node", "modify_node", "optimize_flow", "add_connection", or "general_advice"
2. title: Brief description
3. explanation: Why this is beneficial
4. action: Specific actionable steps or config changes (as a structured object)
5. priority: "high", "medium", or "low"

Return up to 3 most relevant suggestions.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    suggestion_type: { type: "string" },
                                    title: { type: "string" },
                                    explanation: { type: "string" },
                                    action: { type: "object" },
                                    priority: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setSuggestions(result.suggestions || []);
            setQuery('');
        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getSuggestionIcon = (type) => {
        switch (type) {
            case 'add_node': return '➕';
            case 'modify_node': return '✏️';
            case 'optimize_flow': return '⚡';
            case 'add_connection': return '🔗';
            default: return '💡';
        }
    };

    if (!isExpanded) {
        return (
            <Button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-6 right-6 h-14 px-6 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg hover:shadow-xl transition-all z-50"
            >
                <Sparkles className="h-5 w-5 mr-2" />
                AI Assistant
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-96 max-h-[600px] shadow-2xl border-2 border-purple-200 z-50">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI Assistant
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsExpanded(false);
                            setSuggestions([]);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
                {/* Query Input */}
                <div className="space-y-2">
                    <Textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask anything about configuring this workflow... e.g., 'How can I add error handling?' or 'Suggest optimizations for speed'"
                        rows={3}
                        disabled={loading}
                    />
                    <Button
                        onClick={askAssistant}
                        disabled={loading || !query.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Thinking...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Ask AI
                            </>
                        )}
                    </Button>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            AI Suggestions
                        </div>
                        {suggestions.map((suggestion, idx) => (
                            <Card key={idx} className={cn("border", getPriorityColor(suggestion.priority))}>
                                <CardContent className="p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{getSuggestionIcon(suggestion.suggestion_type)}</span>
                                                <p className="font-semibold text-sm">{suggestion.title}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs mb-2">
                                                {suggestion.suggestion_type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <Badge className={getPriorityColor(suggestion.priority)}>
                                            {suggestion.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {suggestion.explanation}
                                    </p>
                                    {onApplySuggestion && suggestion.action && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-xs"
                                            onClick={() => onApplySuggestion(suggestion)}
                                        >
                                            Apply Suggestion
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Quick Questions</p>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            'Suggest performance optimizations',
                            'How to add error handling?',
                            'Add conditional logic example',
                            'What agents work best together?'
                        ].map((quickQuery) => (
                            <Button
                                key={quickQuery}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-xs h-auto py-2 text-left"
                                onClick={() => setQuery(quickQuery)}
                            >
                                {quickQuery}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}