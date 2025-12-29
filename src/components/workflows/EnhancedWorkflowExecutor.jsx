import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';

export async function executeWorkflow(workflow, initialInput, onProgress) {
    const execution = await base44.entities.WorkflowExecution.create({
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        initial_input: initialInput,
        status: 'running',
        current_step: 0,
        step_results: []
    });

    try {
        const result = await executeNode(workflow.nodes[0], workflow, execution, initialInput, {}, onProgress);
        
        await base44.entities.WorkflowExecution.update(execution.id, {
            status: 'completed',
            final_output: result
        });
        
        return result;
    } catch (error) {
        await base44.entities.WorkflowExecution.update(execution.id, {
            status: 'failed',
            error_message: error.message
        });
        throw error;
    }
}

async function executeNode(node, workflow, execution, input, context, onProgress) {
    onProgress?.({ nodeId: node.id, status: 'running', input });

    switch (node.type) {
        case 'agent':
            return await executeAgentNode(node, workflow, execution, input, context, onProgress);
        
        case 'condition':
            return await executeConditionNode(node, workflow, execution, input, context, onProgress);
        
        case 'parallel':
            return await executeParallelNode(node, workflow, execution, input, context, onProgress);
        
        case 'approval':
            return await executeApprovalNode(node, workflow, execution, input, context, onProgress);
        
        case 'end':
            return input;
        
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

async function executeAgentNode(node, workflow, execution, input, context, onProgress) {
    const { agent_name, instructions } = node.config;
    
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

    const response = await waitForAgentResponse(conversation.id);
    
    onProgress?.({ nodeId: node.id, status: 'completed', output: response });
    
    const nextNode = getNextNode(node, workflow, { success: true });
    if (nextNode) {
        return await executeNode(nextNode, workflow, execution, response, { ...context, [node.id]: response }, onProgress);
    }
    
    return response;
}

async function executeConditionNode(node, workflow, execution, input, context, onProgress) {
    const { condition_type, condition_value } = node.config;
    
    let conditionMet = false;
    
    if (condition_type === 'ai_decision') {
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Based on this data, determine: ${condition_value}
            
Data: ${JSON.stringify(input)}

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
    
    onProgress?.({ nodeId: node.id, status: 'completed', output: { conditionMet } });
    
    const nextNode = getNextNode(node, workflow, { conditionMet });
    if (nextNode) {
        return await executeNode(nextNode, workflow, execution, input, context, onProgress);
    }
    
    return input;
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