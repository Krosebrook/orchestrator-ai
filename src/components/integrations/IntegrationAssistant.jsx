import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationAssistant({ context }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize with context-aware greeting
        if (context) {
            const greeting = generateContextualGreeting(context);
            setMessages([{
                role: 'assistant',
                content: greeting,
                suggestions: generateInitialSuggestions(context)
            }]);
        }
    }, [context]);

    const generateContextualGreeting = (ctx) => {
        if (ctx.mode === 'setup') {
            return `👋 I'm here to help you set up **${ctx.integrationName}**! I can guide you through authentication, parameter mapping, and testing.`;
        } else if (ctx.mode === 'troubleshoot' && ctx.error) {
            return `🔍 I've detected an issue with **${ctx.integrationName}**. Let me help you troubleshoot: "${ctx.error}"`;
        } else if (ctx.mode === 'mapping') {
            return `🎯 Let's map your data fields for **${ctx.integrationName}**. I'll suggest the best mappings based on common patterns.`;
        }
        return `👋 Hi! I'm your Integration Assistant. How can I help you today?`;
    };

    const generateInitialSuggestions = (ctx) => {
        const suggestions = [];
        
        if (ctx.mode === 'setup') {
            suggestions.push(
                { text: 'How do I authenticate?', type: 'auth' },
                { text: 'What fields are required?', type: 'fields' },
                { text: 'Show me an example', type: 'example' }
            );
        } else if (ctx.mode === 'troubleshoot') {
            suggestions.push(
                { text: 'Why is authentication failing?', type: 'auth_error' },
                { text: 'Check API rate limits', type: 'rate_limit' },
                { text: 'Verify credentials', type: 'credentials' }
            );
        } else if (ctx.mode === 'mapping') {
            suggestions.push(
                { text: 'Suggest mappings for contacts', type: 'contact_mapping' },
                { text: 'How to handle date formats?', type: 'date_format' },
                { text: 'Transform field values', type: 'transform' }
            );
        }
        
        return suggestions;
    };

    const handleSuggestionClick = async (suggestion) => {
        const response = await generateResponse(suggestion.text, suggestion.type);
        setMessages([...messages, 
            { role: 'user', content: suggestion.text },
            { role: 'assistant', content: response.content, suggestions: response.suggestions }
        ]);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setLoading(true);

        try {
            const response = await generateResponse(userMessage);
            setMessages([...messages, 
                { role: 'user', content: userMessage },
                { role: 'assistant', content: response.content, suggestions: response.suggestions }
            ]);
        } catch (error) {
            toast.error('Failed to get response');
        } finally {
            setLoading(false);
        }
    };

    const generateResponse = async (query, type = null) => {
        // Simulate AI response - in production, this would call base44.integrations.Core.InvokeLLM
        await new Promise(resolve => setTimeout(resolve, 1000));

        const responses = {
            'auth': {
                content: `To authenticate with **${context?.integrationName || 'this service'}**:\n\n1. **OAuth 2.0 Flow** (Recommended)\n   - Click "Connect" to start OAuth authorization\n   - You'll be redirected to authorize access\n   - Tokens are automatically managed\n\n2. **API Key** (Alternative)\n   - Go to your ${context?.integrationName} dashboard\n   - Generate a new API key\n   - Paste it in the connection dialog\n\n✅ OAuth is more secure and handles token refresh automatically.`,
                suggestions: [
                    { text: 'Start OAuth setup', type: 'oauth_start' },
                    { text: 'Use API key instead', type: 'api_key' }
                ]
            },
            'fields': {
                content: `**Required fields for ${context?.integrationName}:**\n\n• **email** (string) - Contact email address\n• **name** (string) - Full name or company name\n\n**Optional but recommended:**\n• phone - Phone number\n• company - Company name\n• tags - Array of tags\n\n💡 You can use Smart Mapping to auto-suggest field mappings!`,
                suggestions: [
                    { text: 'Show mapping example', type: 'mapping_example' },
                    { text: 'Use Smart Mapping', type: 'smart_mapping' }
                ]
            },
            'auth_error': {
                content: `**Authentication Error Troubleshooting:**\n\n🔍 **Common causes:**\n1. Expired OAuth token → Refresh token\n2. Invalid API key → Regenerate in provider dashboard\n3. Incorrect scopes → Add required permissions\n4. Rate limit exceeded → Wait and retry\n\n✅ **Quick fix:** Try refreshing your OAuth token first.`,
                suggestions: [
                    { text: 'Refresh token now', type: 'refresh_token' },
                    { text: 'Check required scopes', type: 'check_scopes' }
                ]
            },
            'contact_mapping': {
                content: `**AI-Suggested Contact Mappings:**\n\n✨ Based on analysis of 1,000+ integrations:\n\n• \`email\` → \`contact.email\` (95% confidence)\n• \`full_name\` → \`contact.name\` (92% confidence)\n• \`phone_number\` → \`contact.phone\` (transform: formatPhone)\n• \`company_name\` → \`contact.company\` (88% confidence)\n\n🎯 These mappings match industry best practices!`,
                suggestions: [
                    { text: 'Apply all suggestions', type: 'apply_mappings' },
                    { text: 'Customize mapping', type: 'custom_mapping' }
                ]
            },
            'rate_limit': {
                content: `**Rate Limit Analysis:**\n\n📊 Current usage:\n• API calls today: 850 / 1,000\n• Remaining: 150 calls\n• Reset time: ~2 hours\n\n⚠️ **Recommendation:** Implement exponential backoff or batch your requests.\n\n💡 Consider upgrading to a higher tier for increased limits.`,
                suggestions: [
                    { text: 'Enable auto-retry', type: 'auto_retry' },
                    { text: 'View usage patterns', type: 'usage_patterns' }
                ]
            }
        };

        return responses[type] || {
            content: `I understand you're asking about: "${query}"\n\nLet me help you with that. Could you provide more details about:\n• What integration you're working with\n• What specific issue you're facing\n• What you've already tried`,
            suggestions: [
                { text: 'Setup new integration', type: 'auth' },
                { text: 'Troubleshoot error', type: 'auth_error' }
            ]
        };
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    Integration Assistant
                    <Badge className="ml-auto bg-gradient-to-r from-purple-600 to-blue-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI-Powered
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                                <Bot className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-xs text-slate-500">Assistant</span>
                                        </div>
                                    )}
                                    <div className={`rounded-lg p-3 ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-slate-100 text-slate-800'
                                    }`}>
                                        <div className="text-sm whitespace-pre-wrap">
                                            {msg.content.split('\n').map((line, i) => (
                                                <p key={i} className={line.startsWith('•') || line.startsWith('✅') || line.startsWith('💡') || line.startsWith('⚠️') || line.startsWith('🔍') || line.startsWith('✨') || line.startsWith('📊') || line.startsWith('🎯') ? 'ml-2' : ''}>
                                                    {line.split('**').map((part, j) => 
                                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                    )}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.suggestions.map((suggestion, sidx) => (
                                                <Button
                                                    key={sidx}
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="text-xs"
                                                >
                                                    {suggestion.text}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="border-t p-4">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask me anything about integrations..."
                            disabled={loading}
                        />
                        <Button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}