import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Award, Shield } from 'lucide-react';
import SkillVerificationBadge from './SkillVerificationBadge';

export default function AgentSkillMatrix({ agents, skills, searchQuery, onSelectAgent }) {
    const filteredAgents = agents.filter(a =>
        a.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getAgentSkills = (agentName) => {
        return skills.filter(s => s.agent_name === agentName);
    };

    const getCertificationColor = (level) => {
        switch (level) {
            case 'expert': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'advanced': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'intermediate': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            programming: 'bg-indigo-100 text-indigo-700',
            data_analysis: 'bg-cyan-100 text-cyan-700',
            content_creation: 'bg-pink-100 text-pink-700',
            research: 'bg-purple-100 text-purple-700',
            customer_support: 'bg-green-100 text-green-700',
            marketing: 'bg-orange-100 text-orange-700',
            sales: 'bg-red-100 text-red-700',
            design: 'bg-yellow-100 text-yellow-700',
            project_management: 'bg-blue-100 text-blue-700',
            other: 'bg-slate-100 text-slate-700'
        };
        return colors[category] || colors.other;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
                const agentSkills = getAgentSkills(agent.name);
                const avgProficiency = agentSkills.length > 0
                    ? agentSkills.reduce((sum, s) => sum + (s.proficiency_level || 0), 0) / agentSkills.length
                    : 0;

                return (
                    <Card
                        key={agent.name}
                        className="hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => onSelectAgent && onSelectAgent(agent)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {agent.name}
                                        {agentSkills.filter(s => s.certification_level === 'expert').length > 0 && (
                                            <Award className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                        {agent.description}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Overall Proficiency */}
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-600">Overall Proficiency</span>
                                    <span className="font-semibold text-slate-800">{Math.round(avgProficiency)}%</span>
                                </div>
                                <Progress value={avgProficiency} className="h-2" />
                            </div>

                            {/* Skills Count */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Total Skills</span>
                                <Badge variant="outline">{agentSkills.length}</Badge>
                            </div>

                            {/* Top Skills */}
                            {agentSkills.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-700">Top Skills</p>
                                    {agentSkills
                                        .sort((a, b) => (b.proficiency_level || 0) - (a.proficiency_level || 0))
                                        .slice(0, 3)
                                        .map((skill) => (
                                            <div key={skill.id} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Badge className={`${getCategoryColor(skill.skill_category)} text-xs`}>
                                                            {skill.skill_category}
                                                        </Badge>
                                                        <span className="truncate font-medium">{skill.skill_name}</span>
                                                    </div>
                                                    <Badge className={getCertificationColor(skill.certification_level)}>
                                                        {skill.certification_level}
                                                    </Badge>
                                                    <SkillVerificationBadge 
                                                        verified={skill.verified_by}
                                                        verifiedBy={skill.verified_by}
                                                    />
                                                </div>
                                                <Progress value={skill.proficiency_level || 0} className="h-1" />
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-slate-400">
                                    <Circle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    No skills defined yet
                                </div>
                            )}

                            {/* Verified Skills */}
                            {agentSkills.filter(s => s.verified_by).length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                    <Shield className="h-3 w-3" />
                                    {agentSkills.filter(s => s.verified_by).length} verified
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}