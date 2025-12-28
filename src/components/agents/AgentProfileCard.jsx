import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Users, Zap, Star } from 'lucide-react';

export default function AgentProfileCard({ profile, agent }) {
    if (!profile) return null;

    const stats = profile.performance_stats || {};

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Agent Profile
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Communication Style */}
                <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Communication Style</p>
                    <Badge className="bg-blue-600 capitalize">{profile.communication_style}</Badge>
                </div>

                {/* Strengths */}
                {profile.strengths && profile.strengths.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Zap className="h-4 w-4 text-green-600" />
                            Strengths
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {profile.strengths.map((strength, idx) => (
                                <Badge key={idx} className="bg-green-100 text-green-700">
                                    {strength}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Performance Stats */}
                {stats.success_rate !== undefined && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Performance
                        </p>
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Success Rate</span>
                                    <span className="font-semibold">{stats.success_rate}%</span>
                                </div>
                                <Progress value={stats.success_rate} className="h-2" />
                            </div>
                            {stats.user_satisfaction !== undefined && (
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>User Satisfaction</span>
                                        <span className="font-semibold flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                            {stats.user_satisfaction}/5
                                        </span>
                                    </div>
                                    <Progress value={(stats.user_satisfaction / 5) * 100} className="h-2" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                                <div className="bg-slate-50 p-2 rounded">
                                    <p className="text-slate-500">Avg Response</p>
                                    <p className="font-semibold">{stats.avg_response_time || 0}s</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                    <p className="text-slate-500">Total Tasks</p>
                                    <p className="font-semibold">{stats.total_tasks || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preferred Partners */}
                {profile.preferred_partners && profile.preferred_partners.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            Works Best With
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {profile.preferred_partners.map((partner, idx) => (
                                <Badge key={idx} variant="outline">
                                    {partner}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Optimal Workload */}
                <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Optimal Workload</p>
                    <Badge className={
                        profile.optimal_workload === 'heavy' ? 'bg-red-600' :
                        profile.optimal_workload === 'moderate' ? 'bg-yellow-600' :
                        'bg-green-600'
                    }>
                        {profile.optimal_workload}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}