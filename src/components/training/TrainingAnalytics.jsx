import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award, Target } from 'lucide-react';

export default function TrainingAnalytics({ sessions, modules, agents }) {
    const agentPerformance = agents.map(agent => {
        const agentSessions = sessions.filter(s => s.agent_name === agent.name && s.status === 'completed');
        const avgScore = agentSessions.length > 0
            ? (agentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / agentSessions.length).toFixed(1)
            : 0;
        
        return {
            name: agent.name,
            avgScore: parseFloat(avgScore),
            sessions: agentSessions.length
        };
    }).filter(a => a.sessions > 0);

    const modulePerformance = modules.map(module => {
        const moduleSessions = sessions.filter(s => s.module_id === module.id && s.status === 'completed');
        const avgScore = moduleSessions.length > 0
            ? (moduleSessions.reduce((sum, s) => sum + (s.score || 0), 0) / moduleSessions.length).toFixed(1)
            : 0;
        
        return {
            name: module.title.substring(0, 20),
            avgScore: parseFloat(avgScore),
            completions: moduleSessions.length
        };
    }).filter(m => m.completions > 0);

    const progressOverTime = sessions
        .filter(s => s.status === 'completed')
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
        .slice(-20)
        .map((session, idx) => ({
            session: idx + 1,
            score: session.score || 0
        }));

    const topPerformers = [...agentPerformance]
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

    const needsImprovement = [...agentPerformance]
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Sessions</p>
                                <p className="text-3xl font-bold text-slate-800">{sessions.length}</p>
                            </div>
                            <Target className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Avg Score</p>
                                <p className="text-3xl font-bold text-slate-800">
                                    {sessions.length > 0 
                                        ? (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length).toFixed(1)
                                        : 0}
                                </p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active Agents</p>
                                <p className="text-3xl font-bold text-slate-800">{agentPerformance.length}</p>
                            </div>
                            <Award className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Agent Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={agentPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="avgScore" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Module Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={modulePerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="avgScore" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {progressOverTime.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Progress Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={progressOverTime}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="session" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-600" />
                            Top Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topPerformers.map((agent, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-yellow-600">{idx + 1}</Badge>
                                        <span className="text-sm font-medium">{agent.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">{agent.avgScore}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-5 w-5 text-red-600" />
                            Needs Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {needsImprovement.map((agent, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                    <span className="text-sm font-medium">{agent.name}</span>
                                    <span className="text-sm font-bold text-orange-600">{agent.avgScore}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}