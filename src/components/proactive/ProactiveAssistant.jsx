import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, AlertTriangle, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveAssistant() {
    const [suggestions, setSuggestions] = useState([]);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [suggestionsData, alertsData] = await Promise.all([
                base44.entities.AgentSuggestion.filter({ status: 'pending' }),
                base44.entities.AgentAlert.filter({ status: 'open' })
            ]);
            setSuggestions(suggestionsData || []);
            setAlerts(alertsData || []);
        } catch (error) {
            console.error('Failed to load proactive data:', error);
        }
    };

    const handleAcceptSuggestion = async (suggestion) => {
        try {
            await base44.entities.AgentSuggestion.update(suggestion.id, { 
                status: 'accepted',
                applied_result: 'Accepted by user'
            });
            toast.success('Suggestion accepted');
            loadData();
        } catch (error) {
            toast.error('Failed to accept suggestion');
        }
    };

    const handleRejectSuggestion = async (suggestion) => {
        try {
            await base44.entities.AgentSuggestion.update(suggestion.id, { status: 'rejected' });
            toast.success('Suggestion rejected');
            loadData();
        } catch (error) {
            toast.error('Failed to reject suggestion');
        }
    };

    const handleAcknowledgeAlert = async (alert) => {
        try {
            await base44.entities.AgentAlert.update(alert.id, { status: 'acknowledged' });
            toast.success('Alert acknowledged');
            loadData();
        } catch (error) {
            toast.error('Failed to acknowledge alert');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suggestions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        AI Suggestions ({suggestions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {suggestions.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    No pending suggestions
                                </p>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <Card key={suggestion.id} className="border-2 border-yellow-200">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{suggestion.title}</p>
                                                    <p className="text-xs text-slate-500">{suggestion.agent_name}</p>
                                                </div>
                                                <Badge variant="outline">
                                                    {(suggestion.confidence_score * 100).toFixed(0)}% confident
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{suggestion.description}</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAcceptSuggestion(suggestion)}
                                                    className="flex-1"
                                                >
                                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRejectSuggestion(suggestion)}
                                                    className="flex-1"
                                                >
                                                    <ThumbsDown className="h-3 w-3 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Critical Alerts ({alerts.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {alerts.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    No active alerts
                                </p>
                            ) : (
                                alerts.map((alert) => (
                                    <Card key={alert.id} className={`border-2 ${getSeverityColor(alert.severity)}`}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{alert.title}</p>
                                                    <p className="text-xs text-slate-500">{alert.agent_name}</p>
                                                </div>
                                                <Badge className={getSeverityColor(alert.severity)}>
                                                    {alert.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{alert.message}</p>
                                            {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold mb-1">Recommended Actions:</p>
                                                    <ul className="text-xs text-slate-600 space-y-1">
                                                        {alert.recommended_actions.map((action, idx) => (
                                                            <li key={idx}>• {action}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <Button
                                                size="sm"
                                                onClick={() => handleAcknowledgeAlert(alert)}
                                                className="w-full"
                                            >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Acknowledge
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}