import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from 'lucide-react';

export default function TemplateCustomizer({ template, open, onClose, onSave }) {
    const [workflowName, setWorkflowName] = useState(template?.name || '');
    const [customFields, setCustomFields] = useState({});

    const handleFieldChange = (fieldName, value) => {
        setCustomFields(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSave = () => {
        const customizedConfig = {
            ...template.template_config,
            variables: {
                ...template.template_config.variables,
                ...customFields
            }
        };

        onSave({
            name: workflowName,
            description: template.description,
            nodes: customizedConfig.nodes,
            edges: customizedConfig.edges,
            variables: customizedConfig.variables,
            category: template.category,
            tags: template.tags
        });
    };

    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Customize Template: {template.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Workflow Name */}
                    <div>
                        <Label>Workflow Name</Label>
                        <Input
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            placeholder="My Custom Workflow"
                        />
                    </div>

                    {/* Customizable Fields */}
                    {template.customizable_fields && template.customizable_fields.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900">Customize Parameters</h3>
                            {template.customizable_fields.map((field, idx) => (
                                <div key={idx}>
                                    <Label>{field.label}</Label>
                                    {field.type === 'textarea' ? (
                                        <Textarea
                                            value={customFields[field.field] || field.default || ''}
                                            onChange={(e) => handleFieldChange(field.field, e.target.value)}
                                            placeholder={field.default}
                                            rows={3}
                                        />
                                    ) : (
                                        <Input
                                            value={customFields[field.field] || field.default || ''}
                                            onChange={(e) => handleFieldChange(field.field, e.target.value)}
                                            placeholder={field.default}
                                            type={field.type || 'text'}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Required Agents Info */}
                    {template.required_agents && template.required_agents.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm font-semibold text-blue-900 mb-2">Required Agents:</p>
                            <div className="flex flex-wrap gap-2">
                                {template.required_agents.map((agent, idx) => (
                                    <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {agent}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
                        <Save className="h-4 w-4 mr-2" />
                        Create Workflow
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}