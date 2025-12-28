import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight } from 'lucide-react';

const TRANSFORM_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'uppercase', label: 'Uppercase' },
    { value: 'lowercase', label: 'Lowercase' },
    { value: 'trim', label: 'Trim whitespace' },
    { value: 'date_format', label: 'Format date' }
];

export default function FieldMappingEditor({ mappings = [], onUpdate, entityName }) {
    const [localMappings, setLocalMappings] = useState(mappings);

    const addMapping = () => {
        const newMapping = {
            internal_field: '',
            external_field: '',
            transform: 'none'
        };
        const updated = [...localMappings, newMapping];
        setLocalMappings(updated);
        onUpdate(updated);
    };

    const removeMapping = (index) => {
        const updated = localMappings.filter((_, i) => i !== index);
        setLocalMappings(updated);
        onUpdate(updated);
    };

    const updateMapping = (index, field, value) => {
        const updated = [...localMappings];
        updated[index][field] = value;
        setLocalMappings(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-3">
            {localMappings.map((mapping, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <Input
                                value={mapping.internal_field}
                                onChange={(e) => updateMapping(index, 'internal_field', e.target.value)}
                                placeholder="Internal field (e.g., email)"
                                className="text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">{entityName || 'Internal'}</p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />

                        <div className="flex-1">
                            <Input
                                value={mapping.external_field}
                                onChange={(e) => updateMapping(index, 'external_field', e.target.value)}
                                placeholder="External field (e.g., Email)"
                                className="text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">External Service</p>
                        </div>

                        <Select
                            value={mapping.transform}
                            onValueChange={(value) => updateMapping(index, 'transform', value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TRANSFORM_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMapping(index)}
                            className="text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}

            <Button
                variant="outline"
                onClick={addMapping}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Field Mapping
            </Button>
        </div>
    );
}