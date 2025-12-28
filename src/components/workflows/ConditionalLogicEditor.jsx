import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GitBranch } from 'lucide-react';

const OPERATORS = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' }
];

export default function ConditionalLogicEditor({ open, onClose, node, onSave }) {
    const [conditions, setConditions] = useState(node?.config?.conditions || []);
    const [branches, setBranches] = useState(node?.config?.branches || [
        { label: 'True', targetNodeId: '' },
        { label: 'False', targetNodeId: '' }
    ]);

    const addCondition = () => {
        setConditions([...conditions, {
            field: '',
            operator: 'equals',
            value: ''
        }]);
    };

    const removeCondition = (index) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index, field, value) => {
        const updated = [...conditions];
        updated[index][field] = value;
        setConditions(updated);
    };

    const handleSave = () => {
        onSave({
            ...node,
            config: {
                ...node.config,
                conditions,
                branches,
                logic: 'AND' // Can be extended to support OR
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Configure Conditional Logic
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Conditions (ALL must be true)</Label>
                            <Button onClick={addCondition} size="sm" variant="outline">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Condition
                            </Button>
                        </div>

                        {conditions.map((condition, index) => (
                            <Card key={index} className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <Input
                                            value={condition.field}
                                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                                            placeholder="Field name or variable"
                                        />
                                    </div>

                                    <Select
                                        value={condition.operator}
                                        onValueChange={(value) => updateCondition(index, 'operator', value)}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OPERATORS.map((op) => (
                                                <SelectItem key={op.value} value={op.value}>
                                                    {op.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                        <div className="flex-1">
                                            <Input
                                                value={condition.value}
                                                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                                placeholder="Value"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeCondition(index)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {conditions.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-500">
                                No conditions defined. Add conditions to create branching logic.
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label>Branch Paths</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-4 bg-green-50 border-green-200">
                                <Label className="text-green-700">✓ Conditions Met</Label>
                                <p className="text-xs text-green-600 mt-1">
                                    Workflow continues to the connected node
                                </p>
                            </Card>
                            <Card className="p-4 bg-red-50 border-red-200">
                                <Label className="text-red-700">✗ Conditions Not Met</Label>
                                <p className="text-xs text-red-600 mt-1">
                                    Workflow follows alternative path
                                </p>
                            </Card>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <strong>Tip:</strong> Use previous step outputs as variables in your conditions.
                            Example: <code className="bg-blue-100 px-1 py-0.5 rounded">status</code>, 
                            <code className="bg-blue-100 px-1 py-0.5 rounded ml-1">count</code>
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Logic</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}