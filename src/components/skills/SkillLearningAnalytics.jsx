import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';

export default function SkillLearningAnalytics({ agents, skills, knowledgeAccess }) {
    const getSkillProgress = () => {
        return skills.map(skill => {
            const previousLevel = skill.proficiency_level - (skill.usage_count || 0);
            const improvement = skill.proficiency_level - Math.max(0, previousLevel);
            
            return {
                ...skill,
                improvement,
                trend: improvement > 5 ? 'up' : improvement < -5 ? 'down' : 'stable'
            };
        }).sort((a, b) => b.improvement - a.improvement);
    };

    const getTopPerformers = () => {
        const agentStats = agents.map(agent => {
            const agentSkills = skills.filter(s => s.agent_name === agent.name);
            const avgProficiency = agentSkills.length > 0
                ? agentSkills.reduce((sum, s) => sum + (s.proficiency_level || 0), 0) / agentSkills.length
                : 0;
            const expertSkills = agentSkills.filter(s => s.certification_level === 'expert').length;
            
            return {
                agent: agent.name,
                avgProficiency,
                expertSkills,
                totalSkills: agentSkills.length
            };
        }).sort((a, b) => b.avgProficiency - a.avgProficiency);

        return agentStats.slice(0, 5);
    };

    const skillProgress = getSkillProgress().slice(0, 10);
    const topPerformers = getTopPerformers();

    const getImprovementColor = (improvement) => {
        if (improvement > 10) return 'text-green-600 bg-green-50';
        if (improvement > 5) return 'text-blue-600 bg-blue-50';
        if (improvement < -5) return 'text-red-600 bg-red-50';
        return 'text-slate-600 bg-slate-50';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        Top Performing Agents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topPerformers.map((performer, idx) => (
                            <div key={performer.agent} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{performer.agent}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                            {performer.totalSkills} skills
                                        </Badge>
                                        {performer.expertSkills > 0 && (
                                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                                                {performer.expertSkills} expert
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {Math.round(performer.avgProficiency)}
                                    </p>
                                    <p className="text-xs text-slate-500">avg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Skill Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Skill Improvement Trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {skillProgress.map((skill) => (
                            <div key={skill.id} className="p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{skill.skill_name}</p>
                                        <p className="text-xs text-slate-500">{skill.agent_name}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {skill.skill_category}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                                style={{ width: `${skill.proficiency_level || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className={`ml-3 px-2 py-1 rounded flex items-center gap-1 ${getImprovementColor(skill.improvement)}`}>
                                        {skill.trend === 'up' ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : skill.trend === 'down' ? (
                                            <TrendingDown className="h-3 w-3" />
                                        ) : null}
                                        <span className="text-xs font-semibold">
                                            {skill.improvement > 0 ? '+' : ''}{skill.improvement}%
                                        </span>
                                    </div>
                                </div>
                                {skill.usage_count > 0 && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Used {skill.usage_count} times • Success rate: {Math.round((skill.success_rate || 0) * 100)}%
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}