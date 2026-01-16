import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Target, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function AICoachingSystem({ agentName }) {
    const [coaching, setCoaching] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCoachingData();
    }, [agentName]);

    const loadCoachingData = async () => {
        try {
            const trainingSessions = await base44.entities.TrainingSession.filter(
                { agent_name: agentName },
                '-created_date',
                50
            );
            setSessions(trainingSessions);

            if (trainingSessions.length > 0) {
                const progress = trainingSessions.map((s, idx) => ({
                    session: idx + 1,
                    score: s.score || 0,
                    date: new Date(s.created_date).toLocaleDateString()
                }));
                setProgressData(progress);

                await generateCoaching(trainingSessions);
            }
        } catch (error) {
            console.error('Failed to load coaching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCoaching = async (trainingSessions) => {
        try {
            const recentSessions = trainingSessions.slice(0, 10);
            const avgScore = recentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.length;

            const skillPerformance = {};
            recentSessions.forEach(s => {
                s.behaviors_demonstrated?.forEach(behavior => {
                    skillPerformance[behavior] = (skillPerformance[behavior] || 0) + 1;
                });
            });

            const weaknesses = recentSessions.flatMap(s => s.feedback?.weaknesses || []);
            const strengths = recentSessions.flatMap(s => s.feedback?.strengths || []);

            // Get predictive recommendations for context
            const futureRecs = await base44.entities.TrainingRecommendation.filter(
                { agent_name: agentName, recommendation_type: 'new_capability' },
                '-created_date',
                5
            );

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Provide personalized coaching for agent: ${agentName}

Training Performance:
- Sessions Completed: ${recentSessions.length}
- Average Score: ${avgScore.toFixed(1)}/100
- Score Trend: ${progressData.length > 1 ? 
    (progressData[progressData.length - 1].score > progressData[0].score ? 'Improving' : 'Declining') : 'New'}

Demonstrated Skills:
${Object.entries(skillPerformance).map(([skill, count]) => `- ${skill}: ${count} times`).join('\n')}

Common Weaknesses:
${[...new Set(weaknesses)].map(w => `- ${w}`).join('\n')}

Common Strengths:
${[...new Set(strengths)].map(s => `- ${s}`).join('\n')}

Recent Session Details:
${recentSessions.slice(0, 3).map(s => 
    `Session: ${s.module_title}\n  Score: ${s.score}\n  Feedback: ${s.feedback?.overall_assessment || 'N/A'}`
).join('\n\n')}

FUTURE SKILL PREDICTIONS:
${futureRecs.length > 0 ? futureRecs.map(r => `- ${r.title}: ${r.description}`).join('\n') : 'No future predictions available'}

Provide personalized coaching considering both current performance AND future needs:
1. Overall assessment of progress
2. Specific skill gaps (current + predicted future gaps)
3. Personalized improvement strategies (prioritizing future-critical skills)
4. Recommended knowledge articles topics
5. Targeted exercises to practice
6. Short-term goals (next 2 weeks) - emphasize future-readiness
7. Long-term development plan (aligned with predicted industry evolution)
8. Motivational insights`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        assessment: { type: "string" },
                        progress_trend: { type: "string" },
                        skill_gaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    severity: { type: "string" },
                                    evidence: { type: "string" }
                                }
                            }
                        },
                        improvement_strategies: { type: "array", items: { type: "string" } },
                        recommended_articles: { type: "array", items: { type: "string" } },
                        targeted_exercises: { type: "array", items: { type: "string" } },
                        short_term_goals: { type: "array", items: { type: "string" } },
                        long_term_plan: { type: "string" },
                        motivation: { type: "string" }
                    }
                }
            });

            setCoaching(result);
        } catch (error) {
            console.error('Failed to generate coaching:', error);
            toast.error('Failed to generate coaching');
        }
    };

    if (loading) {
        return <Card><CardContent className="pt-6 text-center">Loading coaching...</CardContent></Card>;
    }

    if (!coaching) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">Complete training sessions to receive AI coaching</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-6 w-6 text-purple-600" />
                        <h3 className="font-semibold text-lg">AI Coaching for {agentName}</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{coaching.assessment}</p>
                    <div className="bg-white/60 p-3 rounded">
                        <p className="text-xs font-semibold mb-1">Progress Trend:</p>
                        <p className="text-sm">{coaching.progress_trend}</p>
                    </div>
                </CardContent>
            </Card>

            {progressData.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Performance Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={progressData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="session" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {coaching.skill_gaps?.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-red-600" />
                            Skill Gaps to Address
                        </h3>
                        <div className="space-y-2">
                            {coaching.skill_gaps.map((gap, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{gap.skill}</span>
                                        <Badge className={
                                            gap.severity === 'critical' ? 'bg-red-600' :
                                            gap.severity === 'high' ? 'bg-orange-600' :
                                            'bg-yellow-600'
                                        }>
                                            {gap.severity}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600">{gap.evidence}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-4 space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Improvement Strategies</h3>
                        {coaching.improvement_strategies?.map((strategy, idx) => (
                            <p key={idx} className="text-sm text-slate-700 mb-1">• {strategy}</p>
                        ))}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Recommended Reading
                        </h3>
                        {coaching.recommended_articles?.map((article, idx) => (
                            <p key={idx} className="text-sm text-blue-600 mb-1">📚 {article}</p>
                        ))}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-2">Targeted Exercises</h3>
                        {coaching.targeted_exercises?.map((exercise, idx) => (
                            <p key={idx} className="text-sm text-slate-700 mb-1">💪 {exercise}</p>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-4 space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold mb-2 text-green-900">Short-term Goals (2 weeks)</h3>
                        {coaching.short_term_goals?.map((goal, idx) => (
                            <p key={idx} className="text-sm text-green-700 mb-1">🎯 {goal}</p>
                        ))}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-2 text-green-900">Long-term Development</h3>
                        <p className="text-sm text-green-700">{coaching.long_term_plan}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                    <p className="text-sm text-blue-900 italic">💡 {coaching.motivation}</p>
                </CardContent>
            </Card>
        </div>
    );
}