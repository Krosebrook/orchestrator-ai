import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    Bot, GitBranch, GitMerge, UserCheck, Flag, 
    Save, Settings, ArrowRight, Zap, X, RefreshCw
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import ActionConfigDialog from './ActionConfigDialog';
import ConditionalLogicEditor from './ConditionalLogicEditor';
import LoopConfigEditor from './LoopConfigEditor';
import WorkflowAIAssistant from './WorkflowAIAssistant';

const NODE_TYPES = [
    { id: 'agent', name: 'Agent Task', icon: Bot, color: 'from-blue-500 to-cyan-500' },
    { id: 'condition', name: 'Conditional Branch', icon: GitBranch, color: 'from-yellow-500 to-orange-500' },
    { id: 'parallel', name: 'Parallel Execution', icon: GitMerge, color: 'from-purple-500 to-pink-500' },
    { id: 'loop', name: 'Loop', icon: Zap, color: 'from-indigo-500 to-purple-500' },
    { id: 'approval', name: 'Human Approval', icon: UserCheck, color: 'from-green-500 to-emerald-500' },
    { id: 'end', name: 'End', icon: Flag, color: 'from-red-500 to-rose-500' }
];

export default function VisualWorkflowBuilder({ workflow, agents, onSave, onCancel }) {
    const [name, setName] = useState(workflow?.name || '');
    const [description, setDescription] = useState(workflow?.description || '');
    const [category, setCategory] = useState(workflow?.category || 'custom');
    const [nodes, setNodes] = useState(workflow?.nodes || []);
    const [edges, setEdges] = useState(workflow?.edges || []);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [showConditionDialog, setShowConditionDialog] = useState(false);
    const [showLoopDialog, setShowLoopDialog] = useState(false);
    const [errorHandling, setErrorHandling] = useState(workflow?.error_handling || {
        max_retries: 3,
        retry_delay: 5,
        fallback_strategy: 'stop',
        notification_emails: []
    });

    const addNode = (type) => {
        const newNode = {
            id: `node-${Date.now()}`,
            type,
            label: `${NODE_TYPES.find(t => t.id === type)?.name} ${nodes.length + 1}`,
            position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
            config: getDefaultConfig(type)
        };
        setNodes([...nodes, newNode]);
    };

    const getDefaultConfig = (type) => {
        switch (type) {
            case 'agent':
                return { 
                    agent_name: '', 
                    instructions: '', 
                    max_retries: 3,
                    retry_strategy: 'exponential_backoff',
                    timeout_seconds: 300,
                    dynamic_selection: false,
                    selection_criteria: {},
                    fallback_agents: []
                };
            case 'condition':
                return { condition_prompt: '', true_label: 'Yes', false_label: 'No', conditions: [] };
            case 'parallel':
                return { branches: [] };
            case 'loop':
                return { 
                    loop_config: {
                        loop_type: 'foreach',
                        max_iterations: 100,
                        break_on_error: true
                    }
                };
            case 'approval':
                return { approvers: [], message: '', timeout_hours: 24 };
            case 'end':
                return {};
            default:
                return {};
        }
    };

    const updateNode = (nodeId, updates) => {
        setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
    };

    const deleteNode = (nodeId) => {
        setNodes(nodes.filter(n => n.id !== nodeId));
        setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
        if (selectedNode?.id === nodeId) setSelectedNode(null);
    };

    const addEdge = (source, target, condition = null) => {
        const newEdge = {
            id: `edge-${Date.now()}`,
            source,
            target,
            condition
        };
        setEdges([...edges, newEdge]);
    };

    const deleteEdge = (edgeId) => {
        setEdges(edges.filter(e => e.id !== edgeId));
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Please enter a workflow name');
            return;
        }
        if (nodes.length === 0) {
            alert('Please add at least one node to the workflow');
            return;
        }

        onSave({
            name,
            description,
            category,
            nodes,
            edges,
            error_handling: errorHandling,
            status: workflow?.status || 'draft'
        });
    };

    const handleAISuggestion = (suggestion) => {
        const { suggestion_type, action } = suggestion;
        
        switch (suggestion_type) {
            case 'add_node':
                if (action.node) {
                    setNodes([...nodes, { ...action.node, id: `node-${Date.now()}` }]);
                }
                break;
            case 'modify_node':
                if (action.node_id && action.updates) {
                    updateNode(action.node_id, action.updates);
                }
                break;
            case 'add_connection':
                if (action.source && action.target) {
                    addEdge(action.source, action.target, action.condition);
                }
                break;
        }
    };

    const NodeCard = ({ node }) => {
        const nodeType = NODE_TYPES.find(t => t.id === node.type);
        const Icon = nodeType?.icon || Bot;
        const isSelected = selectedNode?.id === node.id;
        const outgoingEdges = edges.filter(e => e.source === node.id);

        return (
            <div className="relative">
                <Card
                    onClick={() => setSelectedNode(node)}
                    className={cn(
                        "cursor-pointer transition-all border-2",
                        isSelected ? "border-blue-500 shadow-lg" : "border-slate-200 hover:border-slate-300"
                    )}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                nodeType?.color
                            )}>
                                <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{node.label}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                    {nodeType?.name}
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNode(node.id);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {outgoingEdges.map(edge => (
                    <div key={edge.id} className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        {edge.condition && (
                            <Badge variant="outline" className="text-xs">{edge.condition}</Badge>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const NodeConfigPanel = ({ node }) => {
        if (!node) return null;

        return (
            <div className="space-y-4">
                <div>
                    <Label>Node Label</Label>
                    <Input
                        value={node.label}
                        onChange={(e) => updateNode(node.id, { label: e.target.value })}
                    />
                </div>

                {node.type === 'agent' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Dynamic Agent Selection</Label>
                                <p className="text-xs text-slate-500">Select agent based on task requirements</p>
                            </div>
                            <Switch
                                checked={node.config.dynamic_selection || false}
                                onCheckedChange={(checked) => updateNode(node.id, {
                                    config: { ...node.config, dynamic_selection: checked }
                                })}
                            />
                        </div>
                        
                        {!node.config.dynamic_selection && (
                            <div>
                                <Label>Agent</Label>
                                <Select
                                    value={node.config.agent_name}
                                    onValueChange={(value) => updateNode(node.id, {
                                        config: { ...node.config, agent_name: value }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select agent" />
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
                        )}
                        
                        <div>
                            <Label>Instructions</Label>
                            <Textarea
                                value={node.config.instructions || ''}
                                onChange={(e) => updateNode(node.id, {
                                    config: { ...node.config, instructions: e.target.value }
                                })}
                                rows={3}
                            />
                        </div>
                        
                        <div>
                            <Label>Retry Strategy</Label>
                            <Select
                                value={node.config.retry_strategy || 'exponential_backoff'}
                                onValueChange={(value) => updateNode(node.id, {
                                    config: { ...node.config, retry_strategy: value }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exponential_backoff">Exponential Backoff</SelectItem>
                                    <SelectItem value="fixed_delay">Fixed Delay</SelectItem>
                                    <SelectItem value="immediate">Immediate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Max Retries</Label>
                                <Input
                                    type="number"
                                    value={node.config.max_retries || 3}
                                    onChange={(e) => updateNode(node.id, {
                                        config: { ...node.config, max_retries: parseInt(e.target.value) }
                                    })}
                                />
                            </div>
                            <div>
                                <Label>Timeout (sec)</Label>
                                <Input
                                    type="number"
                                    value={node.config.timeout_seconds || 300}
                                    onChange={(e) => updateNode(node.id, {
                                        config: { ...node.config, timeout_seconds: parseInt(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedNode(node);
                                    setShowActionDialog(true);
                                }}
                                className="w-full"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Configure Actions ({node.config.actions?.length || 0})
                            </Button>
                        </div>
                    </>
                )}

                {node.type === 'condition' && (
                    <>
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedNode(node);
                                    setShowConditionDialog(true);
                                }}
                                className="w-full"
                            >
                                <GitBranch className="h-4 w-4 mr-2" />
                                Configure Conditions ({node.config.conditions?.length || 0})
                            </Button>
                        </div>
                        {node.config.conditions?.length > 0 && (
                            <div className="text-xs bg-blue-50 p-3 rounded">
                                <p className="font-semibold text-blue-700 mb-1">Active Conditions:</p>
                                {node.config.conditions.map((cond, idx) => (
                                    <p key={idx} className="text-blue-600">
                                        {cond.field} {cond.operator} {cond.value}
                                    </p>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {node.type === 'loop' && (
                    <>
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedNode(node);
                                    setShowLoopDialog(true);
                                }}
                                className="w-full"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Configure Loop
                            </Button>
                        </div>
                        {node.config.loop_config && (
                            <div className="text-xs bg-indigo-50 p-3 rounded">
                                <p className="font-semibold text-indigo-700">Loop Type: {node.config.loop_config.loop_type}</p>
                                <p className="text-indigo-600">Max Iterations: {node.config.loop_config.max_iterations}</p>
                            </div>
                        )}
                    </>
                )}

                {node.type === 'approval' && (
                    <>
                        <div>
                            <Label>Approval Message</Label>
                            <Textarea
                                value={node.config.message || ''}
                                onChange={(e) => updateNode(node.id, {
                                    config: { ...node.config, message: e.target.value }
                                })}
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Timeout (hours)</Label>
                            <Input
                                type="number"
                                value={node.config.timeout_hours || 24}
                                onChange={(e) => updateNode(node.id, {
                                    config: { ...node.config, timeout_hours: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </>
                )}

                <div className="pt-4 border-t">
                    <Label className="mb-2 block">Connect to Next Node</Label>
                    <Select
                        onValueChange={(targetId) => {
                            if (targetId && targetId !== node.id) {
                                addEdge(node.id, targetId);
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select next node" />
                        </SelectTrigger>
                        <SelectContent>
                            {nodes.filter(n => n.id !== node.id).map(n => (
                                <SelectItem key={n.id} value={n.id}>
                                    {n.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Workflow Details */}
            <div className="space-y-4">
                <div>
                    <Label>Workflow Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Workflow"
                    />
                </div>
                <div>
                    <Label>Description</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>
                <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="research">Research</SelectItem>
                            <SelectItem value="content_creation">Content Creation</SelectItem>
                            <SelectItem value="data_analysis">Data Analysis</SelectItem>
                            <SelectItem value="task_automation">Task Automation</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Node Palette */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Add Nodes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {NODE_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <Button
                                    key={type.id}
                                    variant="outline"
                                    className="flex flex-col h-auto py-3"
                                    onClick={() => addNode(type.id)}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                                        type.color
                                    )}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-xs">{type.name}</span>
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Nodes Display */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Workflow Canvas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {nodes.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Zap className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                    <p>Add nodes to build your workflow</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {nodes.map(node => (
                                        <NodeCard key={node.id} node={node} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Node Configuration */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                {selectedNode ? 'Node Settings' : 'Select a Node'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedNode ? (
                                <NodeConfigPanel node={selectedNode} />
                            ) : (
                                <p className="text-sm text-slate-500">
                                    Click on a node to configure it
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Error Handling */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Error Handling</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Max Retries</Label>
                            <Input
                                type="number"
                                value={errorHandling.max_retries}
                                onChange={(e) => setErrorHandling({
                                    ...errorHandling,
                                    max_retries: parseInt(e.target.value)
                                })}
                            />
                        </div>
                        <div>
                            <Label>Retry Delay (seconds)</Label>
                            <Input
                                type="number"
                                value={errorHandling.retry_delay}
                                onChange={(e) => setErrorHandling({
                                    ...errorHandling,
                                    retry_delay: parseInt(e.target.value)
                                })}
                            />
                        </div>
                        <div>
                            <Label>Fallback Strategy</Label>
                            <Select
                                value={errorHandling.fallback_strategy}
                                onValueChange={(value) => setErrorHandling({
                                    ...errorHandling,
                                    fallback_strategy: value
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stop">Stop Workflow</SelectItem>
                                    <SelectItem value="continue">Continue</SelectItem>
                                    <SelectItem value="fallback_agent">Use Fallback Agent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Save className="h-4 w-4 mr-2" />
                    Save Workflow
                </Button>
            </div>

            {/* Action Configuration Dialog */}
            <ActionConfigDialog
                open={showActionDialog}
                onClose={() => setShowActionDialog(false)}
                node={selectedNode}
                onSave={(updatedNode) => {
                    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
                    setShowActionDialog(false);
                }}
                entities={['Lead', 'Ticket', 'Task', 'Campaign', 'ContentPiece']}
            />

            {/* Conditional Logic Editor */}
            <ConditionalLogicEditor
                open={showConditionDialog}
                onClose={() => setShowConditionDialog(false)}
                node={selectedNode}
                onSave={(updatedNode) => {
                    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
                    setShowConditionDialog(false);
                }}
            />

            {/* Loop Config Editor */}
            <LoopConfigEditor
                open={showLoopDialog}
                onClose={() => setShowLoopDialog(false)}
                node={selectedNode}
                onSave={(updatedNode) => {
                    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
                    setShowLoopDialog(false);
                }}
            />

            {/* AI Assistant */}
            <WorkflowAIAssistant
                currentWorkflow={{ name, description, category, nodes, edges }}
                agents={agents}
                onApplySuggestion={handleAISuggestion}
            />
        </div>
    );
}