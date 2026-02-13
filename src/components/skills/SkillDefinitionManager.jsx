import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Shield } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import SkillVerificationBadge from './SkillVerificationBadge';
import { toast } from 'sonner';

export default function SkillDefinitionManager({ agents, skills, onCreate, onUpdate, onDelete }) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [formData, setFormData] = useState({
        agent_name: '',
        skill_name: '',
        skill_category: 'other',
        proficiency_level: 50,
        description: '',
        certification_level: 'beginner'
    });

    const handleRequestVerification = async (skill) => {
        try {
            await base44.entities.SkillVerificationRequest.create({
                skill_id: skill.id,
                agent_name: skill.agent_name,
                skill_name: skill.skill_name,
                requested_by: skill.agent_name,
                request_type: 'self_request',
                justification: `Requesting verification for ${skill.skill_name}`,
                evidence: {
                    usage_count: skill.usage_count || 0,
                    success_rate: skill.success_rate || 0
                }
            });
            toast.success('Verification requested');
        } catch (error) {
            console.error('Failed to request verification:', error);
            toast.error('Failed to request verification');
        }
    };

    const handleOpenDialog = (skill = null) => {
        if (skill) {
            setEditingSkill(skill);
            setFormData(skill);
        } else {
            setEditingSkill(null);
            setFormData({
                agent_name: agents[0]?.name || '',
                skill_name: '',
                skill_category: 'other',
                proficiency_level: 50,
                description: '',
                certification_level: 'beginner'
            });
        }
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.agent_name || !formData.skill_name) return;

        if (editingSkill) {
            await onUpdate(editingSkill.id, formData);
        } else {
            await onCreate(formData);
        }
        setShowDialog(false);
    };

    const groupedSkills = skills.reduce((acc, skill) => {
        const agent = skill.agent_name;
        if (!acc[agent]) acc[agent] = [];
        acc[agent].push(skill);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                    Define and manage skills for all agents
                </p>
                <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                </Button>
            </div>

            {Object.entries(groupedSkills).map(([agentName, agentSkills]) => (
                <Card key={agentName}>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            {agentName}
                            <Badge variant="outline">{agentSkills.length} skills</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {agentSkills.map((skill) => (
                                <div key={skill.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold text-sm">{skill.skill_name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {skill.skill_category}
                                            </Badge>
                                            <Badge className={
                                                skill.certification_level === 'expert' ? 'bg-purple-100 text-purple-700' :
                                                skill.certification_level === 'advanced' ? 'bg-blue-100 text-blue-700' :
                                                skill.certification_level === 'intermediate' ? 'bg-green-100 text-green-700' :
                                                'bg-slate-100 text-slate-700'
                                            }>
                                                {skill.certification_level}
                                            </Badge>
                                            <SkillVerificationBadge 
                                                verified={skill.verified_by}
                                                verifiedBy={skill.verified_by}
                                            />
                                        </div>
                                        {skill.description && (
                                            <p className="text-xs text-slate-600">{skill.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-slate-500">Proficiency:</span>
                                            <div className="flex-1 max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                                    style={{ width: `${skill.proficiency_level || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold">{skill.proficiency_level || 0}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!skill.verified_by && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRequestVerification(skill)}
                                                className="text-blue-600"
                                            >
                                                <Shield className="h-4 w-4 mr-1" />
                                                Verify
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(skill)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(skill.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Skill Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Agent</Label>
                            <Select
                                value={formData.agent_name}
                                onValueChange={(value) => setFormData({ ...formData, agent_name: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map(agent => (
                                        <SelectItem key={agent.name} value={agent.name}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Skill Name</Label>
                            <Input
                                value={formData.skill_name}
                                onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                                placeholder="e.g., Python Programming, Market Research"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={formData.skill_category}
                                    onValueChange={(value) => setFormData({ ...formData, skill_category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="programming">Programming</SelectItem>
                                        <SelectItem value="data_analysis">Data Analysis</SelectItem>
                                        <SelectItem value="content_creation">Content Creation</SelectItem>
                                        <SelectItem value="research">Research</SelectItem>
                                        <SelectItem value="customer_support">Customer Support</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="sales">Sales</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="project_management">Project Management</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Certification Level</Label>
                                <Select
                                    value={formData.certification_level}
                                    onValueChange={(value) => setFormData({ ...formData, certification_level: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Proficiency Level: {formData.proficiency_level}%</Label>
                            <Slider
                                value={[formData.proficiency_level]}
                                onValueChange={(value) => setFormData({ ...formData, proficiency_level: value[0] })}
                                max={100}
                                step={1}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what this skill enables the agent to do..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                <Save className="h-4 w-4 mr-2" />
                                Save Skill
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}