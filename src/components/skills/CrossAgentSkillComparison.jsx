import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Users, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CrossAgentSkillComparison({ agents, skills }) {
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [collaborationSuggestions, setCollaborationSuggestions] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);

    const toggleAgentSelection = (agentName) => {
        setSelectedAgents(prev => {
            if (prev.includes(agentName)) {
                return prev.filter(a => a !== agentName);
            }
            if (prev.length >= 5) {
                toast.error('Maximum 5 agents for comparison');
                return prev;
            }
            return [...prev, agentName];
        });
    };

    useEffect(() => {
        if (selectedAgents.length >= 2) {
            prepareComparisonData();
        }
    }, [selectedAgents, skills]);

    const prepareComparisonData = () => {
        // Get all unique skill names across selected agents
        const allSkillNames = new Set();
        const agentSkillsMap = {};

        selectedAgents.forEach(agentName => {
            const agentSkills = skills.filter(s => s.agent_name === agentName);
            agentSkillsMap[agentName] = agentSkills;
            agentSkills.forEach(s => allSkillNames.add(s.skill_name));
        });

        // Create comparison matrix
        const comparisonMatrix = Array.from(allSkillNames).map(skillName => {
            const row = { skill: skillName };
            selectedAgents.forEach(agentName => {
                const skill = agentSkillsMap[agentName].find(s => s.skill_name === skillName);
                row[agentName] = skill ? skill.proficiency_level : 0;
                row[`${agentName}_verified`] = skill?.verified_by ? true : false;
            });
            return row;
        });

        // Identify overlaps and gaps
        const overlaps = comparisonMatrix.filter(row => {
            const values = selectedAgents.map(a => row[a]);
            return values.filter(v => v > 0).length >= 2;
        });

        const gaps = comparisonMatrix.filter(row => {
            const values = selectedAgents.map(a => row[a]);
            return values.filter(v => v === 0).length > 0 && values.some(v => v > 0);
        });

        // Category-based radar chart data
        const categoryData = {};
        selectedAgents.forEach(agentName => {
            const agentSkills = agentSkillsMap[agentName];
            agentSkills.forEach(skill => {
                if (!categoryData[skill.skill_category]) {
                    categoryData[skill.skill_category] = { category: skill.skill_category };
                }
                if (!categoryData[skill.skill_category][agentName]) {
                    categoryData[skill.skill_category][agentName] = 0;
                }
                categoryData[skill.skill_category][agentName] += skill.proficiency_level || 0;
            });
        });

        // Average by category
        Object.keys(categoryData).forEach(cat => {
            selectedAgents.forEach(agentName => {
                const skillCount = agentSkillsMap[agentName].filter(s => s.skill_category === cat).length;
                if (skillCount > 0) {
                    categoryData[cat][agentName] = Math.round(categoryData[cat][agentName] / skillCount);
                }
            });
        });

        setComparisonData({
            matrix: comparisonMatrix,
            overlaps,
            gaps,
            categoryData: Object.values(categoryData)
        });
    };

    const analyzeCollaborationPotential = async () => {
        if (selectedAgents.length < 2) {
            toast.error('Select at least 2 agents');
            return;
        }

        setAnalyzing(true);
        try {
            const agentProfiles = selectedAgents.map(name => {
                const agentSkills = skills.filter(s => s.agent_name === name);
                return {
                    name,
                    skills: agentSkills.map(s => ({
                        name: s.skill_name,
                        category: s.skill_category,
                        proficiency: s.proficiency_level
                    }))
                };
            });

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these agents and suggest optimal collaboration pairings:

${JSON.stringify(agentProfiles, null, 2)}

For each suggested pairing:
1. Which agents should collaborate
2. What complementary skills they bring
3. What type of tasks they'd excel at together
4. Estimated synergy score (0-100)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        pairings: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    agents: { type: "array", items: { type: "string" } },
                                    complementary_skills: { type: "array", items: { type: "string" } },
                                    recommended_tasks: { type: "string" },
                                    synergy_score: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            setCollaborationSuggestions(response.pairings.sort((a, b) => b.synergy_score - a.synergy_score));
            toast.success('Collaboration analysis complete');
        } catch (error) {
            console.error('Failed to analyze collaboration:', error);
            toast.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-6">
            {/* Agent Selection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Select Agents to Compare</CardTitle>
                        <span className="text-sm text-slate-600">{selectedAgents.length}/5 selected</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {agents.map((agent) => (
                            <div
                                key={agent.name}
                                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                                    selectedAgents.includes(agent.name)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => toggleAgentSelection(agent.name)}
                            >
                                <Checkbox checked={selectedAgents.includes(agent.name)} />
                                <span className="text-sm font-medium truncate">{agent.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {selectedAgents.length >= 2 && comparisonData && (
                <>
                    {/* Radar Chart - Category Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Skill Categories Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart data={comparisonData.categoryData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="category" />
                                    <PolarRadiusAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    {selectedAgents.map((agentName, idx) => (
                                        <Radar
                                            key={agentName}
                                            name={agentName}
                                            dataKey={agentName}
                                            stroke={COLORS[idx]}
                                            fill={COLORS[idx]}
                                            fillOpacity={0.3}
                                        />
                                    ))}
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Skill Overlaps */}
                    {comparisonData.overlaps.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Skill Overlaps ({comparisonData.overlaps.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {comparisonData.overlaps.slice(0, 10).map((overlap, idx) => (
                                        <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-3">
                                            <p className="font-semibold text-sm text-slate-800 mb-2">{overlap.skill}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAgents.map((agentName) => {
                                                    const proficiency = overlap[agentName];
                                                    return proficiency > 0 ? (
                                                        <div key={agentName} className="flex items-center gap-2 bg-white px-2 py-1 rounded">
                                                            <span className="text-xs text-slate-600">{agentName}</span>
                                                            <span className="text-xs font-semibold">{proficiency}%</span>
                                                            {overlap[`${agentName}_verified`] && (
                                                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                            )}
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Skill Gaps */}
                    {comparisonData.gaps.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-amber-600" />
                                    Skill Gaps ({comparisonData.gaps.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {comparisonData.gaps.slice(0, 10).map((gap, idx) => (
                                        <div key={idx} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                                            <p className="font-semibold text-sm text-slate-800 mb-2">{gap.skill}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {selectedAgents.map((agentName) => {
                                                    const proficiency = gap[agentName];
                                                    return (
                                                        <div key={agentName} className={`px-2 py-1 rounded text-xs ${
                                                            proficiency === 0 ? 'bg-red-100 text-red-700' : 'bg-white text-slate-700'
                                                        }`}>
                                                            <div className="flex items-center justify-between">
                                                                <span className="truncate">{agentName}</span>
                                                                <span className="font-semibold ml-1">
                                                                    {proficiency === 0 ? 'Missing' : `${proficiency}%`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Detailed Comparison Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Side-by-Side Skill Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left p-3 font-semibold text-slate-700 sticky left-0 bg-slate-50">
                                                Skill
                                            </th>
                                            {selectedAgents.map((agentName, idx) => (
                                                <th key={agentName} className="text-center p-3 font-semibold" style={{ color: COLORS[idx] }}>
                                                    {agentName}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparisonData.matrix.map((row, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="p-3 font-medium sticky left-0 bg-white">{row.skill}</td>
                                                {selectedAgents.map((agentName) => {
                                                    const proficiency = row[agentName];
                                                    const verified = row[`${agentName}_verified`];
                                                    return (
                                                        <td key={agentName} className="p-3">
                                                            {proficiency > 0 ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <span className="font-semibold">{proficiency}%</span>
                                                                        {verified && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                                                    </div>
                                                                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                                        <div
                                                                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                                                                            style={{ width: `${proficiency}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Collaboration Recommendations */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Collaboration Opportunities
                                </CardTitle>
                                <Button
                                    onClick={analyzeCollaborationPotential}
                                    disabled={analyzing}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {analyzing ? 'Analyzing...' : 'Analyze Synergy'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {collaborationSuggestions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">Click "Analyze Synergy" to identify optimal collaboration pairs</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {collaborationSuggestions.map((suggestion, idx) => (
                                        <div key={idx} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {suggestion.agents.join(' + ')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-purple-100 text-purple-700">
                                                    Synergy: {suggestion.synergy_score}%
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-1">
                                                        Complementary Skills
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {suggestion.complementary_skills.map((skill, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 uppercase mb-1">
                                                        Recommended Tasks
                                                    </p>
                                                    <p className="text-sm text-slate-600">{suggestion.recommended_tasks}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {selectedAgents.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Select 2 or more agents above to start comparing skills</p>
                    </CardContent>
                </Card>
            )}

            {selectedAgents.length === 1 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Select at least one more agent to enable comparison</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}