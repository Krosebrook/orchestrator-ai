import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingModuleCreator({ open, onClose, agents, onCreate }) {
    const [module, setModule] = useState({
        title: '',
        description: '',
        target_agents: [],
        difficulty: 'beginner',
        scenarios: [],
        learning_objectives: [],
        status: 'draft'
    });

    const addScenario = () => {
        setModule({
            ...module,
            scenarios: [...module.scenarios, {
                id: `scenario_${Date.now()}`,
                name: '',
                description: '',
                initial_prompt: '',
                expected_behaviors: [],
                success_criteria: []
            }]
        });
    };

    const updateScenario = (index, field, value) => {
        const updated = [...module.scenarios];
        updated[index][field] = value;
        setModule({ ...module, scenarios: updated });
    };

    const removeScenario = (index) => {
        setModule({
            ...module,
            scenarios: module.scenarios.filter((_, i) => i !== index)
        });
    };

    const handleCreate = () => {
        if (!module.title || !module.description || module.target_agents.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (module.scenarios.length === 0) {
            toast.error('Add at least one training scenario');
            return;
        }

        onCreate(module);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Training Module</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Module Title *</Label>
                            <Input
                                value={module.title}
                                onChange={(e) => setModule({ ...module, title: e.target.value })}
                                placeholder="e.g., Customer Service Excellence"
                            />
                        </div>
                        <div>
                            <Label>Difficulty *</Label>
                            <Select value={module.difficulty} onValueChange={(val) => setModule({ ...module, difficulty: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>Description *</Label>
                        <Textarea
                            value={module.description}
                            onChange={(e) => setModule({ ...module, description: e.target.value })}
                            placeholder="What will agents learn from this module?"
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Target Agents * (comma separated)</Label>
                        <Input
                            value={module.target_agents.join(', ')}
                            onChange={(e) => setModule({
                                ...module,
                                target_agents: e.target.value.split(',').map(a => a.trim()).filter(Boolean)
                            })}
                            placeholder="e.g., support_agent, sales_agent"
                        />
                    </div>

                    <div>
                        <Label>Learning Objectives (one per line)</Label>
                        <Textarea
                            value={module.learning_objectives.join('\n')}
                            onChange={(e) => setModule({
                                ...module,
                                learning_objectives: e.target.value.split('\n').filter(Boolean)
                            })}
                            placeholder="- Handle customer complaints effectively&#10;- Provide accurate product information"
                            rows={3}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label>Training Scenarios *</Label>
                            <Button size="sm" onClick={addScenario}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Scenario
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {module.scenarios.map((scenario, idx) => (
                                <Card key={scenario.id} className="border-2">
                                    <CardContent className="pt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">Scenario {idx + 1}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeScenario(idx)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Input
                                            value={scenario.name}
                                            onChange={(e) => updateScenario(idx, 'name', e.target.value)}
                                            placeholder="Scenario name"
                                        />
                                        <Textarea
                                            value={scenario.description}
                                            onChange={(e) => updateScenario(idx, 'description', e.target.value)}
                                            placeholder="What challenge will the agent face?"
                                            rows={2}
                                        />
                                        <Textarea
                                            value={scenario.initial_prompt}
                                            onChange={(e) => updateScenario(idx, 'initial_prompt', e.target.value)}
                                            placeholder="Initial prompt that will be given to the agent"
                                            rows={2}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Expected Behaviors (comma separated)</Label>
                                                <Input
                                                    value={scenario.expected_behaviors?.join(', ') || ''}
                                                    onChange={(e) => updateScenario(
                                                        idx,
                                                        'expected_behaviors',
                                                        e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                                                    )}
                                                    placeholder="empathy, accuracy"
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Success Criteria (comma separated)</Label>
                                                <Input
                                                    value={scenario.success_criteria?.join(', ') || ''}
                                                    onChange={(e) => updateScenario(
                                                        idx,
                                                        'success_criteria',
                                                        e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                                                    )}
                                                    placeholder="resolve issue, provide solution"
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Module</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}