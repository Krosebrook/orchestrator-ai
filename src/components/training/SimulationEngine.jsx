import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Play, Pause, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function SimulationEngine({ agent, skill }) {
    const [simulation, setSimulation] = useState(null);
    const [running, setRunning] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [score, setScore] = useState(0);
    const [responses, setResponses] = useState([]);

    const generateSimulation = async () => {
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create a training simulation for agent: ${agent.name}
Skill being trained: ${skill.skill_name} (${skill.skill_category})
Current proficiency: ${skill.proficiency_level}%

Generate a 5-step simulation that:
1. Tests practical application of the skill
2. Increases in difficulty
3. Provides realistic scenarios
4. Has clear success/failure criteria

Return scenarios with expected behaviors and scoring rubric.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        simulation_name: { type: "string" },
                        difficulty: { type: "string" },
                        scenarios: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    step: { type: "number" },
                                    scenario: { type: "string" },
                                    expected_behavior: { type: "string" },
                                    points: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            setSimulation(result);
            setCurrentStep(0);
            setScore(0);
            setResponses([]);
        } catch (error) {
            console.error('Failed to generate simulation:', error);
            toast.error('Failed to generate simulation');
        }
    };

    const runStep = async (userResponse) => {
        setRunning(true);
        try {
            const scenario = simulation.scenarios[currentStep];
            
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Evaluate this training simulation response:

Scenario: ${scenario.scenario}
Expected Behavior: ${scenario.expected_behavior}
Agent Response: ${userResponse}

Score from 0-${scenario.points} based on how well they demonstrated the skill.
Provide feedback on what they did well and what to improve.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        score: { type: "number" },
                        feedback: { type: "string" },
                        passed: { type: "boolean" }
                    }
                }
            });

            const newScore = score + result.score;
            setScore(newScore);
            setResponses([...responses, { scenario, response: userResponse, ...result }]);

            if (currentStep < simulation.scenarios.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                // Simulation complete
                await completeSimulation(newScore);
            }
        } catch (error) {
            console.error('Step evaluation failed:', error);
            toast.error('Evaluation failed');
        } finally {
            setRunning(false);
        }
    };

    const completeSimulation = async (finalScore) => {
        const maxScore = simulation.scenarios.reduce((sum, s) => sum + s.points, 0);
        const percentage = (finalScore / maxScore) * 100;

        try {
            await base44.entities.AgentTrainingProgress.create({
                agent_name: agent.name,
                skill_category: skill.skill_category,
                baseline_score: skill.proficiency_level,
                current_score: Math.min(100, skill.proficiency_level + (percentage * 0.1)),
                improvement_rate: percentage * 0.1,
                training_iterations: 1,
                performance_history: responses,
                status: 'completed'
            });

            toast.success(`Simulation complete! Score: ${Math.round(percentage)}%`);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    if (!simulation) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Skill Simulation
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <p className="text-slate-600 mb-4">
                        Test {skill?.skill_name} in realistic scenarios
                    </p>
                    <Button onClick={generateSimulation}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Simulation
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const progress = ((currentStep + 1) / simulation.scenarios.length) * 100;
    const maxScore = simulation.scenarios.reduce((sum, s) => sum + s.points, 0);

    return (
        <div className="space-y-4">
            <Card className="border-2 border-blue-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-600" />
                                {simulation.simulation_name}
                            </CardTitle>
                            <p className="text-sm text-slate-600">
                                Step {currentStep + 1} of {simulation.scenarios.length}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{score}</p>
                            <p className="text-xs text-slate-500">/ {maxScore} points</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress value={progress} className="h-2" />
                    
                    {currentStep < simulation.scenarios.length && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <Badge className="mb-2">{simulation.difficulty}</Badge>
                            <h3 className="font-semibold mb-2">Scenario {currentStep + 1}:</h3>
                            <p className="text-sm text-slate-700 mb-4">
                                {simulation.scenarios[currentStep].scenario}
                            </p>
                            <Button
                                onClick={() => runStep('Agent completed task')}
                                disabled={running}
                            >
                                {running ? 'Evaluating...' : 'Complete Step'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {responses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {responses.map((resp, idx) => (
                            <div key={idx} className="border-l-4 border-slate-200 pl-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">Step {idx + 1}</p>
                                        <p className="text-xs text-slate-600">{resp.feedback}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {resp.passed ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <Badge>{resp.score} pts</Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}