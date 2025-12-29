import { useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';

export function useAutomationEngine() {
    useEffect(() => {
        const interval = setInterval(processAutomations, 15000);
        return () => clearInterval(interval);
    }, []);

    const processAutomations = async () => {
        try {
            const rules = await base44.entities.AutomationRule.filter({ is_active: true });
            
            for (const rule of rules) {
                await executeAutomation(rule);
            }
        } catch (error) {
            console.error('Automation processing failed:', error);
        }
    };

    const executeAutomation = async (rule) => {
        const startTime = Date.now();
        
        try {
            let result = null;

            if (rule.trigger_type === 'new_query') {
                const queries = await base44.entities.KnowledgeQuery.filter(
                    { results_found: false },
                    '-created_date',
                    5
                );

                for (const query of queries) {
                    if (rule.action_type === 'categorize') {
                        result = await categorizeQuery(query, rule);
                    } else if (rule.action_type === 'draft_response') {
                        result = await draftResponse(query, rule);
                    }
                }
            } else if (rule.trigger_type === 'workflow_start') {
                const executions = await base44.entities.WorkflowExecution.filter(
                    { status: 'running' },
                    '-created_date',
                    5
                );

                for (const execution of executions) {
                    if (rule.action_type === 'validate') {
                        result = await validateWorkflowData(execution, rule);
                    }
                }
            }

            if (result) {
                await base44.entities.AutomationExecution.create({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    trigger_data: result.trigger,
                    status: 'completed',
                    result: result.data,
                    execution_time_ms: Date.now() - startTime
                });

                await base44.entities.AutomationRule.update(rule.id, {
                    execution_count: (rule.execution_count || 0) + 1,
                    last_executed: new Date().toISOString()
                });
            }
        } catch (error) {
            await base44.entities.AutomationExecution.create({
                rule_id: rule.id,
                rule_name: rule.name,
                status: 'failed',
                error_message: error.message,
                execution_time_ms: Date.now() - startTime
            });
        }
    };

    const categorizeQuery = async (query, rule) => {
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Categorize this query: "${query.query}"
            
Categories: support, billing, technical, feature_request, other

Return the most appropriate category and confidence score.`,
            response_json_schema: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    confidence: { type: "number" },
                    reasoning: { type: "string" }
                }
            }
        });

        await base44.entities.KnowledgeQuery.update(query.id, {
            satisfaction: result.category
        });

        return { trigger: query, data: result };
    };

    const draftResponse = async (query, rule) => {
        const articles = await base44.entities.KnowledgeArticle.list('-relevance_score', 10);
        
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Draft a response for: "${query.query}"

Available knowledge:
${articles.slice(0, 3).map(a => `- ${a.title}: ${a.content.substring(0, 200)}`).join('\n')}

Provide a helpful, concise draft response.`,
            response_json_schema: {
                type: "object",
                properties: {
                    draft_response: { type: "string" },
                    confidence: { type: "number" },
                    related_articles: { type: "array", items: { type: "string" } }
                }
            }
        });

        return { trigger: query, data: result };
    };

    const validateWorkflowData = async (execution, rule) => {
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Validate this workflow data:

Initial Input: ${execution.initial_input}

Check for:
1. Required fields present
2. Data format correctness
3. Potential issues

Return validation status and issues.`,
            response_json_schema: {
                type: "object",
                properties: {
                    is_valid: { type: "boolean" },
                    issues: { type: "array", items: { type: "string" } },
                    suggestions: { type: "array", items: { type: "string" } }
                }
            }
        });

        return { trigger: execution, data: result };
    };
}

export default function AutomationEngine() {
    useAutomationEngine();
    return null;
}