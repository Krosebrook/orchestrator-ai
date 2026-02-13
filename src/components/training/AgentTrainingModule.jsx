import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, TrendingUp, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentTrainingModule({ agents, datasets, onTrainingComplete }) {
    const [selectedAgent, setSelectedAgent] = useState('');
    const [selectedDataset, setSelectedDataset] = useState('');
    const [trainingProgress, setTrainingProgress] = useState([]);
    const [activeTraining, setActiveTraining] = useState(null);
    const [training, setTraining] = useState(false);

    useEffect(() => {
        if (selectedAgent) {
            loadProgress();
        }
    }, [selectedAgent]);

    const loadProgress = async () => {
        try {
            const progress = await base44.entities.AgentTrainingProgress.filter({ 
                agent_name: selectedAgent 
            });
            setTrainingProgress(progress || []);
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    };

    const startTraining = async () => {
        if (!selectedAgent || !selectedDataset) {
            toast.error('Select agent and dataset');
            return;
        }

        setTraining(true);
        try {
            const dataset = datasets.find(d => d.id === selectedDataset);
            
            // Create training session
            const session = await base44.entities.TrainingSession.create({
                agent_name: selectedAgent,
                module_id: selectedDataset,
                status: 'in_progress',
                scenarios_completed: 0,
                total_scenarios: dataset.training_examples?.length || 0
            });

            // Initialize progress tracking
            const progress = await base44.entities.AgentTrainingProgress.create({
                agent_name: selectedAgent,
                training_session_id: session.id,
                dataset_id: selectedDataset,
                skill_category: dataset.skill_category,
                baseline_score: 50,
                current_score: 50,
                training_iterations: 0,
                performance_history: []
            });

            setActiveTraining({ session, progress, dataset });

            // Run training iterations
            await runTrainingIterations(dataset, progress, session);

        } catch (error) {
            console.error('Training failed:', error);
            toast.error('Training failed');
        } finally {
            setTraining(false);
        }
    };

    const runTrainingIterations = async (dataset, progress, session) => {
        const examples = dataset.training_examples || [];
        let currentScore = progress.current_score;
        let performanceHistory = [];

        for (let i = 0; i < Math.min(examples.length, 5); i++) {
            const example = examples[i];

            try {
                // Simulate agent training with the example
                const response = await base44.integrations.Core.InvokeLLM({
                    prompt: `Training exercise for ${selectedAgent}:

Scenario: ${example.input}

Expected response quality:
${example.expected_output}

Context: ${example.context}

Evaluate how well an agent would handle this scenario and suggest improvements.`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            score: { type: "number" },
                            feedback: { type: "string" },
                            improvements: { type: "array", items: { type: "string" } }
                        }
                    }
                });

                currentScore = Math.min(100, currentScore + (response.score / 10));
                
                performanceHistory.push({
                    timestamp: new Date().toISOString(),
                    score: currentScore,
                    feedback: response.feedback
                });

                // Update progress
                await base44.entities.AgentTrainingProgress.update(progress.id, {
                    current_score: currentScore,
                    training_iterations: i + 1,
                    performance_history: performanceHistory,
                    areas_for_improvement: response.improvements
                });

                // Update session
                await base44.entities.TrainingSession.update(session.id, {
                    scenarios_completed: i + 1,
                    score: currentScore
                });

            } catch (error) {
                console.error(`Training iteration ${i} failed:`, error);
            }
        }

        // Complete training
        await base44.entities.TrainingSession.update(session.id, {
            status: 'completed',
            completed_at: new Date().toISOString()
        });

        await base44.entities.AgentTrainingProgress.update(progress.id, {
            status: 'completed',
            improvement_rate: (currentScore - 50) / 5
        });

        toast.success(`Training complete! Score improved to ${Math.round(currentScore)}`);
        await loadProgress();
        onTrainingComplete?.();
    };

    const agentDatasets = datasets.filter(d => d.agent_name === selectedAgent);
    const agentProgress = trainingProgress.find(p => p.agent_name === selectedAgent);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Start Training Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Select Agent</label>
                            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map((agent) => (
                                        <SelectItem key={agent.name} value={agent.name}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Select Dataset</label>
                            <Select 
                                value={selectedDataset} 
                                onValueChange={setSelectedDataset}
                                disabled={!selectedAgent}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose dataset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agentDatasets.map((dataset) => (
                                        <SelectItem key={dataset.id} value={dataset.id}>
                                            {dataset.name} ({dataset.training_examples?.length || 0} examples)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button 
                        onClick={startTraining}
                        disabled={!selectedAgent || !selectedDataset || training}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {training ? 'Training in Progress...' : 'Start Training'}
                    </Button>
                </CardContent>
            </Card>

            {/* Current Progress */}
            {selectedAgent && agentProgress && (
                <Card>
                    <CardHeader>
                        <CardTitle>Training Progress: {selectedAgent}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-600">Current Skill Level</span>
                                    <span className="font-semibold">{Math.round(agentProgress.current_score)}/100</span>
                                </div>
                                <Progress value={agentProgress.current_score} className="h-3" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                    <p className="text-xs text-slate-600">Iterations</p>
                                    <p className="text-lg font-semibold text-slate-900">{agentProgress.training_iterations}</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                    <p className="text-xs text-slate-600">Improvement</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        +{Math.round(agentProgress.current_score - agentProgress.baseline_score)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                                    <p className="text-xs text-slate-600">Status</p>
                                    <Badge className="mt-1">{agentProgress.status}</Badge>
                                </div>
                            </div>

                            {agentProgress.areas_for_improvement?.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Areas for Improvement:</p>
                                    <ul className="space-y-1">
                                        {agentProgress.areas_for_improvement.slice(0, 3).map((area, idx) => (
                                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                <span className="text-amber-600">•</span>
                                                {area}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}