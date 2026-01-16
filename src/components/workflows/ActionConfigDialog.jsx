import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from 'lucide-react';

const ACTION_TYPES = [
    { value: 'create_entity', label: 'Create Record', description: 'Create a new entity record' },
    { value: 'update_entity', label: 'Update Record', description: 'Update an existing record' },
    { value: 'query_entity', label: 'Query Data', description: 'Retrieve entity data' },
    { value: 'send_email', label: 'Send Email', description: 'Send an email notification' },
    { value: 'api_call', label: 'API Call', description: 'Call external API' },
    { value: 'agent_chat', label: 'Agent Chat', description: 'Interact with an agent' }
];

export default function ActionConfigDialog({ open, onClose, node, onSave, entities = [] }) {
    const [actions, setActions] = useState(node?.config?.actions || []);

    const addAction = () => {
        setActions([...actions, {
            type: 'create_entity',
            entity: '',
            parameters: {}
        }]);
    };

    const removeAction = (index) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const updateAction = (index, field, value) => {
        const updated = [...actions];
        updated[index][field] = value;
        setActions(updated);
    };

    const handleSave = () => {
        onSave({
            ...node,
            config: {
                ...node.config,
                actions
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure Node Actions</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {actions.map((action, index) => (
                        <Card key={index} className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge>Action {index + 1}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeAction(index)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div>
                                    <Label>Action Type</Label>
                                    <Select
                                        value={action.type}
                                        onValueChange={(value) => updateAction(index, 'type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACTION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div>
                                                        <p className="font-medium">{type.label}</p>
                                                        <p className="text-xs text-slate-500">{type.description}</p>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(action.type === 'create_entity' || action.type === 'update_entity' || action.type === 'query_entity') && (
                                    <div>
                                        <Label>Entity</Label>
                                        <Select
                                            value={action.entity}
                                            onValueChange={(value) => updateAction(index, 'entity', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select entity..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {entities.map((entity) => (
                                                    <SelectItem key={entity} value={entity}>
                                                        {entity}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div>
                                    <Label>Parameters (JSON)</Label>
                                    <Textarea
                                        value={JSON.stringify(action.parameters || {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const params = JSON.parse(e.target.value);
                                                updateAction(index, 'parameters', params);
                                            } catch {}
                                        }}
                                        placeholder='{"field": "value"}'
                                        rows={4}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}

                    <Button onClick={addAction} variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Action
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Actions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}