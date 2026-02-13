import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Award } from 'lucide-react';

export default function SkillImprovementTracker({ agents }) {
    const [selectedAgent, setSelectedAgent] = useState('');
    const [progressData, setProgressData] = useState([]);

    useEffect(() => {
        if (selectedAgent) {
            loadProgressData();
        }
    }, [selectedAgent]);

    const loadProgressData = async () => {
        try {
            const progress = await base44.entities.AgentTrainingProgress.filter({
                agent_name: selectedAgent
            });
            setProgressData(progress || []);
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    };

    // Prepare chart data
    const chartData = progressData.flatMap(progress => {
        if (progress.performance_history) {
            return progress.performance_history.map((entry, idx) => ({
                iteration: idx + 1,
                score: entry.score,
                skill: progress.skill_category
            }));
        }
        return [];
    });

    // Calculate overall improvement
    const totalImprovement = progressData.reduce((acc, p) => {
        return acc + (p.current_score - p.baseline_score);
    }, 0);

    const avgImprovement = progressData.length > 0 ? totalImprovement / progressData.length : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Skill Improvement Over Time</h3>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                        {agents.map((agent) => (
                            <SelectItem key={agent.name} value={agent.name}>
                                {agent.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedAgent && progressData.length > 0 ? (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-slate-600">Avg Improvement</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            +{Math.round(avgImprovement)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <Award className="h-8 w-8 text-purple-600" />
                                    <div>
                                        <p className="text-sm text-slate-600">Skills Trained</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {new Set(progressData.map(p => p.skill_category)).size}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-bold">∑</span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Total Sessions</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {progressData.reduce((acc, p) => acc + p.training_iterations, 0)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Chart */}
                    {chartData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="iteration" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="score" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            name="Skill Score"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Skills Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {progressData.map((progress) => (
                                    <div key={progress.id} className="border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold capitalize">{progress.skill_category}</h4>
                                            <span className="text-sm text-slate-600">
                                                {Math.round(progress.baseline_score)} → {Math.round(progress.current_score)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                                style={{ width: `${progress.current_score}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">
                                            +{Math.round(progress.current_score - progress.baseline_score)} improvement
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-500">Select an agent to view improvement tracking</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}