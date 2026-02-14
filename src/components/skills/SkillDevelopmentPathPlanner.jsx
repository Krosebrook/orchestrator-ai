import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Target, Play, Pause, CheckCircle2, Clock, Award, BookOpen, Database, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function SkillDevelopmentPathPlanner({ agents, skills, trainingModules, trainingDatasets }) {
    const [selectedAgent, setSelectedAgent] = useState('');
    const [developmentPaths, setDevelopmentPaths] = useState([]);
    const [agentProgress, setAgentProgress] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (selectedAgent) {
            loadAgentPaths();
        }
    }, [selectedAgent]);

    const loadAgentPaths = async () => {
        setLoading(true);
        try {
            const [paths, progress] = await Promise.all([
                base44.entities.SkillDevelopmentPath.filter({ agent_name: selectedAgent }, '-created_date'),
                base44.entities.AgentTrainingProgress.filter({ agent_name: selectedAgent }, '-created_date')
            ]);
            setDevelopmentPaths(paths || []);
            setAgentProgress(progress || []);
        } catch (error) {
            console.error('Failed to load paths:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateDevelopmentPaths = async () => {
        if (!selectedAgent) {
            toast.error('Select an agent first');
            return;
        }

        setGenerating(true);
        try {
            const agentSkills = skills.filter(s => s.agent_name === selectedAgent);
            const agentProgressData = agentProgress.filter(p => p.agent_name === selectedAgent);

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this agent's skills and training progress, then create personalized development paths:

Agent: ${selectedAgent}

Current Skills:
${JSON.stringify(agentSkills.map(s => ({
    skill: s.skill_name,
    category: s.skill_category,
    proficiency: s.proficiency_level,
    certification: s.certification_level
})), null, 2)}

Training Progress:
${JSON.stringify(agentProgressData.map(p => ({
    skill: p.skill_category,
    baseline: p.baseline_score,
    current: p.current_score,
    improvement_rate: p.improvement_rate
})), null, 2)}

For each skill that has room for improvement (proficiency < 90), create a development path with:
1. Current and target levels
2. Estimated duration
3. 3-5 progressive milestones
4. Recommended training approach
5. Weekly goals for the first 4 weeks
6. Practice scenarios

Focus on:
- Skills with low proficiency that are important
- Skills showing positive training trends
- Complementary skills that would increase the agent's versatility`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        paths: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    target_skill: { type: "string" },
                                    skill_category: { type: "string" },
                                    current_level: { type: "number" },
                                    target_level: { type: "number" },
                                    current_certification: { type: "string" },
                                    target_certification: { type: "string" },
                                    estimated_duration: { type: "string" },
                                    milestones: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                description: { type: "string" },
                                                target_proficiency: { type: "number" },
                                                completed: { type: "boolean" }
                                            }
                                        }
                                    },
                                    practice_scenarios: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    weekly_goals: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                week: { type: "number" },
                                                goal: { type: "string" },
                                                achieved: { type: "boolean" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Create development paths
            for (const path of response.paths) {
                // Match with recommended modules and datasets
                const matchedModules = trainingModules
                    .filter(m => m.skill_category === path.skill_category)
                    .slice(0, 3)
                    .map(m => ({
                        module_id: m.id,
                        module_name: m.name,
                        priority: 'high',
                        completed: false
                    }));

                const matchedDatasets = trainingDatasets
                    .filter(d => d.skill_category === path.skill_category)
                    .slice(0, 2)
                    .map(d => ({
                        dataset_id: d.id,
                        dataset_name: d.name,
                        priority: 'high',
                        used: false
                    }));

                await base44.entities.SkillDevelopmentPath.create({
                    agent_name: selectedAgent,
                    ...path,
                    status: 'not_started',
                    progress_percentage: 0,
                    recommended_modules: matchedModules,
                    recommended_datasets: matchedDatasets
                });
            }

            toast.success(`Generated ${response.paths.length} development paths`);
            await loadAgentPaths();
        } catch (error) {
            console.error('Failed to generate paths:', error);
            toast.error('Failed to generate development paths');
        } finally {
            setGenerating(false);
        }
    };

    const updatePathStatus = async (pathId, status) => {
        try {
            const updates = { status };
            if (status === 'in_progress' && !developmentPaths.find(p => p.id === pathId).started_at) {
                updates.started_at = new Date().toISOString();
            }
            if (status === 'completed') {
                updates.completed_at = new Date().toISOString();
                updates.progress_percentage = 100;
            }
            await base44.entities.SkillDevelopmentPath.update(pathId, updates);
            toast.success('Status updated');
            await loadAgentPaths();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
        }
    };

    const completeMilestone = async (pathId, milestoneIndex) => {
        try {
            const path = developmentPaths.find(p => p.id === pathId);
            const updatedMilestones = [...path.milestones];
            updatedMilestones[milestoneIndex] = {
                ...updatedMilestones[milestoneIndex],
                completed: true,
                completed_at: new Date().toISOString()
            };

            const completedCount = updatedMilestones.filter(m => m.completed).length;
            const progress = Math.round((completedCount / updatedMilestones.length) * 100);

            await base44.entities.SkillDevelopmentPath.update(pathId, {
                milestones: updatedMilestones,
                progress_percentage: progress
            });

            toast.success('Milestone completed!');
            await loadAgentPaths();
        } catch (error) {
            console.error('Failed to complete milestone:', error);
            toast.error('Failed to update milestone');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'paused': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getCertificationColor = (cert) => {
        switch (cert) {
            case 'expert': return 'text-purple-600';
            case 'advanced': return 'text-blue-600';
            case 'intermediate': return 'text-green-600';
            default: return 'text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Agent Selection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Skill Development Paths</CardTitle>
                        <div className="flex items-center gap-3">
                            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                <SelectTrigger className="w-64">
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
                            <Button
                                onClick={generateDevelopmentPaths}
                                disabled={!selectedAgent || generating}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {generating ? 'Generating...' : 'Generate Paths'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {selectedAgent && !loading && (
                <>
                    {developmentPaths.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 mb-4">No development paths yet for {selectedAgent}</p>
                                <Button
                                    onClick={generateDevelopmentPaths}
                                    disabled={generating}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Personalized Paths
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {developmentPaths.map((path) => (
                                <Card key={path.id} className="border-2">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target className="h-5 w-5 text-purple-600" />
                                                    <CardTitle className="text-lg">{path.target_skill}</CardTitle>
                                                </div>
                                                <Badge className="text-xs">{path.skill_category}</Badge>
                                                <Badge className={`ml-2 ${getStatusColor(path.status)}`}>
                                                    {path.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Progress Overview */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-slate-600">Overall Progress</span>
                                                <span className="font-semibold">{path.progress_percentage}%</span>
                                            </div>
                                            <Progress value={path.progress_percentage} className="h-2" />
                                        </div>

                                        {/* Level Progress */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-1">Current</p>
                                                <Badge variant="outline" className={getCertificationColor(path.current_certification)}>
                                                    {path.current_level}% · {path.current_certification}
                                                </Badge>
                                            </div>
                                            <TrendingUp className="h-4 w-4 text-purple-600" />
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-1">Target</p>
                                                <Badge variant="outline" className={getCertificationColor(path.target_certification)}>
                                                    {path.target_level}% · {path.target_certification}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock className="h-4 w-4" />
                                            <span>Est. Duration: {path.estimated_duration}</span>
                                        </div>

                                        {/* Milestones */}
                                        {path.milestones && path.milestones.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                                                    Milestones
                                                </p>
                                                <div className="space-y-2">
                                                    {path.milestones.map((milestone, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-start gap-2 p-2 rounded border ${
                                                                milestone.completed
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : 'bg-slate-50 border-slate-200'
                                                            }`}
                                                        >
                                                            {milestone.completed ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                            ) : (
                                                                <button
                                                                    onClick={() => completeMilestone(path.id, idx)}
                                                                    className="h-4 w-4 rounded-full border-2 border-slate-300 hover:border-green-500 transition-colors mt-0.5"
                                                                />
                                                            )}
                                                            <div className="flex-1 text-xs">
                                                                <p className="font-medium text-slate-800">{milestone.title}</p>
                                                                <p className="text-slate-600 text-xs">{milestone.description}</p>
                                                                <p className="text-slate-500 mt-1">Target: {milestone.target_proficiency}%</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Weekly Goals */}
                                        {path.weekly_goals && path.weekly_goals.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                                                    Next 4 Weeks
                                                </p>
                                                <div className="space-y-1">
                                                    {path.weekly_goals.slice(0, 4).map((goal, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                                            <span className="font-semibold w-12">Week {goal.week}:</span>
                                                            <span className="flex-1">{goal.goal}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Recommendations */}
                                        <div className="space-y-2">
                                            {path.recommended_modules && path.recommended_modules.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center gap-1">
                                                        <BookOpen className="h-3 w-3" />
                                                        Recommended Modules
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {path.recommended_modules.slice(0, 3).map((mod, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {mod.module_name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {path.recommended_datasets && path.recommended_datasets.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center gap-1">
                                                        <Database className="h-3 w-3" />
                                                        Recommended Datasets
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {path.recommended_datasets.slice(0, 2).map((ds, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {ds.dataset_name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {path.practice_scenarios && path.practice_scenarios.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center gap-1">
                                                        <Lightbulb className="h-3 w-3" />
                                                        Practice Scenarios
                                                    </p>
                                                    <ul className="text-xs text-slate-600 space-y-1">
                                                        {path.practice_scenarios.slice(0, 3).map((scenario, idx) => (
                                                            <li key={idx}>• {scenario}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            {path.status === 'not_started' && (
                                                <Button
                                                    onClick={() => updatePathStatus(path.id, 'in_progress')}
                                                    className="flex-1"
                                                    size="sm"
                                                >
                                                    <Play className="h-3 w-3 mr-1" />
                                                    Start Path
                                                </Button>
                                            )}
                                            {path.status === 'in_progress' && (
                                                <>
                                                    <Button
                                                        onClick={() => updatePathStatus(path.id, 'paused')}
                                                        variant="outline"
                                                        className="flex-1"
                                                        size="sm"
                                                    >
                                                        <Pause className="h-3 w-3 mr-1" />
                                                        Pause
                                                    </Button>
                                                    {path.progress_percentage === 100 && (
                                                        <Button
                                                            onClick={() => updatePathStatus(path.id, 'completed')}
                                                            className="flex-1 bg-green-600"
                                                            size="sm"
                                                        >
                                                            <Award className="h-3 w-3 mr-1" />
                                                            Complete
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {path.status === 'paused' && (
                                                <Button
                                                    onClick={() => updatePathStatus(path.id, 'in_progress')}
                                                    className="flex-1"
                                                    size="sm"
                                                >
                                                    <Play className="h-3 w-3 mr-1" />
                                                    Resume
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {loading && (
                <div className="text-center py-12">
                    <Target className="h-12 w-12 text-purple-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-slate-600">Loading development paths...</p>
                </div>
            )}
        </div>
    );
}