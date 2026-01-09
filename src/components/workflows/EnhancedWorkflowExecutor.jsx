import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';
import { selectBestAgent, selectAgentWithAI } from './DynamicAgentSelector';
import { executeLoop } from './LoopExecutor';

export async function executeWorkflow(workflow, initialInput, onProgress) {
    const execution = await base44.entities.WorkflowExecution.create({
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        initial_input: initialInput,
        status: 'running',
        current_step: 0,
        step_results: [],
        context: { variables: workflow.variables || {} }
    });

    try {
        const result = await executeNode(workflow.nodes[0], workflow, execution, initialInput, { variables: workflow.variables || {} }, onProgress);
        
        await base44.entities.WorkflowExecution.update(execution.id, {
            status: 'completed',
            final_output: result
        });
        
        return result;
    } catch (error) {
        const errorHandling = workflow.error_handling || {};
        
        // Send notifications if configured
        if (errorHandling.notification_emails?.length > 0) {
            try {
                for (const email of errorHandling.notification_emails) {
                    await base44.integrations.Core.SendEmail({
                        to: email,
                        subject: `Workflow Failed: ${workflow.name}`,
                        body: `Workflow execution failed with error: ${error.message}\n\nWorkflow: ${workflow.name}\nExecution ID: ${execution.id}`
                    });
                }
            } catch (emailError) {
                console.error('Failed to send error notification:', emailError);
            }
        }
        
        await base44.entities.WorkflowExecution.update(execution.id, {
            status: 'failed',
            error_message: error.message
        });
        throw error;
    }
}

async function executeNode(node, workflow, execution, input, context, onProgress) {
    onProgress?.({ nodeId: node.id, status: 'running', input });

    const nodeErrorHandling = node.config?.error_handling || {};
    const globalErrorHandling = workflow.error_handling || {};
    const maxRetries = node.config?.max_retries || globalErrorHandling.max_retries || 3;
    const retryStrategy = node.config?.retry_strategy || 'exponential_backoff';
    
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                onProgress?.({ nodeId: node.id, status: 'retrying', attempt: attempt + 1, maxRetries });
                
                // Apply retry delay based on strategy
                const delay = getRetryDelay(retryStrategy, attempt, globalErrorHandling.retry_delay);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

            let result;
            switch (node.type) {
                case 'agent':
                    result = await executeAgentNode(node, workflow, execution, input, context, onProgress);
                    break;
                
                case 'condition':
                    result = await executeConditionNode(node, workflow, execution, input, context, onProgress);
                    break;
                
                case 'parallel':
                    result = await executeParallelNode(node, workflow, execution, input, context, onProgress);
                    break;
                
                case 'approval':
                    result = await executeApprovalNode(node, workflow, execution, input, context, onProgress);
                    break;
                
                case 'loop':
                    result = await executeLoop(node, workflow, execution, input, context, executeNode, onProgress);
                    break;
                
                case 'end':
                    result = input;
                    break;
                
                default:
                    throw new Error(`Unknown node type: ${node.type}`);
            }
            
            return result;
            
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries - 1) {
                // Last attempt failed - handle based on error handling config
                return await handleNodeError(node, workflow, execution, input, context, error, onProgress);
            }
        }
    }
    
    throw lastError;
}

function getRetryDelay(strategy, attempt, baseDelay = 5) {
    switch (strategy) {
        case 'exponential_backoff':
            return baseDelay * Math.pow(2, attempt);
        case 'fixed_delay':
            return baseDelay;
        case 'immediate':
            return 0;
        default:
            return baseDelay;
    }
}

async function handleNodeError(node, workflow, execution, input, context, error, onProgress) {
    const nodeErrorHandling = node.config?.error_handling || {};
    const globalErrorHandling = workflow.error_handling || {};
    
    onProgress?.({ nodeId: node.id, status: 'error_handling', error: error.message });
    
    const errorStrategy = nodeErrorHandling.on_error || globalErrorHandling.fallback_strategy || 'fail';
    
    switch (errorStrategy) {
        case 'skip':
            onProgress?.({ nodeId: node.id, status: 'skipped', error: error.message });
            // Continue to next node
            const nextNode = getNextNode(node, workflow, { success: false, error: true });
            if (nextNode) {
                return await executeNode(nextNode, workflow, execution, input, context, onProgress);
            }
            return input;
        
        case 'fallback':
            // Try fallback agent if configured
            if (node.config?.fallback_agents?.length > 0) {
                const fallbackAgent = node.config.fallback_agents[0];
                onProgress?.({ nodeId: node.id, status: 'using_fallback', fallbackAgent });
                
                const fallbackNode = { 
                    ...node, 
                    config: { ...node.config, agent_name: fallbackAgent, max_retries: 1 } 
                };
                try {
                    return await executeAgentNode(fallbackNode, workflow, execution, input, context, onProgress);
                } catch (fallbackError) {
                    throw new Error(`Primary and fallback agents failed: ${error.message}, ${fallbackError.message}`);
                }
            }
            
            // Or go to fallback node if configured
            if (nodeErrorHandling.fallback_node_id) {
                const fallbackNode = workflow.nodes.find(n => n.id === nodeErrorHandling.fallback_node_id);
                if (fallbackNode) {
                    return await executeNode(fallbackNode, workflow, execution, input, context, onProgress);
                }
            }
            
            throw error;
        
        case 'continue':
            onProgress?.({ nodeId: node.id, status: 'error_continue', error: error.message });
            // Continue with error data in context
            const nextContinueNode = getNextNode(node, workflow, { success: false, error: true });
            if (nextContinueNode) {
                return await executeNode(
                    nextContinueNode, 
                    workflow, 
                    execution, 
                    input, 
                    { ...context, __last_error: error.message }, 
                    onProgress
                );
            }
            return { error: error.message, input };
        
        case 'fail':
        default:
            throw error;
    }
}

async function executeAgentNode(node, workflow, execution, input, context, onProgress) {
    let { agent_name, instructions, dynamic_selection, selection_criteria } = node.config;
    
    // Dynamic agent selection if enabled
    if (dynamic_selection) {
        onProgress?.({ nodeId: node.id, status: 'selecting_agent' });
        
        const agents = await base44.agents.listAgents();
        
        let selectedInfo;
        if (selection_criteria?.required_skills?.length > 0 || selection_criteria?.workload_threshold) {
            // Criteria-based selection
            selectedInfo = await selectBestAgent({
                ...selection_criteria,
                task_description: instructions
            }, agents);
        } else {
            // AI-based selection
            selectedInfo = await selectAgentWithAI(instructions || 'Process this task', agents);
        }
        
        if (selectedInfo?.agent) {
            agent_name = selectedInfo.agent.name;
            onProgress?.({ 
                nodeId: node.id, 
                status: 'agent_selected', 
                agent: agent_name,
                reasoning: selectedInfo.reasoning 
            });
        } else {
            throw new Error('No suitable agent found for dynamic selection');
        }
    }
    
    if (!agent_name) {
        throw new Error('No agent specified for agent node');
    }
    
    // Check timeout
    const timeout = node.config?.timeout_seconds || 300;
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Agent execution timeout after ${timeout}s`)), timeout * 1000)
    );
    
    const executionPromise = (async () => {
        const conversation = await base44.agents.createConversation({
            agent_name,
            metadata: {
                name: `${workflow.name} - ${node.label}`,
                workflow_execution_id: execution.id,
                node_id: node.id
            }
        });

        const prompt = instructions 
            ? `${instructions}\n\nInput: ${JSON.stringify(input)}\n\nContext: ${JSON.stringify(context)}`
            : JSON.stringify(input);

        await base44.agents.addMessage(conversation, {
            role: 'user',
            content: prompt
        });

        return await waitForAgentResponse(conversation.id);
    })();
    
    const response = await Promise.race([executionPromise, timeoutPromise]);
    
    onProgress?.({ nodeId: node.id, status: 'completed', output: response, agent: agent_name });
    
    const nextNode = getNextNode(node, workflow, { success: true });
    if (nextNode) {
        return await executeNode(nextNode, workflow, execution, response, { ...context, [node.id]: response }, onProgress);
    }
    
    return response;
}

async function executeConditionNode(node, workflow, execution, input, context, onProgress) {
    const { conditions } = node.config;
    
    let conditionMet = false;
    
    if (!conditions || conditions.length === 0) {
        // Fallback to old behavior if no conditions configured
        const { condition_type, condition_value } = node.config;
        
        if (condition_type === 'ai_decision') {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Based on this data, determine: ${condition_value}
                
Data: ${JSON.stringify(input)}
Context: ${JSON.stringify(context)}

Return true or false.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        decision: { type: "boolean" },
                        reason: { type: "string" }
                    }
                }
            });
            conditionMet = result.decision;
        } else if (condition_type === 'contains') {
            conditionMet = JSON.stringify(input).toLowerCase().includes(condition_value.toLowerCase());
        }
    } else {
        // Evaluate complex conditions
        conditionMet = await evaluateConditions(conditions, input, context);
    }
    
    onProgress?.({ nodeId: node.id, status: 'completed', output: { conditionMet } });
    
    const nextNode = getNextNode(node, workflow, { conditionMet });
    if (nextNode) {
        return await executeNode(nextNode, workflow, execution, input, context, onProgress);
    }
    
    return input;
}

async function evaluateConditions(conditions, input, context) {
    let result = true;
    let currentLogic = 'AND';
    
    for (const condition of conditions) {
        const conditionResult = await evaluateSingleCondition(condition, input, context);
        
        if (currentLogic === 'AND') {
            result = result && conditionResult;
        } else if (currentLogic === 'OR') {
            result = result || conditionResult;
        }
        
        currentLogic = condition.logic || 'AND';
        
        // Short-circuit evaluation
        if (!result && currentLogic === 'AND') {
            break;
        }
        if (result && currentLogic === 'OR') {
            break;
        }
    }
    
    return result;
}

async function evaluateSingleCondition(condition, input, context) {
    const { field, operator, value } = condition;
    
    // Get the field value from input or context
    const fieldValue = getValueByPath(input, field) || getValueByPath(context, field);
    
    switch (operator) {
        case 'equals':
            return fieldValue == value;
        case 'not_equals':
            return fieldValue != value;
        case 'contains':
            return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'greater_than':
            return Number(fieldValue) > Number(value);
        case 'less_than':
            return Number(fieldValue) < Number(value);
        case 'exists':
            return fieldValue !== undefined && fieldValue !== null;
        case 'is_empty':
            return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
        default:
            // Use AI for complex conditions
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Evaluate: "${field} ${operator} ${value}"
                
Field value: ${JSON.stringify(fieldValue)}
Input: ${JSON.stringify(input)}

Return true or false.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        result: { type: "boolean" }
                    }
                }
            });
            return result.result;
    }
}

function getValueByPath(obj, path) {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

async function executeParallelNode(node, workflow, execution, input, context, onProgress) {
    const parallelBranches = workflow.edges.filter(e => e.source === node.id);
    const branchNodes = parallelBranches.map(e => workflow.nodes.find(n => n.id === e.target));
    
    const results = await Promise.all(
        branchNodes.map(branchNode => 
            executeNode(branchNode, workflow, execution, input, context, onProgress)
        )
    );
    
    const combinedResult = results.join('\n\n---\n\n');
    
    onProgress?.({ nodeId: node.id, status: 'completed', output: combinedResult });
    
    return combinedResult;
}

async function executeApprovalNode(node, workflow, execution, input, context, onProgress) {
    onProgress?.({ nodeId: node.id, status: 'waiting_approval', output: input });
    
    const approval = await base44.entities.WorkflowApproval.create({
        workflow_execution_id: execution.id,
        workflow_name: workflow.name,
        step_index: node.id,
        approval_type: node.config.approval_type || 'continue',
        context: context,
        data_to_review: input,
        status: 'pending'
    });
    
    // Wait for approval
    const approvedData = await waitForApproval(approval.id);
    
    onProgress?.({ nodeId: node.id, status: 'approved', output: approvedData });
    
    const nextNode = getNextNode(node, workflow, { approved: true });
    if (nextNode) {
        return await executeNode(nextNode, workflow, execution, approvedData || input, context, onProgress);
    }
    
    return approvedData || input;
}

function getNextNode(currentNode, workflow, decision) {
    const outgoingEdges = workflow.edges.filter(e => e.source === currentNode.id);
    
    if (currentNode.type === 'condition') {
        const edge = outgoingEdges.find(e => 
            (decision.conditionMet && e.condition === 'true') ||
            (!decision.conditionMet && e.condition === 'false')
        );
        return edge ? workflow.nodes.find(n => n.id === edge.target) : null;
    }
    
    if (outgoingEdges.length > 0) {
        return workflow.nodes.find(n => n.id === outgoingEdges[0].target);
    }
    
    return null;
}

async function waitForAgentResponse(conversationId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const conversation = await base44.agents.getConversation(conversationId);
        const lastMessage = conversation.messages?.[conversation.messages.length - 1];
        
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
            return lastMessage.content;
        }
    }
    
    throw new Error('Agent response timeout');
}

async function waitForApproval(approvalId, maxAttempts = 300) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const approvals = await base44.entities.WorkflowApproval.filter({ id: approvalId });
        const approval = approvals[0];
        
        if (approval && approval.status === 'approved') {
            return approval.data_to_review;
        } else if (approval && approval.status === 'rejected') {
            throw new Error('Workflow approval rejected');
        }
    }
    
    throw new Error('Approval timeout');
}

export default { executeWorkflow };