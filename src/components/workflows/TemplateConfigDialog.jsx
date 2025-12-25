import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowRight, Save } from 'lucide-react';

export default function TemplateConfigDialog({ template, agents, open, onClose, onCreate }) {
    const [workflowName, setWorkflowName] = useState(template?.name || '');
    const [selectedAgents, setSelectedAgents] = useState({});

    const handleAgentSelect = (stepIndex, agentName) => {
        setSelectedAgents(prev => ({
            ...prev,
            [stepIndex]: agentName
        }));
    };

    const handleCreate = () => {
        const workflowData = {
            name: workflowName,
            description: template.description,
            category: template.category,
            steps: template.steps.map((step, index) => ({
                agent_name: selectedAgents[index] || '',
                step_name: step.step_name,
                instructions: step.instructions,
                order: index
            })),
            status: 'active',
            tags: ['from-template', template.id]
        };

        onCreate(workflowData);
    };

    const isValid = workflowName && template?.steps.every((_, index) => selectedAgents[index]);

    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure: {template.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Workflow Name */}
                    <div>
                        <Label htmlFor="workflow-name">Workflow Name</Label>
                        <Input
                            id="workflow-name"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            placeholder="Enter a name for this workflow"
                        />
                    </div>

                    {/* Agent Selection */}
                    <div>
                        <Label className="mb-3 block">Select Agents for Each Step</Label>
                        <div className="space-y-3">
                            {template.steps.map((step, index) => (
                                <div key={index}>
                                    <Card className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Step Number */}
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {index + 1}
                                            </div>

                                            {/* Step Configuration */}
                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{step.step_name}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{step.instructions}</p>
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-xs">Select Agent</Label>
                                                    <Select
                                                        value={selectedAgents[index] || ''}
                                                        onValueChange={(value) => handleAgentSelect(index, value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose an agent..." />
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
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Arrow between steps */}
                                    {index < template.steps.length - 1 && (
                                        <div className="flex justify-center py-2">
                                            <ArrowRight className="h-5 w-5 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!isValid}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Create Workflow
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}