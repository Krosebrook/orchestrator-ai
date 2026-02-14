import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle, MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveInsightSharing({ agents }) {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newInsight, setNewInsight] = useState({
        shared_by: '',
        insight_type: 'knowledge',
        title: '',
        content: '',
        relevant_agents: [],
        priority: 'medium'
    });

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            const data = await base44.entities.CollaborationInsight.list('-created_date', 50);
            setInsights(data || []);
        } catch (error) {
            console.error('Failed to load insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const shareInsight = async () => {
        if (!newInsight.shared_by || !newInsight.title || !newInsight.content) {
            toast.error('Fill in all required fields');
            return;
        }

        try {
            await base44.entities.CollaborationInsight.create(newInsight);
            toast.success('Insight shared!');
            setDialogOpen(false);
            setNewInsight({
                shared_by: '',
                insight_type: 'knowledge',
                title: '',
                content: '',
                relevant_agents: [],
                priority: 'medium'
            });
            await loadInsights();
        } catch (error) {
            console.error('Failed to share insight:', error);
            toast.error('Failed to share insight');
        }
    };

    const respondToInsight = async (insightId, response) => {
        try {
            const insight = insights.find(i => i.id === insightId);
            const responses = insight.responses || [];
            responses.push({
                agent: 'Current User', // In real scenario, get from auth
                response,
                timestamp: new Date().toISOString()
            });

            await base44.entities.CollaborationInsight.update(insightId, { responses });
            toast.success('Response added');
            await loadInsights();
        } catch (error) {
            console.error('Failed to respond:', error);
            toast.error('Failed to add response');
        }
    };

    const rateInsight = async (insightId, rating) => {
        try {
            await base44.entities.CollaborationInsight.update(insightId, { usefulness_rating: rating });
            toast.success('Rating recorded');
            await loadInsights();
        } catch (error) {
            console.error('Failed to rate:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'warning': return AlertTriangle;
            case 'opportunity': return TrendingUp;
            case 'best_practice': return CheckCircle;
            case 'request_help': return MessageSquare;
            default: return Lightbulb;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'warning': return 'bg-amber-100 text-amber-700';
            case 'opportunity': return 'bg-green-100 text-green-700';
            case 'best_practice': return 'bg-blue-100 text-blue-700';
            case 'request_help': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const activeInsights = insights.filter(i => i.status === 'active');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-600" />
                                Proactive Insight Sharing
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                Share knowledge and request help from team members
                            </p>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-yellow-600">
                                    <Lightbulb className="h-4 w-4 mr-2" />
                                    Share Insight
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Share New Insight</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <Label>Your Agent</Label>
                                        <Select
                                            value={newInsight.shared_by}
                                            onValueChange={(v) => setNewInsight(prev => ({ ...prev, shared_by: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {agents.map(agent => (
                                                    <SelectItem key={agent.name} value={agent.name}>
                                                        {agent.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Type</Label>
                                        <Select
                                            value={newInsight.insight_type}
                                            onValueChange={(v) => setNewInsight(prev => ({ ...prev, insight_type: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="knowledge">Knowledge</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="opportunity">Opportunity</SelectItem>
                                                <SelectItem value="best_practice">Best Practice</SelectItem>
                                                <SelectItem value="request_help">Request Help</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Title</Label>
                                        <Input
                                            value={newInsight.title}
                                            onChange={(e) => setNewInsight(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Brief title"
                                        />
                                    </div>
                                    <div>
                                        <Label>Content</Label>
                                        <Textarea
                                            value={newInsight.content}
                                            onChange={(e) => setNewInsight(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="Detailed insight..."
                                            rows={4}
                                        />
                                    </div>
                                    <div>
                                        <Label>Priority</Label>
                                        <Select
                                            value={newInsight.priority}
                                            onValueChange={(v) => setNewInsight(prev => ({ ...prev, priority: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={shareInsight} className="w-full">
                                        Share Insight
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            {activeInsights.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Lightbulb className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No insights shared yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {activeInsights.map((insight) => {
                        const Icon = getTypeIcon(insight.insight_type);
                        return (
                            <Card key={insight.id} className="border-2">
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`p-2 rounded-lg ${getTypeColor(insight.insight_type)}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold">{insight.title}</h4>
                                                        <Badge className={getPriorityColor(insight.priority)}>
                                                            {insight.priority}
                                                        </Badge>
                                                        <Badge variant="outline">{insight.insight_type.replace('_', ' ')}</Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">by {insight.shared_by}</p>
                                                    <p className="text-sm text-slate-700">{insight.content}</p>
                                                </div>
                                            </div>
                                            {insight.usefulness_rating ? (
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                    <span className="text-sm font-semibold">{insight.usefulness_rating}</span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(rating => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => rateInsight(insight.id, rating)}
                                                            className="hover:scale-110 transition-transform"
                                                        >
                                                            <Star className="h-4 w-4 text-slate-300 hover:text-yellow-500" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {insight.responses && insight.responses.length > 0 && (
                                            <div className="bg-slate-50 rounded p-3">
                                                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                                                    Responses ({insight.responses.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {insight.responses.map((resp, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <span className="font-medium">{resp.agent}:</span>{' '}
                                                            <span className="text-slate-600">{resp.response}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add your response..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.target.value) {
                                                        respondToInsight(insight.id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}