import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingDatasetManager({ agents, onDatasetCreated }) {
    const [datasets, setDatasets] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingDataset, setEditingDataset] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        agent_name: '',
        skill_category: 'communication',
        training_examples: [],
        desired_behaviors: []
    });
    const [currentExample, setCurrentExample] = useState({ input: '', expected_output: '', context: '', difficulty: 'medium' });
    const [currentBehavior, setCurrentBehavior] = useState({ behavior: '', description: '', priority: 'medium' });
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const data = await base44.entities.TrainingDataset.list('-updated_date');
            setDatasets(data || []);
        } catch (error) {
            console.error('Failed to load datasets:', error);
        }
    };

    const generateExamplesWithAI = async () => {
        if (!formData.skill_category || !formData.agent_name) {
            toast.error('Select agent and skill category first');
            return;
        }

        setGenerating(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate 5 training examples for an AI agent to improve their ${formData.skill_category} skills.
                
Agent: ${formData.agent_name}
Skill: ${formData.skill_category}

For each example, provide:
1. A realistic input/scenario
2. The expected high-quality output/response
3. Context about why this response is good
4. Difficulty level (easy/medium/hard)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        examples: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    input: { type: "string" },
                                    expected_output: { type: "string" },
                                    context: { type: "string" },
                                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                                }
                            }
                        }
                    }
                }
            });

            setFormData(prev => ({
                ...prev,
                training_examples: [...prev.training_examples, ...response.examples]
            }));
            toast.success('Training examples generated!');
        } catch (error) {
            console.error('Failed to generate examples:', error);
            toast.error('Failed to generate examples');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingDataset) {
                await base44.entities.TrainingDataset.update(editingDataset.id, formData);
                toast.success('Dataset updated');
            } else {
                await base44.entities.TrainingDataset.create(formData);
                toast.success('Dataset created');
            }
            await loadDatasets();
            handleCloseDialog();
            onDatasetCreated?.();
        } catch (error) {
            console.error('Failed to save dataset:', error);
            toast.error('Failed to save dataset');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this dataset?')) return;
        try {
            await base44.entities.TrainingDataset.delete(id);
            toast.success('Dataset deleted');
            await loadDatasets();
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to delete');
        }
    };

    const handleOpenDialog = (dataset = null) => {
        if (dataset) {
            setEditingDataset(dataset);
            setFormData(dataset);
        } else {
            setEditingDataset(null);
            setFormData({
                name: '',
                description: '',
                agent_name: '',
                skill_category: 'communication',
                training_examples: [],
                desired_behaviors: []
            });
        }
        setShowDialog(true);
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
        setEditingDataset(null);
        setCurrentExample({ input: '', expected_output: '', context: '', difficulty: 'medium' });
        setCurrentBehavior({ behavior: '', description: '', priority: 'medium' });
    };

    const addExample = () => {
        if (currentExample.input && currentExample.expected_output) {
            setFormData(prev => ({
                ...prev,
                training_examples: [...prev.training_examples, currentExample]
            }));
            setCurrentExample({ input: '', expected_output: '', context: '', difficulty: 'medium' });
        }
    };

    const addBehavior = () => {
        if (currentBehavior.behavior && currentBehavior.description) {
            setFormData(prev => ({
                ...prev,
                desired_behaviors: [...prev.desired_behaviors, currentBehavior]
            }));
            setCurrentBehavior({ behavior: '', description: '', priority: 'medium' });
        }
    };

    const removeExample = (index) => {
        setFormData(prev => ({
            ...prev,
            training_examples: prev.training_examples.filter((_, i) => i !== index)
        }));
    };

    const removeBehavior = (index) => {
        setFormData(prev => ({
            ...prev,
            desired_behaviors: prev.desired_behaviors.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Training Datasets</h3>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dataset
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datasets.map((dataset) => (
                    <Card key={dataset.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-base">{dataset.name}</CardTitle>
                                    <p className="text-sm text-slate-600 mt-1">{dataset.agent_name}</p>
                                </div>
                                <Badge>{dataset.skill_category}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 mb-3">{dataset.description}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                <span>{dataset.training_examples?.length || 0} examples</span>
                                <span>{dataset.desired_behaviors?.length || 0} behaviors</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(dataset)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(dataset.id)}>
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingDataset ? 'Edit' : 'Create'} Training Dataset</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Dataset Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Customer Service Excellence"
                                />
                            </div>
                            <div>
                                <Label>Skill Category</Label>
                                <Select value={formData.skill_category} onValueChange={(v) => setFormData({ ...formData, skill_category: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="communication">Communication</SelectItem>
                                        <SelectItem value="problem_solving">Problem Solving</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="creativity">Creativity</SelectItem>
                                        <SelectItem value="analysis">Analysis</SelectItem>
                                        <SelectItem value="customer_service">Customer Service</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Target Agent</Label>
                            <Select value={formData.agent_name} onValueChange={(v) => setFormData({ ...formData, agent_name: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select agent" />
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
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What this dataset trains..."
                                rows={2}
                            />
                        </div>

                        {/* Training Examples */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-base">Training Examples</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateExamplesWithAI}
                                    disabled={generating}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {generating ? 'Generating...' : 'Generate with AI'}
                                </Button>
                            </div>

                            <Card className="p-4 mb-3">
                                <div className="space-y-3">
                                    <Textarea
                                        value={currentExample.input}
                                        onChange={(e) => setCurrentExample({ ...currentExample, input: e.target.value })}
                                        placeholder="Input scenario..."
                                        rows={2}
                                    />
                                    <Textarea
                                        value={currentExample.expected_output}
                                        onChange={(e) => setCurrentExample({ ...currentExample, expected_output: e.target.value })}
                                        placeholder="Expected output..."
                                        rows={2}
                                    />
                                    <Input
                                        value={currentExample.context}
                                        onChange={(e) => setCurrentExample({ ...currentExample, context: e.target.value })}
                                        placeholder="Context/reasoning..."
                                    />
                                    <div className="flex gap-2">
                                        <Select value={currentExample.difficulty} onValueChange={(v) => setCurrentExample({ ...currentExample, difficulty: v })}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={addExample} size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Example
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-2">
                                {formData.training_examples.map((ex, idx) => (
                                    <Card key={idx} className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold">Input: {ex.input}</p>
                                                <p className="text-sm text-slate-600 mt-1">Output: {ex.expected_output}</p>
                                                <Badge className="mt-2" variant="outline">{ex.difficulty}</Badge>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeExample(idx)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Desired Behaviors */}
                        <div>
                            <Label className="text-base mb-3 block">Desired Behaviors</Label>
                            <Card className="p-4 mb-3">
                                <div className="space-y-3">
                                    <Input
                                        value={currentBehavior.behavior}
                                        onChange={(e) => setCurrentBehavior({ ...currentBehavior, behavior: e.target.value })}
                                        placeholder="Behavior (e.g., Active listening)"
                                    />
                                    <Textarea
                                        value={currentBehavior.description}
                                        onChange={(e) => setCurrentBehavior({ ...currentBehavior, description: e.target.value })}
                                        placeholder="Description..."
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Select value={currentBehavior.priority} onValueChange={(v) => setCurrentBehavior({ ...currentBehavior, priority: v })}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={addBehavior} size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Behavior
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-2">
                                {formData.desired_behaviors.map((behavior, idx) => (
                                    <Card key={idx} className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold">{behavior.behavior}</p>
                                                <p className="text-sm text-slate-600 mt-1">{behavior.description}</p>
                                                <Badge className="mt-2" variant="outline">{behavior.priority} priority</Badge>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeBehavior(idx)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Dataset
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}