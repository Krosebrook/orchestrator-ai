import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewCollaborationDialog({ open, onClose, agents, onCreate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [selectedAgents, setSelectedAgents] = useState([]);

    const addAgent = (agentName) => {
        if (!selectedAgents.find(a => a.agent_name === agentName)) {
            setSelectedAgents([...selectedAgents, { agent_name: agentName, role: 'collaborator' }]);
        }
    };

    const removeAgent = (agentName) => {
        setSelectedAgents(selectedAgents.filter(a => a.agent_name !== agentName));
    };

    const updateRole = (agentName, role) => {
        setSelectedAgents(selectedAgents.map(a => 
            a.agent_name === agentName ? { ...a, role } : a
        ));
    };

    const handleCreate = () => {
        if (!name.trim() || !goal.trim() || selectedAgents.length < 2) {
            alert('Please fill in all fields and select at least 2 agents');
            return;
        }

        onCreate({
            name,
            description,
            goal,
            participating_agents: selectedAgents
        });

        setName('');
        setDescription('');
        setGoal('');
        setSelectedAgents([]);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Collaboration Session</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div>
                        <Label>Session Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Customer Support Analysis"
                        />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this collaboration..."
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label>Collaboration Goal</Label>
                        <Input
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="What should the agents accomplish together?"
                        />
                    </div>

                    <div>
                        <Label className="mb-2 block">Select Agents (minimum 2)</Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {agents.map((agent) => (
                                <Badge
                                    key={agent.name}
                                    className={selectedAgents.find(a => a.agent_name === agent.name)
                                        ? 'bg-blue-600 cursor-pointer'
                                        : 'bg-slate-200 text-slate-700 cursor-pointer hover:bg-slate-300'
                                    }
                                    onClick={() => {
                                        if (selectedAgents.find(a => a.agent_name === agent.name)) {
                                            removeAgent(agent.name);
                                        } else {
                                            addAgent(agent.name);
                                        }
                                    }}
                                >
                                    {agent.name}
                                </Badge>
                            ))}
                        </div>

                        {selectedAgents.length > 0 && (
                            <div className="space-y-2 border rounded-lg p-3">
                                {selectedAgents.map((agent, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="flex-1 text-sm font-medium">{agent.agent_name}</span>
                                        <Select value={agent.role} onValueChange={(role) => updateRole(agent.agent_name, role)}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="lead">Lead</SelectItem>
                                                <SelectItem value="collaborator">Collaborator</SelectItem>
                                                <SelectItem value="advisor">Advisor</SelectItem>
                                                <SelectItem value="executor">Executor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreate}>Create Collaboration</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}