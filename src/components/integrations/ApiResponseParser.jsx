import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye } from 'lucide-react';

export default function ApiResponseParser({ responseSchema, mappings, onMappingsChange }) {
    const [localMappings, setLocalMappings] = useState(mappings || []);
    const [showExample, setShowExample] = useState(false);

    const addMapping = () => {
        const newMapping = {
            response_field: '',
            variable_name: '',
            transform: ''
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Response Field Mappings</Label>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setShowExample(!showExample)} 
                        size="sm" 
                        variant="outline"
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        {showExample ? 'Hide' : 'Show'} Example
                    </Button>
                    <Button onClick={addMapping} size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Field
                    </Button>
                </div>
            </div>

            {showExample && responseSchema && (
                <Card className="bg-slate-50">
                    <CardHeader>
                        <CardTitle className="text-xs">Example Response Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs text-slate-700 overflow-x-auto">
                            {JSON.stringify(responseSchema, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {localMappings.length === 0 ? (
                <Card className="bg-slate-50">
                    <CardContent className="pt-6 text-center text-slate-500">
                        <p className="text-sm">No response mappings configured</p>
                        <p className="text-xs mt-1">Add mappings to extract data from API responses</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {localMappings.map((mapping, index) => (
                        <Card key={index}>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge>Field {index + 1}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeMapping(index)}
                                            className="h-6 w-6 text-red-600"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">Response Field Path</Label>
                                            <Input
                                                value={mapping.response_field}
                                                onChange={(e) => updateMapping(index, 'response_field', e.target.value)}
                                                placeholder="e.g., data.items[0].name"
                                                className="h-8"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">Save As Variable</Label>
                                            <Input
                                                value={mapping.variable_name}
                                                onChange={(e) => updateMapping(index, 'variable_name', e.target.value)}
                                                placeholder="e.g., contact_name"
                                                className="h-8"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs">Transform (Optional)</Label>
                                        <Input
                                            value={mapping.transform || ''}
                                            onChange={(e) => updateMapping(index, 'transform', e.target.value)}
                                            placeholder="e.g., toLowerCase(), split(','), etc."
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                    <strong>Tip:</strong> Use dot notation for nested fields (e.g., <code className="bg-green-100 px-1 py-0.5 rounded">user.email</code>) 
                    and array indices (e.g., <code className="bg-green-100 px-1 py-0.5 rounded">items[0].name</code>)
                </p>
            </div>
        </div>
    );
}