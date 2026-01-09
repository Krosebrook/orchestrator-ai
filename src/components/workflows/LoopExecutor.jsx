import { base44 } from "@/api/base44Client";

export async function executeLoop(loopNode, workflow, execution, input, context, executeNodeFn, onProgress) {
    const { loop_config } = loopNode.config;
    const {
        loop_type,
        max_iterations = 100,
        iteration_data_path,
        condition,
        break_on_error = true
    } = loop_config || {};

    const results = [];
    let iterationCount = 0;

    onProgress?.({ 
        nodeId: loopNode.id, 
        status: 'loop_start', 
        loopType: loop_type 
    });

    try {
        switch (loop_type) {
            case 'foreach':
                return await executeForeachLoop(
                    loopNode, workflow, input, context, iteration_data_path,
                    max_iterations, break_on_error, executeNodeFn, onProgress
                );
            
            case 'while':
                return await executeWhileLoop(
                    loopNode, workflow, input, context, condition,
                    max_iterations, break_on_error, executeNodeFn, onProgress
                );
            
            case 'until':
                return await executeUntilLoop(
                    loopNode, workflow, input, context, condition,
                    max_iterations, break_on_error, executeNodeFn, onProgress
                );
            
            case 'fixed_count':
                return await executeFixedCountLoop(
                    loopNode, workflow, input, context,
                    max_iterations, break_on_error, executeNodeFn, onProgress
                );
            
            default:
                throw new Error(`Unknown loop type: ${loop_type}`);
        }
    } catch (error) {
        onProgress?.({ 
            nodeId: loopNode.id, 
            status: 'loop_error', 
            error: error.message 
        });
        throw error;
    }
}

async function executeForeachLoop(loopNode, workflow, input, context, dataPath, maxIterations, breakOnError, executeNodeFn, onProgress) {
    // Extract array from input using path
    let items;
    if (dataPath) {
        items = getValueByPath(input, dataPath);
    } else if (Array.isArray(input)) {
        items = input;
    } else {
        throw new Error('Input is not an array and no iteration_data_path specified');
    }

    if (!Array.isArray(items)) {
        throw new Error(`Data at path ${dataPath} is not an array`);
    }

    const results = [];
    const limitedItems = items.slice(0, maxIterations);

    for (let i = 0; i < limitedItems.length; i++) {
        const item = limitedItems[i];
        
        onProgress?.({
            nodeId: loopNode.id,
            status: 'loop_iteration',
            iteration: i + 1,
            total: limitedItems.length,
            currentItem: item
        });

        try {
            const loopBody = getLoopBodyNode(loopNode, workflow);
            if (loopBody) {
                const result = await executeNodeFn(
                    loopBody, 
                    workflow, 
                    null,
                    item, 
                    { ...context, __loop_index: i, __loop_item: item },
                    onProgress
                );
                results.push(result);
            }
        } catch (error) {
            if (breakOnError) {
                throw new Error(`Loop iteration ${i + 1} failed: ${error.message}`);
            }
            results.push({ error: error.message, iteration: i + 1 });
        }
    }

    onProgress?.({ nodeId: loopNode.id, status: 'loop_complete', iterations: limitedItems.length });
    
    return {
        loop_results: results,
        total_iterations: limitedItems.length,
        original_input: input
    };
}

async function executeWhileLoop(loopNode, workflow, input, context, condition, maxIterations, breakOnError, executeNodeFn, onProgress) {
    const results = [];
    let iterationCount = 0;
    let currentInput = input;

    while (iterationCount < maxIterations) {
        const conditionMet = await evaluateCondition(condition, currentInput, context);
        
        if (!conditionMet) {
            break;
        }

        onProgress?.({
            nodeId: loopNode.id,
            status: 'loop_iteration',
            iteration: iterationCount + 1,
            conditionMet
        });

        try {
            const loopBody = getLoopBodyNode(loopNode, workflow);
            if (loopBody) {
                const result = await executeNodeFn(
                    loopBody,
                    workflow,
                    null,
                    currentInput,
                    { ...context, __loop_iteration: iterationCount },
                    onProgress
                );
                results.push(result);
                currentInput = result; // Update input for next iteration
            }
        } catch (error) {
            if (breakOnError) {
                throw new Error(`While loop iteration ${iterationCount + 1} failed: ${error.message}`);
            }
            results.push({ error: error.message, iteration: iterationCount + 1 });
            break;
        }

        iterationCount++;
    }

    onProgress?.({ nodeId: loopNode.id, status: 'loop_complete', iterations: iterationCount });

    return {
        loop_results: results,
        total_iterations: iterationCount,
        final_output: currentInput
    };
}

async function executeUntilLoop(loopNode, workflow, input, context, condition, maxIterations, breakOnError, executeNodeFn, onProgress) {
    const results = [];
    let iterationCount = 0;
    let currentInput = input;

    while (iterationCount < maxIterations) {
        onProgress?.({
            nodeId: loopNode.id,
            status: 'loop_iteration',
            iteration: iterationCount + 1
        });

        try {
            const loopBody = getLoopBodyNode(loopNode, workflow);
            if (loopBody) {
                const result = await executeNodeFn(
                    loopBody,
                    workflow,
                    null,
                    currentInput,
                    { ...context, __loop_iteration: iterationCount },
                    onProgress
                );
                results.push(result);
                currentInput = result;
            }
        } catch (error) {
            if (breakOnError) {
                throw new Error(`Until loop iteration ${iterationCount + 1} failed: ${error.message}`);
            }
            results.push({ error: error.message, iteration: iterationCount + 1 });
            break;
        }

        iterationCount++;

        // Check condition after execution
        const conditionMet = await evaluateCondition(condition, currentInput, context);
        if (conditionMet) {
            break;
        }
    }

    onProgress?.({ nodeId: loopNode.id, status: 'loop_complete', iterations: iterationCount });

    return {
        loop_results: results,
        total_iterations: iterationCount,
        final_output: currentInput
    };
}

async function executeFixedCountLoop(loopNode, workflow, input, context, maxIterations, breakOnError, executeNodeFn, onProgress) {
    const results = [];

    for (let i = 0; i < maxIterations; i++) {
        onProgress?.({
            nodeId: loopNode.id,
            status: 'loop_iteration',
            iteration: i + 1,
            total: maxIterations
        });

        try {
            const loopBody = getLoopBodyNode(loopNode, workflow);
            if (loopBody) {
                const result = await executeNodeFn(
                    loopBody,
                    workflow,
                    null,
                    input,
                    { ...context, __loop_iteration: i },
                    onProgress
                );
                results.push(result);
            }
        } catch (error) {
            if (breakOnError) {
                throw new Error(`Fixed count loop iteration ${i + 1} failed: ${error.message}`);
            }
            results.push({ error: error.message, iteration: i + 1 });
        }
    }

    onProgress?.({ nodeId: loopNode.id, status: 'loop_complete', iterations: maxIterations });

    return {
        loop_results: results,
        total_iterations: maxIterations
    };
}

function getLoopBodyNode(loopNode, workflow) {
    const loopEdges = workflow.edges.filter(e => e.source === loopNode.id && e.label === 'loop_body');
    if (loopEdges.length > 0) {
        return workflow.nodes.find(n => n.id === loopEdges[0].target);
    }
    return null;
}

async function evaluateCondition(condition, input, context) {
    if (!condition) return false;

    // Use AI to evaluate complex conditions
    const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Evaluate this condition:
${condition}

Current data: ${JSON.stringify(input)}
Context: ${JSON.stringify(context)}

Return true if condition is met, false otherwise.`,
        response_json_schema: {
            type: "object",
            properties: {
                result: { type: "boolean" },
                reasoning: { type: "string" }
            }
        }
    });

    return result.result;
}

function getValueByPath(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

export default { executeLoop };