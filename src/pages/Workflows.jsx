import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Sparkles, Workflow as WorkflowIcon } from 'lucide-react';
import WorkflowCard from '../components/workflows/WorkflowCard';
import WorkflowBuilder from '../components/workflows/WorkflowBuilder';
import VisualWorkflowBuilder from '../components/workflows/VisualWorkflowBuilder';
import WorkflowExecutionView from '../components/workflows/WorkflowExecutionView';
import WorkflowTemplates from '../components/workflows/WorkflowTemplates';
import TemplateConfigDialog from '../components/workflows/TemplateConfigDialog';
import AIWorkflowGenerator from '../components/workflows/AIWorkflowGenerator';
import WorkflowOptimizationAssistant from '../components/workflows/WorkflowOptimizationAssistant';
import PerformanceAnalysisEngine from '../components/workflows/PerformanceAnalysisEngine';
import { toast } from 'sonner';

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState([]);
    const [agents, setAgents] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [executingWorkflow, setExecutingWorkflow] = useState(null);
    const [currentExecution, setCurrentExecution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [workflowsList, agentsList, executionsList] = await Promise.all([
                base44.entities.Workflow.list('-updated_date'),
                base44.agents.listAgents(),
                base44.entities.WorkflowExecution.list('-updated_date', 50)
            ]);
            
            setWorkflows(workflowsList || []);
            setAgents(agentsList || []);
            setExecutions(executionsList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWorkflow = async (workflowData) => {
        try {
            if (editingWorkflow) {
                await base44.entities.Workflow.update(editingWorkflow.id, workflowData);
                toast.success('Workflow updated successfully');
            } else {
                await base44.entities.Workflow.create(workflowData);
                toast.success('Workflow created successfully');
            }
            await loadData();
            setShowBuilder(false);
            setEditingWorkflow(null);
        } catch (error) {
            console.error('Failed to save workflow:', error);
            toast.error('Failed to save workflow');
        }
    };

    const handleDeleteWorkflow = async (workflow) => {
        if (!confirm(`Delete workflow "${workflow.name}"?`)) return;
        
        try {
            await base44.entities.Workflow.delete(workflow.id);
            toast.success('Workflow deleted');
            await loadData();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
            toast.error('Failed to delete workflow');
        }
    };

    const handleExecuteWorkflow = async (workflow) => {
        const input = prompt(`Enter initial input for "${workflow.name}":`);
        if (!input) return;

        setExecutingWorkflow(workflow);
        
        try {
            const execution = await base44.entities.WorkflowExecution.create({
                workflow_id: workflow.id,
                workflow_name: workflow.name,
                initial_input: input,
                status: 'running',
                current_step: 0,
                step_results: []
            });

            setCurrentExecution(execution);
            toast.success('Workflow execution started');

            // Execute the workflow
            await executeWorkflowSteps(workflow, execution, input);
        } catch (error) {
            console.error('Failed to execute workflow:', error);
            toast.error('Failed to execute workflow');
            setExecutingWorkflow(null);
        }
    };

    const executeWorkflowSteps = async (workflow, execution, initialInput) => {
        let previousOutput = initialInput;

        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            
            try {
                // Update execution status
                await base44.entities.WorkflowExecution.update(execution.id, {
                    current_step: i,
                    status: 'running'
                });

                // Create conversation for this step
                const conversation = await base44.agents.createConversation({
                    agent_name: step.agent_name,
                    metadata: {
                        name: `${workflow.name} - ${step.step_name}`,
                        workflow_execution_id: execution.id,
                        step_index: i
                    }
                });

                // Build prompt for agent
                let prompt = '';
                if (i === 0) {
                    prompt = `${step.instructions || ''}\n\nInput: ${previousOutput}`;
                } else {
                    prompt = `${step.instructions || ''}\n\nPrevious agent output:\n${previousOutput}\n\nBuild upon this information and complete your part of the workflow.`;
                }

                // Send message to agent
                await base44.agents.addMessage(conversation, {
                    role: 'user',
                    content: prompt
                });

                // Wait for agent response (poll the conversation)
                const response = await waitForAgentResponse(conversation.id);
                previousOutput = response;

                // Update step result
                const stepResults = execution.step_results || [];
                stepResults.push({
                    step_index: i,
                    agent_name: step.agent_name,
                    conversation_id: conversation.id,
                    output: response,
                    status: 'completed',
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                });

                await base44.entities.WorkflowExecution.update(execution.id, {
                    step_results: stepResults
                });

                // Refresh execution data
                const updatedExecution = await base44.entities.WorkflowExecution.filter({ id: execution.id });
                setCurrentExecution(updatedExecution[0]);

            } catch (error) {
                console.error(`Step ${i} failed:`, error);
                await base44.entities.WorkflowExecution.update(execution.id, {
                    status: 'failed'
                });
                throw error;
            }
        }

        // Mark as completed
        await base44.entities.WorkflowExecution.update(execution.id, {
            status: 'completed',
            final_output: previousOutput
        });

        const finalExecution = await base44.entities.WorkflowExecution.filter({ id: execution.id });
        setCurrentExecution(finalExecution[0]);
        toast.success('Workflow completed successfully!');
        await loadData();
    };

    const waitForAgentResponse = async (conversationId, maxAttempts = 60) => {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const conversation = await base44.agents.getConversation(conversationId);
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
                return lastMessage.content;
            }
        }
        
        throw new Error('Agent response timeout');
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const recentExecutions = executions.slice(0, 10);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <WorkflowIcon className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading workflows...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Workflow Orchestration
                        </h1>
                        <p className="text-slate-600 mt-1">Design multi-agent workflows with seamless handoffs</p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingWorkflow(null);
                            setShowBuilder(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Workflow
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="ai-generator" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="ai-generator">
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Generator
                        </TabsTrigger>
                        <TabsTrigger value="templates">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Templates
                        </TabsTrigger>
                        <TabsTrigger value="workflows">
                            <WorkflowIcon className="h-4 w-4 mr-2" />
                            My Workflows
                        </TabsTrigger>
                        <TabsTrigger value="executions">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Executions
                        </TabsTrigger>
                    </TabsList>

                    {/* AI Generator Tab */}
                    <TabsContent value="ai-generator" className="space-y-6">
                        <AIWorkflowGenerator
                            agents={agents}
                            onWorkflowGenerated={async (workflow) => {
                                await handleSaveWorkflow(workflow);
                                toast.success('AI-generated workflow saved!');
                            }}
                        />
                    </TabsContent>

                    {/* Templates Tab */}
                    <TabsContent value="templates">
                        <WorkflowTemplates
                            agents={agents}
                            onUseTemplate={setSelectedTemplate}
                        />
                    </TabsContent>

                    {/* Workflows Tab */}
                    <TabsContent value="workflows" className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search workflows..."
                                className="pl-10 bg-white"
                            />
                        </div>

                        {/* AI Optimization & Performance */}
                        {filteredWorkflows.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <WorkflowOptimizationAssistant
                                    workflow={filteredWorkflows[0]}
                                    executions={executions.filter(e => e.workflow_id === filteredWorkflows[0].id)}
                                    onApplyOptimization={(suggestion) => {
                                        toast.info(`Optimization: ${suggestion.title}`);
                                    }}
                                />
                                <PerformanceAnalysisEngine
                                    workflow={filteredWorkflows[0]}
                                    executions={executions.filter(e => e.workflow_id === filteredWorkflows[0].id)}
                                    onProposedImprovement={(improvement) => {
                                        toast.success(`Improvement proposed: ${improvement.title}`);
                                    }}
                                />
                            </div>
                        )}

                        {/* Workflow Grid */}
                        {filteredWorkflows.length === 0 ? (
                            <div className="text-center py-12">
                                <WorkflowIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No workflows yet. Create your first workflow to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredWorkflows.map((workflow) => (
                                    <WorkflowCard
                                        key={workflow.id}
                                        workflow={workflow}
                                        onExecute={handleExecuteWorkflow}
                                        onEdit={(w) => {
                                            setEditingWorkflow(w);
                                            setShowBuilder(true);
                                        }}
                                        onDelete={handleDeleteWorkflow}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Executions Tab */}
                    <TabsContent value="executions" className="space-y-6">
                        {recentExecutions.length === 0 ? (
                            <div className="text-center py-12">
                                <Sparkles className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No executions yet. Run a workflow to see results here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentExecutions.map((exec) => (
                                    <div
                                        key={exec.id}
                                        onClick={() => {
                                            const wf = workflows.find(w => w.id === exec.workflow_id);
                                            setExecutingWorkflow(wf);
                                            setCurrentExecution(exec);
                                        }}
                                        className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800">{exec.workflow_name}</p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {exec.initial_input?.substring(0, 100)}...
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                exec.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                exec.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                                exec.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {exec.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Workflow Builder Dialog */}
            <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                        </DialogTitle>
                        </DialogHeader>
                        <VisualWorkflowBuilder
                        workflow={editingWorkflow}
                        agents={agents}
                        onSave={handleSaveWorkflow}
                        onCancel={() => {
                            setShowBuilder(false);
                            setEditingWorkflow(null);
                        }}
                        />
                </DialogContent>
            </Dialog>

            {/* Workflow Execution Dialog */}
            <Dialog open={!!executingWorkflow} onOpenChange={() => {
                setExecutingWorkflow(null);
                setCurrentExecution(null);
            }}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Workflow Execution</DialogTitle>
                    </DialogHeader>
                    {executingWorkflow && currentExecution && (
                        <WorkflowExecutionView
                            execution={currentExecution}
                            workflow={executingWorkflow}
                            onRefresh={async () => {
                                const updated = await base44.entities.WorkflowExecution.filter({ id: currentExecution.id });
                                if (updated && updated.length > 0) {
                                    setCurrentExecution(updated[0]);
                                }
                            }}
                            onRetry={async (stepIndexOrAll, params) => {
                                if (stepIndexOrAll === 'all') {
                                    await handleExecuteWorkflow(executingWorkflow);
                                } else {
                                    toast.info('Step retry functionality coming soon');
                                }
                            }}
                            onPause={async () => {
                                await base44.entities.WorkflowExecution.update(currentExecution.id, {
                                    status: 'paused'
                                });
                                const updated = await base44.entities.WorkflowExecution.filter({ id: currentExecution.id });
                                setCurrentExecution(updated[0]);
                            }}
                            onResume={async () => {
                                await base44.entities.WorkflowExecution.update(currentExecution.id, {
                                    status: 'running'
                                });
                                const updated = await base44.entities.WorkflowExecution.filter({ id: currentExecution.id });
                                setCurrentExecution(updated[0]);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Template Configuration Dialog */}
            <TemplateConfigDialog
                template={selectedTemplate}
                agents={agents}
                open={!!selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
                onCreate={async (workflowData) => {
                    await handleSaveWorkflow(workflowData);
                    setSelectedTemplate(null);
                }}
            />
        </div>
    );
}