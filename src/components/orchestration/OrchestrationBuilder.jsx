import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowRight, Save } from 'lucide-react';
import ProfileAwareOrchestrationHelper from './ProfileAwareOrchestrationHelper';

export default function OrchestrationBuilder({ orchestration, agents, onSave, onCancel }) {
    const [name, setName] = useState(orchestration?.name || '');
    const [description, setDescription] = useState(orchestration?.description || '');
    const [protocol, setProtocol] = useState(orchestration?.communication_protocol || 'sequential');
    const [selectedAgents, setSelectedAgents] = useState(orchestration?.agents || []);
    const [handoffRules, setHandoffRules] = useState(orchestration?.handoff_rules || []);

    const addAgent = (agentName) => {
        if (!selectedAgents.find(a => a.agent_name === agentName)) {
            setSelectedAgents([...selectedAgents, {
                agent_name: agentName,
                role: 'processor',
                sequence: selectedAgents.length + 1
            }]);
        }
    };

    const removeAgent = (agentName) => {
        setSelectedAgents(selectedAgents.filter(a => a.agent_name !== agentName));
    };

    const addHandoffRule = () => {
        setHandoffRules([...handoffRules, {
            from_agent: '',
            to_agent: '',
            condition: '',
            data_mapping: {}
        }]);
    };

    const updateHandoffRule = (index, field, value) => {
        const updated = [...handoffRules];
        updated[index][field] = value;
        setHandoffRules(updated);
    };

    const removeHandoffRule = (index) => {
        setHandoffRules(handoffRules.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Please enter a name');
            return;
        }
        if (selectedAgents.length < 2) {
            alert('Please add at least 2 agents');
            return;
        }

        onSave({
            name,
            description,
            agents: selectedAgents,
            communication_protocol: protocol,
            handoff_rules: handoffRules,
            status: orchestration?.status || 'draft'
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Orchestration Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <Label>Communication Protocol</Label>
                    <Select value={protocol} onValueChange={setProtocol}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sequential">Sequential</SelectItem>
                            <SelectItem value="parallel">Parallel</SelectItem>
                            <SelectItem value="conditional">Conditional</SelectItem>
                            <SelectItem value="event_driven">Event-Driven</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <ProfileAwareOrchestrationHelper 
                selectedAgents={selectedAgents}
                onSuggestion={(suggestion) => console.log('Suggestion:', suggestion)}
            />

            <div>
                <Label className="mb-2 block">Participating Agents</Label>
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
                <div className="space-y-2">
                    {selectedAgents.map((agent, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                            <span className="font-mono text-sm">{idx + 1}.</span>
                            <span className="flex-1">{agent.agent_name}</span>
                            {idx < selectedAgents.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <Label>Handoff Rules</Label>
                    <Button onClick={addHandoffRule} size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Rule
                    </Button>
                </div>
                <div className="space-y-3">
                    {handoffRules.map((rule, index) => (
                        <Card key={index}>
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <Select
                                            value={rule.from_agent}
                                            onValueChange={(value) => updateHandoffRule(index, 'from_agent', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="From..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedAgents.map((a) => (
                                                    <SelectItem key={a.agent_name} value={a.agent_name}>
                                                        {a.agent_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={rule.to_agent}
                                            onValueChange={(value) => updateHandoffRule(index, 'to_agent', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="To..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedAgents.map((a) => (
                                                    <SelectItem key={a.agent_name} value={a.agent_name}>
                                                        {a.agent_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            value={rule.condition}
                                            onChange={(e) => updateHandoffRule(index, 'condition', e.target.value)}
                                            placeholder="Condition..."
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeHandoffRule(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Orchestration
                </Button>
            </div>
        </div>
    );
}