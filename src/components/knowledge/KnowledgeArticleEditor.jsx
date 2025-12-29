import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function KnowledgeArticleEditor({ article, open, onClose, onSave }) {
    const [formData, setFormData] = useState(article || {
        title: '',
        content: '',
        category: 'agent_best_practices',
        tags: [],
        verified: false
    });
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()]
            });
            setTagInput('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{article ? 'Edit Article' : 'New Article'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Article title"
                        />
                    </div>

                    <div>
                        <Label>Content</Label>
                        <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Article content"
                            className="h-64"
                        />
                    </div>

                    <div>
                        <Label>Category</Label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="agent_best_practices">Agent Best Practices</option>
                            <option value="workflow_patterns">Workflow Patterns</option>
                            <option value="integration_guides">Integration Guides</option>
                            <option value="troubleshooting">Troubleshooting</option>
                            <option value="api_documentation">API Documentation</option>
                            <option value="business_rules">Business Rules</option>
                        </select>
                    </div>

                    <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder="Add tag"
                            />
                            <Button type="button" onClick={handleAddTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags?.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-100 rounded text-sm">
                                    {tag}
                                    <button
                                        onClick={() => setFormData({
                                            ...formData,
                                            tags: formData.tags.filter((_, i) => i !== idx)
                                        })}
                                        className="ml-2 text-red-600"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => onSave(formData)}>Save</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}