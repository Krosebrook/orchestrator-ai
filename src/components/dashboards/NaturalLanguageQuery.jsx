import { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, TrendingUp, Calendar, DollarSign, Users, BarChart3, RefreshCw, Target, FileText, AlertCircle, CheckCircle, ShoppingCart, MessageSquare, Zap } from 'lucide-react';
import { toast } from 'sonner';
import MessageBubble from '../agents/MessageBubble';

const ALL_EXAMPLE_QUERIES = [
    { text: "Show me open tickets from this week", icon: TrendingUp, category: "support" },
    { text: "What are the top 5 qualified leads by score?", icon: Users, category: "sales" },
    { text: "List all active campaigns with their budget", icon: DollarSign, category: "marketing" },
    { text: "Show me completed workflows from last month", icon: Calendar, category: "workflows" },
    { text: "What tasks are overdue?", icon: BarChart3, category: "tasks" },
    { text: "How many high-priority tickets are unresolved?", icon: AlertCircle, category: "support" },
    { text: "Show me features in review status", icon: FileText, category: "product" },
    { text: "List all leads created this month", icon: Target, category: "sales" },
    { text: "What's the average satisfaction rating?", icon: CheckCircle, category: "metrics" },
    { text: "Show me campaigns by spending", icon: DollarSign, category: "marketing" },
    { text: "List failed workflow executions", icon: AlertCircle, category: "workflows" },
    { text: "What content is scheduled for this week?", icon: Calendar, category: "content" },
    { text: "Show me employees by department", icon: Users, category: "hr" },
    { text: "What are the top performing metrics?", icon: TrendingUp, category: "metrics" },
    { text: "List all urgent tasks assigned to me", icon: Zap, category: "tasks" },
    { text: "Show me product launches this quarter", icon: ShoppingCart, category: "product" },
    { text: "What's the conversion rate by campaign?", icon: BarChart3, category: "marketing" },
    { text: "List all tickets by priority", icon: MessageSquare, category: "support" }
];

export default function NaturalLanguageQuery({ user }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);

    // Randomly select 5 example queries
    const exampleQueries = useMemo(() => {
        const shuffled = [...ALL_EXAMPLE_QUERIES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5);
    }, [refreshKey]);

    const handleQuery = async (queryText) => {
        if (!queryText.trim() || loading) return;

        setLoading(true);
        setQuery('');

        try {
            // Create or use existing conversation
            let conv = conversation;
            if (!conv) {
                conv = await base44.agents.createConversation({
                    agent_name: 'query_agent',
                    metadata: {
                        name: 'Data Query Session',
                        user_email: user?.email
                    }
                });
                setConversation(conv);

                // Subscribe to updates
                base44.agents.subscribeToConversation(conv.id, (data) => {
                    setMessages(data.messages || []);
                });
            }

            // Send the query
            await base44.agents.addMessage(conv, {
                role: 'user',
                content: queryText
            });

            toast.success('Query submitted');
        } catch (error) {
            console.error('Query failed:', error);
            toast.error('Failed to process query');
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (exampleText) => {
        setQuery(exampleText);
    };

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="pt-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Ask Your Data</h3>
                        <p className="text-sm text-slate-600">Query your data using natural language</p>
                    </div>
                </div>

                {/* Example Queries */}
                {messages.length === 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Example Queries</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRefreshKey(prev => prev + 1)}
                                className="h-6 px-2 text-xs text-slate-500 hover:text-blue-600"
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Refresh
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {exampleQueries.map((example, index) => {
                                const Icon = example.icon;
                                return (
                                    <button
                                        key={`${refreshKey}-${index}`}
                                        onClick={() => handleExampleClick(example.text)}
                                        className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                                    >
                                        <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <span className="text-sm text-slate-700">{example.text}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                    <div className="bg-white rounded-lg border border-slate-200">
                        <ScrollArea className="h-96 p-4">
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <MessageBubble key={index} message={message} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuery(query)}
                        placeholder="Ask anything about your data..."
                        className="flex-1 bg-white"
                        disabled={loading}
                    />
                    <Button
                        onClick={() => handleQuery(query)}
                        disabled={!query.trim() || loading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Tips */}
                <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-semibold">💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Ask specific questions about your data</li>
                        <li>Use time ranges like "last week" or "this month"</li>
                        <li>Request comparisons, trends, or summaries</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}