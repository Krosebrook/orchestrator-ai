import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, TrendingUp, BookOpen, Play, CheckCircle, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function PersonalizedLearningPath({ agent, onModuleSelect }) {
    const [learningPath, setLearningPath] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState([]);

    useEffect(() => {
        if (agent) {
            loadLearningPath();
        }
    }, [agent]);

    const loadLearningPath = async () => {
        try {
            const [skills, devPaths, progressData] = await Promise.all([
                base44.entities.AgentSkill.filter({ agent_name: agent.name }),
                base44.entities.SkillDevelopmentPath.filter({ agent_name: agent.name }),
                base44.entities.AgentTrainingProgress.filter({ agent_name: agent.name })
            ]);

            setProgress(progressData || []);

            if (devPaths.length === 0) {
                return;
            }

            // Calculate overall learning path
            const pathData = {
                agent_name: agent.name,
                skills,
                development_paths: devPaths,
                current_progress: progressData
            };
            
            setLearningPath(pathData);
        } catch (error) {
            console.error('Failed to load learning path:', error);
        }
    };

    const generatePersonalizedPath = async () => {
        setGenerating(true);
        try {
            const [skills, modules, datasets, profile] = await Promise.all([
                base44.entities.AgentSkill.filter({ agent_name: agent.name }),
                base44.entities.TrainingModule.list(),
                base44.entities.TrainingDataset.list(),
                base44.entities.AgentProfile.filter({ agent_name: agent.name }).then(p => p[0])
            ]);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create a personalized learning path for agent: ${agent.name}

Current Skills:
${skills.map(s => `- ${s.skill_name} (${s.skill_category}): ${s.proficiency_level}% - ${s.certification_level}`).join('\n')}

Agent Profile:
${profile ? `
Strengths: ${profile.strengths?.join(', ')}
Weaknesses: ${profile.weaknesses?.join(', ')}
Performance: Success rate ${profile.performance_stats?.success_rate}%
` : 'No profile data'}

Available Training Modules:
${modules.map(m => `- ${m.name} (${m.skill_category}): ${m.description}`).join('\n')}

Create a comprehensive learning path that:
1. Identifies 3-5 key skill gaps to focus on
2. Suggests career development goals (e.g., "Become expert in data analysis")
3. Recommends training modules in priority order
4. Creates milestone checkpoints
5. Estimates time to proficiency for each skill

Focus on high-impact skills that align with the agent's strengths.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        career_goals: {
                            type: "array",
                            items: { type: "string" }
                        },
                        priority_skills: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    category: { type: "string" },
                                    current_level: { type: "number" },
                                    target_level: { type: "number" },
                                    priority: { type: "string" },
                                    rationale: { type: "string" },
                                    estimated_weeks: { type: "number" }
                                }
                            }
                        },
                        recommended_modules: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    module_name: { type: "string" },
                                    order: { type: "number" },
                                    reason: { type: "string" }
                                }
                            }
                        },
                        milestones: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    target_week: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            // Create development paths for each priority skill
            for (const skill of result.priority_skills) {
                const matchedModules = modules
                    .filter(m => m.skill_category === skill.category)
                    .slice(0, 2)
                    .map(m => ({
                        module_id: m.id,
                        module_name: m.name,
                        priority: skill.priority,
                        completed: false
                    }));

                await base44.entities.SkillDevelopmentPath.create({
                    agent_name: agent.name,
                    target_skill: skill.skill,
                    skill_category: skill.category,
                    current_level: skill.current_level,
                    target_level: skill.target_level,
                    current_certification: 'beginner',
                    target_certification: 'advanced',
                    estimated_duration: `${skill.estimated_weeks} weeks`,
                    status: 'not_started',
                    progress_percentage: 0,
                    recommended_modules: matchedModules,
                    notes: skill.rationale
                });
            }

            toast.success('Learning path created!');
            await loadLearningPath();
        } catch (error) {
            console.error('Failed to generate path:', error);
            toast.error('Failed to generate learning path');
        } finally {
            setGenerating(false);
        }
    };

    if (!agent) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Select an agent to view their learning path</p>
                </CardContent>
            </Card>
        );
    }

    if (!learningPath) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Personalized Learning Path
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <Target className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No learning path yet for {agent.name}</p>
                    <Button
                        onClick={generatePersonalizedPath}
                        disabled={generating}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generating ? 'Generating...' : 'Generate AI Learning Path'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const completedPaths = learningPath.development_paths.filter(p => p.status === 'completed').length;
    const totalPaths = learningPath.development_paths.length;
    const overallProgress = totalPaths > 0 ? (completedPaths / totalPaths) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-purple-600" />
                                Learning Path: {agent.name}
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                AI-curated path to expert level
                            </p>
                        </div>
                        <Badge className="bg-purple-600 text-white">
                            {completedPaths} / {totalPaths} Completed
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Overall Progress</span>
                            <span className="font-semibold">{Math.round(overallProgress)}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {learningPath.development_paths.map((path) => {
                    const pathProgress = progress.filter(p => p.skill_category === path.skill_category);
                    const avgProgress = pathProgress.length > 0
                        ? pathProgress.reduce((sum, p) => sum + p.current_score, 0) / pathProgress.length
                        : 0;

                    return (
                        <Card key={path.id} className="border-2 hover:shadow-lg transition-all">
                            <CardContent className="pt-6 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg">{path.target_skill}</h4>
                                        <Badge variant="outline" className="mt-1">{path.skill_category}</Badge>
                                    </div>
                                    {path.status === 'completed' && (
                                        <Award className="h-6 w-6 text-yellow-500" />
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-600">Progress</span>
                                        <span className="font-semibold">{path.progress_percentage}%</span>
                                    </div>
                                    <Progress value={path.progress_percentage} className="h-2" />
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500">Current</p>
                                        <p className="font-semibold">{path.current_level}%</p>
                                    </div>
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                    <div>
                                        <p className="text-xs text-slate-500">Target</p>
                                        <p className="font-semibold">{path.target_level}%</p>
                                    </div>
                                </div>

                                {path.recommended_modules && path.recommended_modules.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            Next Steps
                                        </p>
                                        <div className="space-y-1">
                                            {path.recommended_modules.slice(0, 2).map((mod, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => onModuleSelect?.(mod.module_id)}
                                                    className="w-full text-left p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {mod.completed ? (
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Play className="h-4 w-4 text-blue-600" />
                                                        )}
                                                        <span className="text-sm font-medium">{mod.module_name}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}