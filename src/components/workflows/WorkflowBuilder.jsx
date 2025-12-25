import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, X, ArrowRight, Save, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function WorkflowBuilder({ workflow, agents, onSave, onCancel }) {
    const [name, setName] = useState(workflow?.name || '');
    const [description, setDescription] = useState(workflow?.description || '');
    const [category, setCategory] = useState(workflow?.category || 'custom');
    const [steps, setSteps] = useState(workflow?.steps || []);

    const addStep = () => {
        setSteps([...steps, {
            agent_name: '',
            step_name: `Step ${steps.length + 1}`,
            instructions: '',
            order: steps.length
        }]);
    };

    const removeStep = (index) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const moveStep = (index, direction) => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === steps.length - 1)
        ) return;

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        
        newSteps.forEach((step, i) => {
            step.order = i;
        });
        
        setSteps(newSteps);
    };

    const handleSave = () => {
        const workflowData = {
            name,
            description,
            category,
            steps: steps.map((step, i) => ({ ...step, order: i })),
            status: 'active'
        };
        onSave(workflowData);
    };

    const isValid = name && steps.length > 0 && steps.every(s => s.agent_name);

    return (
        <div className="space-y-6">
            {/* Workflow Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Workflow Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="name">Workflow Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Research to Article Pipeline"
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this workflow does..."
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="research">Research</SelectItem>
                                <SelectItem value="content_creation">Content Creation</SelectItem>
                                <SelectItem value="data_analysis">Data Analysis</SelectItem>
                                <SelectItem value="task_automation">Task Automation</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Workflow Steps */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Agent Pipeline ({steps.length} steps)</CardTitle>
                    <Button onClick={addStep} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Step
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {steps.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No steps yet. Add your first agent to the pipeline.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={index}>
                                    <Card className="border-2 border-slate-200">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                {/* Step Number */}
                                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => moveStep(index, 'up')}
                                                            disabled={index === 0}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            ↑
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => moveStep(index, 'down')}
                                                            disabled={index === steps.length - 1}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            ↓
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Step Configuration */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <Label>Agent</Label>
                                                            <Select
                                                                value={step.agent_name}
                                                                onValueChange={(value) => updateStep(index, 'agent_name', value)}
                                                            >
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
                                                            <Label>Step Name</Label>
                                                            <Input
                                                                value={step.step_name}
                                                                onChange={(e) => updateStep(index, 'step_name', e.target.value)}
                                                                placeholder="e.g., Research Phase"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Specific Instructions (Optional)</Label>
                                                        <Textarea
                                                            value={step.instructions}
                                                            onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                                                            placeholder="Specific instructions for this step..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeStep(index)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Arrow between steps */}
                                    {index < steps.length - 1 && (
                                        <div className="flex justify-center py-2">
                                            <ArrowRight className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!isValid}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Save Workflow
                </Button>
            </div>
        </div>
    );
}