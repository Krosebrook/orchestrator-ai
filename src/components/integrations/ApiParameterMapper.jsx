import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Variable } from 'lucide-react';

const VALUE_SOURCES = [
    { value: 'static', label: 'Static Value', description: 'Enter a fixed value' },
    { value: 'variable', label: 'Variable', description: 'Use workflow variable' },
    { value: 'previous_output', label: 'Previous Output', description: 'Use output from previous step' },
    { value: 'user_input', label: 'User Input', description: 'Ask user during execution' }
];

export default function ApiParameterMapper({ endpoint, mappings, onMappingsChange }) {
    const [localMappings, setLocalMappings] = useState(mappings || []);

    useEffect(() => {
        // Initialize mappings for required parameters
        if (endpoint?.parameters && localMappings.length === 0) {
            const requiredParams = endpoint.parameters.filter(p => p.required);
            if (requiredParams.length > 0) {
                setLocalMappings(requiredParams.map(p => ({
                    parameter: p.name,
                    source: 'static',
                    value: ''
                })));
            }
        }
    }, [endpoint]);

    const addMapping = () => {
        const newMapping = {
            parameter: '',
            source: 'static',
            value: ''
        };
        const updated = [...localMappings, newMapping];
        setLocalMappings(updated);
        onMappingsChange(updated);
    };

    const updateMapping = (index, field, value) => {
        const updated = [...localMappings];
        updated[index][field] = value;
        setLocalMappings(updated);
        onMappingsChange(updated);
    };

    const removeMapping = (index) => {
        const updated = localMappings.filter((_, i) => i !== index);
        setLocalMappings(updated);
        onMappingsChange(updated);
    };

    const availableParams = endpoint?.parameters || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Parameter Mappings</Label>
                <Button onClick={addMapping} size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Mapping
                </Button>
            </div>

            {localMappings.length === 0 ? (
                <Card className="bg-slate-50">
                    <CardContent className="pt-6 text-center text-slate-500">
                        <Variable className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm">No parameter mappings configured</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {localMappings.map((mapping, index) => {
                        const param = availableParams.find(p => p.name === mapping.parameter);
                        
                        return (
                            <Card key={index}>
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant={param?.required ? "default" : "outline"}>
                                                Mapping {index + 1}
                                                {param?.required && " (Required)"}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeMapping(index)}
                                                className="h-6 w-6 text-red-600"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs">API Parameter</Label>
                                                <Select
                                                    value={mapping.parameter}
                                                    onValueChange={(value) => updateMapping(index, 'parameter', value)}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableParams.map((param) => (
                                                            <SelectItem key={param.name} value={param.name}>
                                                                <div>
                                                                    <p>{param.name}</p>
                                                                    {param.description && (
                                                                        <p className="text-xs text-slate-500">
                                                                            {param.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Value Source</Label>
                                                <Select
                                                    value={mapping.source}
                                                    onValueChange={(value) => updateMapping(index, 'source', value)}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {VALUE_SOURCES.map((source) => (
                                                            <SelectItem key={source.value} value={source.value}>
                                                                <div>
                                                                    <p>{source.label}</p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {source.description}
                                                                    </p>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Value</Label>
                                                <Input
                                                    value={mapping.value}
                                                    onChange={(e) => updateMapping(index, 'value', e.target.value)}
                                                    placeholder={
                                                        mapping.source === 'variable' ? '${variable_name}' :
                                                        mapping.source === 'previous_output' ? 'output.field' :
                                                        'Enter value...'
                                                    }
                                                    className="h-8"
                                                />
                                            </div>
                                        </div>

                                        {param && (
                                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                                <p>
                                                    <strong>Type:</strong> {param.type} {' '}
                                                    {param.required && <Badge variant="outline" className="ml-2">Required</Badge>}
                                                </p>
                                                {param.description && <p className="mt-1">{param.description}</p>}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Use variables like <code className="bg-blue-100 px-1 py-0.5 rounded">{'${user_name}'}</code> or 
                    access previous outputs with <code className="bg-blue-100 px-1 py-0.5 rounded">output.field_name</code>
                </p>
            </div>
        </div>
    );
}