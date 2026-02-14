import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, Target, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIModuleGenerator({ agents, skills, onModuleCreated }) {
    const [generating, setGenerating] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const analyzeKnowledgeGaps = async () => {
        setGenerating(true);
        try {
            const skillsByCategory = {};
            skills.forEach(skill => {
                if (!skillsByCategory[skill.skill_category]) {
                    skillsByCategory[skill.skill_category] = [];
                }
                skillsByCategory[skill.skill_category].push({
                    agent: skill.agent_name,
                    skill: skill.skill_name,
                    level: skill.proficiency_level
                });
            });

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze agent skill gaps and generate training module recommendations.

Skills Analysis:
${Object.entries(skillsByCategory).map(([cat, skills]) => `
${cat}:
${skills.map(s => `  - ${s.agent} (${s.skill}): ${s.level}%`).join('\n')}
`).join('\n')}

Identify 3-5 knowledge gaps where:
1. Multiple agents have low proficiency (<60%)
2. Critical skills are missing or underdeveloped
3. High-impact areas for improvement

For each gap, design a comprehensive training module with:
- Learning objectives
- Practical exercises
- Quiz questions
- Expected outcomes`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        knowledge_gaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    gap_title: { type: "string" },
                                    description: { type: "string" },
                                    affected_agents: { 
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    severity: { type: "string" },
                                    recommended_module: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            description: { type: "string" },
                                            skill_category: { type: "string" },
                                            difficulty: { type: "string" },
                                            learning_objectives: {
                                                type: "array",
                                                items: { type: "string" }
                                            },
                                            exercises: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        title: { type: "string" },
                                                        description: { type: "string" },
                                                        type: { type: "string" }
                                                    }
                                                }
                                            },
                                            quiz_questions: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        question: { type: "string" },
                                                        options: {
                                                            type: "array",
                                                            items: { type: "string" }
                                                        },
                                                        correct_answer: { type: "string" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            setAnalysisResult(result);
            toast.success('Knowledge gaps identified!');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze knowledge gaps');
        } finally {
            setGenerating(false);
        }
    };

    const createModule = async (gap) => {
        try {
            const moduleData = {
                name: gap.recommended_module.name,
                description: gap.recommended_module.description,
                skill_category: gap.recommended_module.skill_category,
                difficulty: gap.recommended_module.difficulty,
                learning_objectives: gap.recommended_module.learning_objectives,
                content: {
                    exercises: gap.recommended_module.exercises,
                    quiz: gap.recommended_module.quiz_questions
                },
                target_agents: gap.affected_agents,
                status: 'active'
            };

            await base44.entities.TrainingModule.create(moduleData);
            toast.success('Training module created!');
            onModuleCreated?.();
        } catch (error) {
            console.error('Failed to create module:', error);
            toast.error('Failed to create module');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI Module Generator
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Analyze agent skills and automatically generate targeted training modules for knowledge gaps.
                    </p>
                    <Button 
                        onClick={analyzeKnowledgeGaps}
                        disabled={generating}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analyze & Generate Modules
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {analysisResult && (
                <div className="space-y-4">
                    {analysisResult.knowledge_gaps.map((gap, idx) => (
                        <Card key={idx} className="border-l-4 border-l-orange-500">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{gap.gap_title}</CardTitle>
                                        <p className="text-sm text-slate-600 mt-1">{gap.description}</p>
                                    </div>
                                    <Badge variant={gap.severity === 'high' ? 'destructive' : 'secondary'}>
                                        {gap.severity} severity
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                                        Affected Agents
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {gap.affected_agents.map((agent, i) => (
                                            <Badge key={i} variant="outline">{agent}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{gap.recommended_module.name}</h4>
                                            <p className="text-sm text-slate-600">{gap.recommended_module.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-slate-50 p-3 rounded">
                                            <p className="text-xs text-slate-500">Difficulty</p>
                                            <p className="font-semibold capitalize">{gap.recommended_module.difficulty}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded">
                                            <p className="text-xs text-slate-500">Exercises</p>
                                            <p className="font-semibold">{gap.recommended_module.exercises?.length || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded">
                                            <p className="text-xs text-slate-500">Quiz Questions</p>
                                            <p className="font-semibold">{gap.recommended_module.quiz_questions?.length || 0}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-700 uppercase mb-1">
                                                Learning Objectives
                                            </p>
                                            <ul className="space-y-1">
                                                {gap.recommended_module.learning_objectives?.map((obj, i) => (
                                                    <li key={i} className="text-sm flex items-start gap-2">
                                                        <Target className="h-3 w-3 text-purple-600 mt-1 flex-shrink-0" />
                                                        {obj}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => createModule(gap)}
                                        className="w-full mt-4"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Create This Module
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