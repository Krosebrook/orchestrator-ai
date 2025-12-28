import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ProfileAwareOrchestrationHelper({ selectedAgents, onSuggestion }) {
    const [profiles, setProfiles] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        if (selectedAgents && selectedAgents.length > 0) {
            loadProfilesAndAnalyze();
        }
    }, [selectedAgents]);

    const loadProfilesAndAnalyze = async () => {
        try {
            const profilesData = await base44.entities.AgentProfile.list();
            setProfiles(profilesData || []);
            
            const recs = analyzeOrchestration(selectedAgents, profilesData || []);
            setRecommendations(recs);
        } catch (error) {
            console.error('Failed to load profiles:', error);
        }
    };

    const analyzeOrchestration = (agents, profiles) => {
        const recommendations = [];
        
        // Check for performance issues
        agents.forEach(agent => {
            const profile = profiles.find(p => p.agent_name === agent.agent_name);
            if (profile) {
                const stats = profile.performance_stats || {};
                
                if (stats.success_rate < 80) {
                    recommendations.push({
                        type: 'warning',
                        agent: agent.agent_name,
                        message: `${agent.agent_name} has a ${stats.success_rate}% success rate. Consider adding error handling or using a backup agent.`
                    });
                }
                
                if (stats.avg_response_time > 5) {
                    recommendations.push({
                        type: 'info',
                        agent: agent.agent_name,
                        message: `${agent.agent_name} takes an average of ${stats.avg_response_time}s. Consider parallel execution for time-sensitive workflows.`
                    });
                }
            }
        });

        // Check for optimal partnerships
        for (let i = 0; i < agents.length - 1; i++) {
            const currentAgent = agents[i];
            const nextAgent = agents[i + 1];
            const currentProfile = profiles.find(p => p.agent_name === currentAgent.agent_name);
            
            if (currentProfile && currentProfile.preferred_partners) {
                if (currentProfile.preferred_partners.includes(nextAgent.agent_name)) {
                    recommendations.push({
                        type: 'success',
                        agent: currentAgent.agent_name,
                        message: `Great pairing! ${currentAgent.agent_name} works well with ${nextAgent.agent_name}.`
                    });
                }
            }
        }

        // Suggest missing agents
        const hasResearcher = agents.some(a => a.agent_name.includes('research'));
        const hasValidator = agents.some(a => a.agent_name.includes('analyst'));
        
        if (hasResearcher && !hasValidator) {
            recommendations.push({
                type: 'suggestion',
                message: 'Consider adding an analyst agent after the researcher for data validation.'
            });
        }

        return recommendations;
    };

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-2">
            {recommendations.map((rec, idx) => (
                <Alert key={idx} className={
                    rec.type === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                    rec.type === 'success' ? 'border-green-300 bg-green-50' :
                    'border-blue-300 bg-blue-50'
                }>
                    {rec.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-700" />}
                    {rec.type === 'success' && <CheckCircle className="h-4 w-4 text-green-700" />}
                    {rec.type === 'info' && <Lightbulb className="h-4 w-4 text-blue-700" />}
                    {rec.type === 'suggestion' && <Lightbulb className="h-4 w-4 text-blue-700" />}
                    <AlertDescription className={
                        rec.type === 'warning' ? 'text-yellow-800' :
                        rec.type === 'success' ? 'text-green-800' :
                        'text-blue-800'
                    }>
                        {rec.message}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}