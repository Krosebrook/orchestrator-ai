import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus, Settings, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import AutomationRuleEditor from './AutomationRuleEditor';

export default function AutomationRuleManager({ agents }) {
    const [rules, setRules] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [showEditor, setShowEditor] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [rulesList, executionsList] = await Promise.all([
                base44.entities.AutomationRule.list('-updated_date'),
                base44.entities.AutomationExecution.list('-created_date', 50)
            ]);
            setRules(rulesList || []);
            setExecutions(executionsList || []);
        } catch (error) {
            console.error('Failed to load automation data:', error);
        }
    };

    const handleToggleRule = async (rule) => {
        try {
            await base44.entities.AutomationRule.update(rule.id, {
                is_active: !rule.is_active
            });
            toast.success(`Automation ${rule.is_active ? 'disabled' : 'enabled'}`);
            await loadData();
        } catch (error) {
            toast.error('Failed to toggle automation');
        }
    };

    const handleSaveRule = async (ruleData) => {
        try {
            if (editingRule) {
                await base44.entities.AutomationRule.update(editingRule.id, ruleData);
                toast.success('Rule updated');
            } else {
                await base44.entities.AutomationRule.create(ruleData);
                toast.success('Rule created');
            }
            await loadData();
            setShowEditor(false);
            setEditingRule(null);
        } catch (error) {
            toast.error('Failed to save rule');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-600" />
                                AI-Driven Automation
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Automate repetitive tasks with intelligent triggers
                            </p>
                        </div>
                        <Button onClick={() => { setEditingRule(null); setShowEditor(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Rule
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                {rules.map(rule => {
                    const ruleExecutions = executions.filter(e => e.rule_id === rule.id);
                    const successRate = ruleExecutions.length > 0
                        ? (ruleExecutions.filter(e => e.status === 'completed').length / ruleExecutions.length * 100).toFixed(0)
                        : 0;

                    return (
                        <Card key={rule.id} className={rule.is_active ? 'border-2' : 'opacity-60'}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">{rule.name}</h3>
                                            <Badge variant="outline">{rule.trigger_type}</Badge>
                                            <Badge className="bg-purple-100 text-purple-700">
                                                {rule.action_type}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">
                                            Agent: {rule.agent_name}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={rule.is_active}
                                        onCheckedChange={() => handleToggleRule(rule)}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-slate-50 p-2 rounded text-center">
                                        <p className="text-xs text-slate-600">Executions</p>
                                        <p className="font-semibold">{rule.execution_count || 0}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded text-center">
                                        <p className="text-xs text-slate-600">Success Rate</p>
                                        <p className="font-semibold text-green-600">{successRate}%</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded text-center">
                                        <p className="text-xs text-slate-600">Last Run</p>
                                        <p className="text-xs">{rule.last_executed ? new Date(rule.last_executed).toLocaleTimeString() : 'Never'}</p>
                                    </div>
                                </div>

                                <Button size="sm" variant="outline" onClick={() => { setEditingRule(rule); setShowEditor(true); }}>
                                    <Settings className="h-3 w-3 mr-1" />
                                    Configure
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AutomationRuleEditor
                open={showEditor}
                onClose={() => { setShowEditor(false); setEditingRule(null); }}
                rule={editingRule}
                agents={agents}
                onSave={handleSaveRule}
            />
        </div>
    );
}