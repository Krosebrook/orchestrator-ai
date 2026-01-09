import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from 'react';

export default function LoopConfigEditor({ open, onClose, node, onSave }) {
    const [loopConfig, setLoopConfig] = useState(node?.config?.loop_config || {
        loop_type: 'foreach',
        max_iterations: 100,
        iteration_data_path: '',
        condition: '',
        break_on_error: true
    });

    const handleSave = () => {
        onSave({
            ...node,
            config: {
                ...node.config,
                loop_config: loopConfig
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configure Loop</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Loop Type</Label>
                        <Select
                            value={loopConfig.loop_type}
                            onValueChange={(value) => setLoopConfig({ ...loopConfig, loop_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="foreach">For Each (iterate over array)</SelectItem>
                                <SelectItem value="while">While (condition before execution)</SelectItem>
                                <SelectItem value="until">Until (condition after execution)</SelectItem>
                                <SelectItem value="fixed_count">Fixed Count (N times)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Max Iterations</Label>
                        <Input
                            type="number"
                            value={loopConfig.max_iterations}
                            onChange={(e) => setLoopConfig({ ...loopConfig, max_iterations: parseInt(e.target.value) })}
                            placeholder="100"
                        />
                        <p className="text-xs text-slate-500 mt-1">Safety limit to prevent infinite loops</p>
                    </div>

                    {loopConfig.loop_type === 'foreach' && (
                        <div>
                            <Label>Array Data Path</Label>
                            <Input
                                value={loopConfig.iteration_data_path}
                                onChange={(e) => setLoopConfig({ ...loopConfig, iteration_data_path: e.target.value })}
                                placeholder="items or data.results"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Path to array in input data (e.g., "items" or "data.results"). Leave empty to use input as array.
                            </p>
                        </div>
                    )}

                    {(loopConfig.loop_type === 'while' || loopConfig.loop_type === 'until') && (
                        <div>
                            <Label>Condition</Label>
                            <Textarea
                                value={loopConfig.condition}
                                onChange={(e) => setLoopConfig({ ...loopConfig, condition: e.target.value })}
                                rows={3}
                                placeholder="e.g., 'count is less than 10' or 'has_more is true'"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Describe the condition in natural language. AI will evaluate it.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Break on Error</Label>
                            <p className="text-xs text-slate-500">Stop the loop if an iteration fails</p>
                        </div>
                        <Switch
                            checked={loopConfig.break_on_error}
                            onCheckedChange={(checked) => setLoopConfig({ ...loopConfig, break_on_error: checked })}
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Loop Examples:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li><strong>For Each:</strong> Process each item in an array (e.g., emails, documents)</li>
                            <li><strong>While:</strong> Continue while condition is true (e.g., has_more_pages)</li>
                            <li><strong>Until:</strong> Continue until condition becomes true (e.g., complete)</li>
                            <li><strong>Fixed Count:</strong> Repeat exactly N times</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save Loop Config</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}