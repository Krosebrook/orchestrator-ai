import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AIScenarioGenerator({ skills, onScenarioCreated }) {
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [complexity, setComplexity] = useState('intermediate');
    const [generating, setGenerating] = useState(false);
    const [scenarios, setScenarios] = useState([]);

    const generateScenarios = async () => {
        if (!selectedSkill) return;

        setGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate 5 realistic simulation scenarios for training the skill: ${selectedSkill.skill_name}

Skill Context:
- Category: ${selectedSkill.skill_category}
- Current Level: ${selectedSkill.proficiency_level}%
- Complexity Required: ${complexity}

Create diverse scenarios that:
1. Reflect real-world situations agents would encounter
2. Test different aspects of the skill
3. Have clear success/failure criteria
4. Include contextual details and constraints
5. Scale appropriately for ${complexity} level

For each scenario provide:
- Engaging scenario title
- Detailed situation description
- Expected agent behaviors/actions
- Success criteria (what constitutes good performance)
- Common pitfalls to avoid
- Estimated completion time`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        scenarios: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    complexity: { type: "string" },
                                    expected_behaviors: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    success_criteria: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    common_pitfalls: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    estimated_minutes: { type: "number" },
                                    scoring_rubric: {
                                        type: "object",
                                        properties: {
                                            excellent: { type: "string" },
                                            good: { type: "string" },
                                            needs_improvement: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            setScenarios(result.scenarios);
            toast.success(`${result.scenarios.length} scenarios generated!`);
        } catch (error) {
            console.error('Failed to generate scenarios:', error);
            toast.error('Failed to generate scenarios');
        } finally {
            setGenerating(false);
        }
    };

    const saveScenario = async (scenario) => {
        try {
            await base44.entities.TrainingModule.create({
                name: scenario.title,
                description: scenario.description,
                skill_category: selectedSkill.skill_category,
                difficulty: scenario.complexity,
                content: {
                    scenario_details: scenario,
                    type: 'simulation'
                },
                learning_objectives: scenario.expected_behaviors,
                status: 'active'
            });

            toast.success('Scenario saved as training module!');
            onScenarioCreated?.();
        } catch (error) {
            console.error('Failed to save scenario:', error);
            toast.error('Failed to save scenario');
        }
    };

    const uniqueSkills = Array.from(
        new Map(skills.map(s => [`${s.skill_name}-${s.skill_category}`, s])).values()
    );

    return (
        <div className="space-y-6">
            <Card className="border-2 border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-600" />
                        AI Scenario Generator
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Skill</label>
                            <Select value={selectedSkill?.id} onValueChange={(id) => {
                                const skill = skills.find(s => s.id === id);
                                setSelectedSkill(skill);
                                setScenarios([]);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select skill" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueSkills.map(skill => (
                                        <SelectItem key={skill.id} value={skill.id}>
                                            {skill.skill_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Complexity</label>
                            <Select value={complexity} onValueChange={setComplexity}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button 
                        onClick={generateScenarios}
                        disabled={!selectedSkill || generating}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Scenarios...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Realistic Scenarios
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                {scenarios.map((scenario, idx) => (
                    <Card key={idx} className="border-2 hover:shadow-lg transition-all">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                                    <div className="flex gap-2 mt-2">
                                        <Badge>{scenario.complexity}</Badge>
                                        <Badge variant="outline">{scenario.estimated_minutes} min</Badge>
                                    </div>
                                </div>
                                <Button onClick={() => saveScenario(scenario)} size="sm">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-700">{scenario.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-xs font-semibold text-green-800 uppercase mb-2">
                                        Expected Behaviors
                                    </p>
                                    <ul className="space-y-1">
                                        {scenario.expected_behaviors.map((behavior, i) => (
                                            <li key={i} className="text-sm text-green-700">• {behavior}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-800 uppercase mb-2">
                                        Success Criteria
                                    </p>
                                    <ul className="space-y-1">
                                        {scenario.success_criteria.map((criteria, i) => (
                                            <li key={i} className="text-sm text-blue-700">• {criteria}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-3 rounded-lg">
                                <p className="text-xs font-semibold text-amber-800 uppercase mb-2">
                                    Common Pitfalls to Avoid
                                </p>
                                <ul className="space-y-1">
                                    {scenario.common_pitfalls.map((pitfall, i) => (
                                        <li key={i} className="text-sm text-amber-700">• {pitfall}</li>
                                    ))}
                                </ul>
                            </div>

                            {scenario.scoring_rubric && (
                                <div className="border-t pt-3">
                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                                        Scoring Rubric
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded">
                                            <p className="text-xs font-semibold text-green-800">Excellent</p>
                                            <p className="text-xs text-green-700 mt-1">{scenario.scoring_rubric.excellent}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded">
                                            <p className="text-xs font-semibold text-blue-800">Good</p>
                                            <p className="text-xs text-blue-700 mt-1">{scenario.scoring_rubric.good}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded">
                                            <p className="text-xs font-semibold text-amber-800">Needs Improvement</p>
                                            <p className="text-xs text-amber-700 mt-1">{scenario.scoring_rubric.needs_improvement}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}