import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Plus, Trash2 } from 'lucide-react';

export default function SharedContextPanel({ context, onUpdate }) {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const addContextItem = () => {
        if (newKey.trim() && newValue.trim()) {
            onUpdate({ [newKey]: newValue });
            setNewKey('');
            setNewValue('');
        }
    };

    const removeContextItem = (key) => {
        const updated = { ...context };
        delete updated[key];
        onUpdate(updated);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-5 w-5 text-purple-600" />
                    Shared Context
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {Object.entries(context).length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No shared context yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(context).map(([key, value]) => (
                                <div key={key} className="flex items-start justify-between bg-slate-50 p-2 rounded">
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-slate-700">{key}</p>
                                        <p className="text-xs text-slate-600">{String(value)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeContextItem(key)}
                                    >
                                        <Trash2 className="h-3 w-3 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-3 border-t space-y-2">
                        <Label className="text-xs">Add Context</Label>
                        <Input
                            placeholder="Key"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            size="sm"
                        />
                        <Input
                            placeholder="Value"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            size="sm"
                        />
                        <Button onClick={addContextItem} size="sm" className="w-full">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}