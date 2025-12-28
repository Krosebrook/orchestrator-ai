import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";

export default function OrchestrationOptimizationEngine() {
    const [profiles, setProfiles] = useState([]);
    const [orchestrations, setOrchestrations] = useState([]);
    const [handoffs, setHandoffs] = useState([]);
    const [metrics, setMetrics] = useState([]);
    
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profilesData, orchestrationsData, handoffsData, metricsData] = await Promise.all([
                base44.entities.AgentProfile.list(),
                base44.entities.AgentOrchestration.list('-updated_date', 100),
                base44.entities.AgentHandoff.list('-updated_date', 200),
                base44.entities.AgentPerformanceMetric.list('-updated_date', 500)
            ]);
            
            setProfiles(profilesData || []);
            setOrchestrations(orchestrationsData || []);
            setHandoffs(handoffsData || []);
            setMetrics(metricsData || []);
        } catch (error) {
            console.error('Failed to load optimization data:', error);
        }
    };

    const analyzeCompatibility = (agent1Name, agent2Name) => {
        const profile1 = profiles.find(p => p.agent_name === agent1Name);
        const profile2 = profiles.find(p => p.agent_name === agent2Name);
        
        if (!profile1 || !profile2) return { score: 50, reasons: [] };

        let score = 50;
        const reasons = [];

        // Check preferred partners
        if (profile1.preferred_partners?.includes(agent2Name)) {
            score += 20;
            reasons.push('Preferred partnership');
        }

        // Check historical handoffs
        const successfulHandoffs = handoffs.filter(h => 
            h.from_agent === agent1Name && 
            h.to_agent === agent2Name && 
            h.status === 'completed'
        );
        const failedHandoffs = handoffs.filter(h => 
            h.from_agent === agent1Name && 
            h.to_agent === agent2Name && 
            h.status === 'failed'
        );

        if (successfulHandoffs.length > 0) {
            const successRate = successfulHandoffs.length / (successfulHandoffs.length + failedHandoffs.length);
            score += successRate * 30;
            reasons.push(`${Math.round(successRate * 100)}% historical success rate`);
        }

        return { score: Math.min(score, 100), reasons };
    };

    const identifyBottlenecks = () => {
        const bottlenecks = [];
        
        // Analyze agent performance
        profiles.forEach(profile => {
            const stats = profile.performance_stats || {};
            
            if (stats.avg_response_time > 5) {
                bottlenecks.push({
                    type: 'slow_response',
                    agent: profile.agent_name,
                    severity: 'medium',
                    metric: `${stats.avg_response_time}s avg response`,
                    suggestion: 'Consider parallel execution or optimizing agent configuration'
                });
            }
            
            if (stats.success_rate < 80) {
                bottlenecks.push({
                    type: 'low_success',
                    agent: profile.agent_name,
                    severity: 'high',
                    metric: `${stats.success_rate}% success rate`,
                    suggestion: 'Add error handling or use backup agent'
                });
            }
        });

        // Analyze handoff failures
        const handoffsByPair = {};
        handoffs.forEach(h => {
            const key = `${h.from_agent}->${h.to_agent}`;
            if (!handoffsByPair[key]) {
                handoffsByPair[key] = { total: 0, failed: 0 };
            }
            handoffsByPair[key].total++;
            if (h.status === 'failed') {
                handoffsByPair[key].failed++;
            }
        });

        Object.entries(handoffsByPair).forEach(([pair, stats]) => {
            if (stats.failed / stats.total > 0.2) {
                bottlenecks.push({
                    type: 'handoff_failure',
                    agent: pair,
                    severity: 'high',
                    metric: `${Math.round(stats.failed / stats.total * 100)}% failure rate`,
                    suggestion: 'Review data mapping or add intermediate agent'
                });
            }
        });

        return bottlenecks;
    };

    const suggestOptimizations = async (orchestration) => {
        const agents = orchestration.agents || [];
        const recommendations = [];

        // Check agent ordering
        for (let i = 0; i < agents.length - 1; i++) {
            const current = agents[i];
            const next = agents[i + 1];
            const compatibility = analyzeCompatibility(current.agent_name, next.agent_name);
            
            if (compatibility.score < 60) {
                recommendations.push({
                    type: 'poor_pairing',
                    priority: 'medium',
                    agents: [current.agent_name, next.agent_name],
                    message: `Low compatibility (${compatibility.score}%) between ${current.agent_name} and ${next.agent_name}`,
                    suggestion: 'Consider adding an intermediate agent or reordering workflow'
                });
            }
        }

        // Check for parallel opportunities
        const parallelCandidates = agents.filter((agent, idx) => {
            if (idx === 0) return false;
            const profile = profiles.find(p => p.agent_name === agent.agent_name);
            return profile?.performance_stats?.avg_response_time > 3;
        });

        if (parallelCandidates.length >= 2) {
            recommendations.push({
                type: 'parallel_opportunity',
                priority: 'low',
                agents: parallelCandidates.map(a => a.agent_name),
                message: 'Multiple slow agents detected',
                suggestion: 'Consider parallel execution to reduce total time'
            });
        }

        // Use AI to generate advanced suggestions
        try {
            const context = {
                orchestration: orchestration.name,
                agents: agents.map(a => a.agent_name).join(' → '),
                profiles: agents.map(a => {
                    const p = profiles.find(pr => pr.agent_name === a.agent_name);
                    return p ? {
                        name: a.agent_name,
                        strengths: p.strengths,
                        weaknesses: p.weaknesses,
                        stats: p.performance_stats
                    } : null;
                }).filter(Boolean)
            };

            const aiResponse = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this agent orchestration workflow and suggest optimizations:

Workflow: ${context.orchestration}
Agent Sequence: ${context.agents}

Agent Profiles:
${JSON.stringify(context.profiles, null, 2)}

Provide 2-3 specific, actionable optimization suggestions to improve efficiency, success rate, or performance. Focus on agent ordering, parallel execution opportunities, or adding missing capabilities.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    impact: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (aiResponse.suggestions) {
                aiResponse.suggestions.forEach(s => {
                    recommendations.push({
                        type: 'ai_suggestion',
                        priority: 'medium',
                        message: s.title,
                        suggestion: s.description,
                        impact: s.impact
                    });
                });
            }
        } catch (error) {
            console.error('AI suggestion failed:', error);
        }

        return recommendations;
    };

    const findOptimalAgentSequence = (taskDescription, availableAgents) => {
        // Build compatibility matrix
        const agentNames = availableAgents.map(a => a.name);
        const matrix = {};
        
        agentNames.forEach(agent1 => {
            matrix[agent1] = {};
            agentNames.forEach(agent2 => {
                if (agent1 !== agent2) {
                    matrix[agent1][agent2] = analyzeCompatibility(agent1, agent2).score;
                }
            });
        });

        // Find high-compatibility sequences
        const sequences = [];
        agentNames.forEach(start => {
            const path = [start];
            let current = start;
            
            while (path.length < Math.min(4, agentNames.length)) {
                const remaining = agentNames.filter(a => !path.includes(a));
                if (remaining.length === 0) break;
                
                const next = remaining.reduce((best, candidate) => {
                    const score = matrix[current][candidate] || 0;
                    return score > (matrix[current][best] || 0) ? candidate : best;
                }, remaining[0]);
                
                path.push(next);
                current = next;
            }
            
            const avgScore = path.slice(0, -1).reduce((sum, agent, idx) => {
                return sum + (matrix[agent][path[idx + 1]] || 0);
            }, 0) / (path.length - 1);
            
            sequences.push({ path, avgScore });
        });

        return sequences.sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
    };

    return {
        analyzeCompatibility,
        identifyBottlenecks,
        suggestOptimizations,
        findOptimalAgentSequence,
        profiles,
        orchestrations,
        handoffs,
        metrics,
        reload: loadData
    };
}