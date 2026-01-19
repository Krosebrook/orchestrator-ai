import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIWorkflowGenerator({ agents, onWorkflowGenerated }) {
    const [description, setDescription] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedWorkflow, setGeneratedWorkflow] = useState(null);

    const generateWorkflow = async () => {
        if (!description.trim()) {
            toast.error('Please describe your workflow goal');
            return;
        }

        setGenerating(true);
        try {
            const agentList = agents.map(a => `${a.name}: ${a.description}`).join('\n');
            
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a workflow automation expert. Based on the user's goal, create a detailed workflow structure.

Available Agents:
${agentList}

User Goal: ${description}

Generate a workflow that achieves this goal. Return a JSON workflow structure with:
1. name: Clear workflow name
2. description: What this workflow does
3. nodes: Array of workflow nodes with:
   - id: unique identifier (e.g., "node-1", "node-2")
   - type: "agent", "condition", "parallel", "loop", "approval", or "end"
   - label: descriptive node name
   - position: {x: number, y: number} (arrange vertically, y spacing 150px, x centered at 250)
   - config: 
     * For agent nodes: { agent_name, instructions, max_retries: 3, timeout_seconds: 300, dynamic_selection: false }
     * For condition nodes: { conditions: [], true_label: "Yes", false_label: "No" }
     * For loop nodes: { loop_config: { loop_type: "foreach", max_iterations: 100 } }
     * For approval nodes: { message, timeout_hours: 24 }
4. edges: Array of connections with:
   - id: unique identifier
   - source: source node id
   - target: target node id
   - condition: (optional) "true" or "false" for conditional branches
5. category: "research", "content_creation", "data_analysis", "task_automation", or "custom"
6. tags: Array of relevant tags

Make the workflow practical, efficient, with proper error handling and use the most appropriate agents.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        nodes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    type: { type: "string" },
                                    label: { type: "string" },
                                    position: { type: "object" },
                                    config: { type: "object" }
                                }
                            }
                        },
                        edges: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    source: { type: "string" },
                                    target: { type: "string" }
                                }
                            }
                        },
                        category: { type: "string" },
                        tags: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setGeneratedWorkflow(result);
            toast.success('Workflow generated successfully!');
        } catch (error) {
            console.error('Failed to generate workflow:', error);
            toast.error('Failed to generate workflow');
        } finally {
            setGenerating(false);
        }
    };

    const saveWorkflow = async () => {
        if (generatedWorkflow) {
            await onWorkflowGenerated(generatedWorkflow);
            setDescription('');
            setGeneratedWorkflow(null);
        }
    };

    return (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Workflow Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Describe Your Goal</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., I need to analyze customer feedback, identify trends, and generate a summary report..."
                        rows={4}
                        disabled={generating}
                    />
                </div>

                {generatedWorkflow && (
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold">{generatedWorkflow.name}</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{generatedWorkflow.description}</p>
                        <div className="flex gap-2 text-xs text-slate-500">
                            <span>{generatedWorkflow.nodes?.length || 0} steps</span>
                            <span>•</span>
                            <span>{generatedWorkflow.category}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    {!generatedWorkflow ? (
                        <Button
                            onClick={generateWorkflow}
                            disabled={generating || !description.trim()}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Workflow
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setGeneratedWorkflow(null);
                                    setDescription('');
                                }}
                                className="flex-1"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={saveWorkflow}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                Save Workflow
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}