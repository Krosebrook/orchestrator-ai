import { base44 } from "@/api/base44Client";

export async function selectBestAgent(criteria, availableAgents) {
    const {
        required_skills = [],
        workload_threshold = 10,
        min_success_rate = 0.7,
        task_description = ''
    } = criteria;

    // Get agent profiles and performance data
    const profiles = await base44.entities.AgentProfile.list();
    const taskDelegations = await base44.entities.TaskDelegation.list('-created_date', 50);
    
    // Score each agent
    const scoredAgents = availableAgents.map(agent => {
        const profile = profiles.find(p => p.agent_name === agent.name);
        const recentTasks = taskDelegations.filter(
            t => t.assigned_to === agent.name && t.status === 'in_progress'
        );
        
        let score = 100;
        
        // Check skills match
        if (required_skills.length > 0 && profile?.specialty_areas) {
            const matchedSkills = required_skills.filter(
                skill => profile.specialty_areas.includes(skill)
            );
            score += (matchedSkills.length / required_skills.length) * 30;
        }
        
        // Check workload
        const currentWorkload = recentTasks.length;
        if (currentWorkload >= workload_threshold) {
            score -= 20;
        }
        
        // Check success rate
        const successRate = profile?.performance_stats?.success_rate || 0;
        if (successRate < min_success_rate) {
            score -= 30;
        } else {
            score += (successRate - min_success_rate) * 50;
        }
        
        // AI-based skill matching if task description provided
        if (task_description && profile) {
            // This could be enhanced with LLM scoring
            score += 10;
        }
        
        return {
            agent,
            profile,
            score,
            currentWorkload,
            successRate,
            reasoning: `Score: ${score.toFixed(0)}, Workload: ${currentWorkload}, Success Rate: ${(successRate * 100).toFixed(0)}%`
        };
    });
    
    // Sort by score descending
    scoredAgents.sort((a, b) => b.score - a.score);
    
    return scoredAgents[0] || null;
}

export async function selectAgentWithAI(taskDescription, availableAgents) {
    const profiles = await base44.entities.AgentProfile.list();
    
    const agentInfo = availableAgents.map(agent => {
        const profile = profiles.find(p => p.agent_name === agent.name);
        return {
            name: agent.name,
            description: agent.description || '',
            strengths: profile?.strengths || [],
            specialty_areas: profile?.specialty_areas || [],
            success_rate: profile?.performance_stats?.success_rate || 0
        };
    });
    
    const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Select the best agent for this task:

Task: ${taskDescription}

Available Agents:
${agentInfo.map(a => `- ${a.name}: ${a.description}
  Strengths: ${a.strengths.join(', ')}
  Specialties: ${a.specialty_areas.join(', ')}
  Success Rate: ${(a.success_rate * 100).toFixed(0)}%`).join('\n\n')}

Return the best agent name and reasoning.`,
        response_json_schema: {
            type: "object",
            properties: {
                agent_name: { type: "string" },
                reasoning: { type: "string" },
                confidence: { type: "number" }
            }
        }
    });
    
    const selectedAgent = availableAgents.find(a => a.name === result.agent_name);
    
    return {
        agent: selectedAgent,
        reasoning: result.reasoning,
        confidence: result.confidence
    };
}

export default { selectBestAgent, selectAgentWithAI };