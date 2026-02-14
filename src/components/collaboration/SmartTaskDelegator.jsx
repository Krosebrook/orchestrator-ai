import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Target, Users, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartTaskDelegator({ agents, skills }) {
    const [delegations, setDelegations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [taskInput, setTaskInput] = useState('');
    const [finding, setFinding] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        loadDelegations();
    }, []);

    const loadDelegations = async () => {
        try {
            const data = await base44.entities.SmartTaskDelegation.list('-created_date', 50);
            setDelegations(data || []);
        } catch (error) {
            console.error('Failed to load delegations:', error);
        } finally {
            setLoading(false);
        }
    };

    const findBestAgent = async () => {
        if (!taskInput) {
            toast.error('Enter a task description');
            return;
        }

        setFinding(true);
        try {
            // Build agent skill profiles
            const agentProfiles = {};
            skills.forEach(skill => {
                if (!agentProfiles[skill.agent_name]) {
                    agentProfiles[skill.agent_name] = [];
                }
                agentProfiles[skill.agent_name].push({
                    skill: skill.skill_name,
                    category: skill.skill_category,
                    level: skill.proficiency_level,
                    certification: skill.certification_level
                });
            });

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Task: "${taskInput}"

Available agents and their skills:
${JSON.stringify(agentProfiles, null, 2)}

Analyze which agents are best suited for this task. Consider:
1. Required skills for the task
2. Agent proficiency levels
3. Skill certifications
4. Match quality

Return top 3 agent recommendations with match scores and reasoning.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        required_skills: { type: "array", items: { type: "string" } },
                        recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    agent_name: { type: "string" },
                                    match_score: { type: "number" },
                                    reasoning: { type: "string" },
                                    strengths: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            });

            setSuggestions(response.recommendations);
        } catch (error) {
            console.error('Failed to find best agent:', error);
            toast.error('Failed to analyze task');
        } finally {
            setFinding(false);
        }
    };

    const delegateTask = async (recommendation, requiredSkills) => {
        try {
            await base44.entities.SmartTaskDelegation.create({
                parent_task: 'User-initiated',
                delegated_by: 'System',
                delegated_to: recommendation.agent_name,
                delegation_reason: recommendation.reasoning,
                task_description: taskInput,
                required_skills: requiredSkills,
                priority: 'medium',
                status: 'pending',
                match_score: recommendation.match_score
            });

            toast.success(`Task delegated to ${recommendation.agent_name}`);
            setDialogOpen(false);
            setTaskInput('');
            setSuggestions([]);
            await loadDelegations();
        } catch (error) {
            console.error('Failed to delegate:', error);
            toast.error('Delegation failed');
        }
    };

    const updateStatus = async (id, status, result = null) => {
        try {
            const updates = { status };
            if (status === 'completed') {
                updates.completed_at = new Date().toISOString();
                if (result) updates.result = result;
            }
            await base44.entities.SmartTaskDelegation.update(id, updates);
            toast.success('Status updated');
            await loadDelegations();
        } catch (error) {
            console.error('Failed to update:', error);
            toast.error('Update failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'accepted': return 'bg-purple-100 text-purple-700';
            case 'declined': return 'bg-red-100 text-red-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    const pendingDelegations = delegations.filter(d => ['pending', 'accepted', 'in_progress'].includes(d.status));
    const completedDelegations = delegations.filter(d => d.status === 'completed');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                Smart Task Delegator
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                AI-powered task delegation based on agent skills
                            </p>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Delegate Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Smart Task Delegation</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <Label>Task Description</Label>
                                        <Textarea
                                            value={taskInput}
                                            onChange={(e) => setTaskInput(e.target.value)}
                                            placeholder="Describe what needs to be done..."
                                            rows={4}
                                        />
                                    </div>
                                    <Button
                                        onClick={findBestAgent}
                                        disabled={finding || !taskInput}
                                        className="w-full"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        {finding ? 'Analyzing...' : 'Find Best Agent'}
                                    </Button>

                                    {suggestions.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t">
                                            <p className="text-sm font-semibold">Recommended Agents:</p>
                                            {suggestions.map((rec, idx) => (
                                                <Card key={idx}>
                                                    <CardContent className="pt-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-semibold">{rec.agent_name}</p>
                                                                    <Badge className="bg-blue-100 text-blue-700">
                                                                        {rec.match_score}% match
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-slate-600">{rec.reasoning}</p>
                                                            </div>
                                                        </div>
                                                        {rec.strengths && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {rec.strengths.map((strength, i) => (
                                                                    <Badge key={i} variant="outline" className="text-xs">
                                                                        {strength}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <Button
                                                            onClick={() => delegateTask(rec, [])}
                                                            className="w-full mt-3"
                                                            size="sm"
                                                        >
                                                            Delegate to {rec.agent_name}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            {/* Pending Delegations */}
            {pendingDelegations.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Active Delegations</h3>
                    <div className="space-y-3">
                        {pendingDelegations.map((del) => (
                            <Card key={del.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold">{del.delegated_to}</span>
                                                <Badge className={getStatusColor(del.status)}>{del.status}</Badge>
                                                <Badge variant="outline">{del.match_score}% match</Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{del.task_description}</p>
                                            <p className="text-xs text-slate-500">{del.delegation_reason}</p>
                                        </div>
                                    </div>
                                    {del.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => updateStatus(del.id, 'in_progress')}
                                                size="sm"
                                                className="flex-1"
                                            >
                                                <Clock className="h-3 w-3 mr-1" />
                                                Start
                                            </Button>
                                            <Button
                                                onClick={() => updateStatus(del.id, 'declined')}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                            >
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Decline
                                            </Button>
                                        </div>
                                    )}
                                    {del.status === 'in_progress' && (
                                        <Button
                                            onClick={() => updateStatus(del.id, 'completed', { quality_score: 85 })}
                                            size="sm"
                                            className="w-full bg-green-600"
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Mark Complete
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed */}
            {completedDelegations.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Completed</h3>
                    <div className="space-y-2">
                        {completedDelegations.slice(0, 5).map((del) => (
                            <Card key={del.id} className="opacity-75">
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm">{del.delegated_to}</p>
                                            <p className="text-xs text-slate-600">{del.task_description}</p>
                                        </div>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}