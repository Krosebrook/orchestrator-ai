import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AutomationRuleEditor({ open, onClose, rule, agents, onSave }) {
    const [formData, setFormData] = useState(rule || {
        name: '',
        trigger_type: 'new_query',
        action_type: 'categorize',
        agent_name: agents[0]?.name || '',
        condition: { type: 'always', value: '' },
        configuration: {},
        is_active: true
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Edit' : 'Create'} Automation Rule</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Rule Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Auto-categorize support queries"
                        />
                    </div>

                    <div>
                        <Label>Agent</Label>
                        <Select value={formData.agent_name} onValueChange={(v) => setFormData({ ...formData, agent_name: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.map(agent => (
                                    <SelectItem key={agent.name} value={agent.name}>{agent.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Trigger</Label>
                        <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new_query">New Query</SelectItem>
                                <SelectItem value="workflow_start">Workflow Start</SelectItem>
                                <SelectItem value="error_detected">Error Detected</SelectItem>
                                <SelectItem value="schedule">Schedule</SelectItem>
                                <SelectItem value="collaboration_request">Collaboration Request</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Action</Label>
                        <Select value={formData.action_type} onValueChange={(v) => setFormData({ ...formData, action_type: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="categorize">Categorize Request</SelectItem>
                                <SelectItem value="validate">Validate Data</SelectItem>
                                <SelectItem value="draft_response">Draft Response</SelectItem>
                                <SelectItem value="assign_agent">Assign Agent</SelectItem>
                                <SelectItem value="create_workflow">Create Workflow</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => onSave(formData)}>Save Rule</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}