import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Users, Zap, Star, AlertCircle, Activity } from 'lucide-react';
import AgentErrorLogViewer from './AgentErrorLogViewer';
import TaskPerformanceBreakdownView from './TaskPerformanceBreakdownView';
import AgentSelfReportManager from './AgentSelfReportManager';

export default function AgentProfileCard({ profile, agent }) {
    if (!profile) return null;

    const stats = profile.performance_stats || {};
    const errorSummary = profile.error_summary || {};
    const feedbackSummary = profile.feedback_summary || {};

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

                {/* Error Summary */}
                {errorSummary.total_errors > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Error Summary
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 p-2 rounded">
                                <p className="text-slate-500">Total</p>
                                <p className="font-semibold">{errorSummary.total_errors}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                                <p className="text-slate-500">Resolution Rate</p>
                                <p className="font-semibold">{errorSummary.resolution_rate || 0}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Summary */}
                {feedbackSummary.total_feedback > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-600" />
                            User Feedback
                        </p>
                        <div className="bg-slate-50 p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500">Average Rating</span>
                                <span className="text-sm font-semibold">{feedbackSummary.avg_rating?.toFixed(1)}/5</span>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <span className="text-green-600">👍 {feedbackSummary.positive_count}</span>
                                <span className="text-red-600">👎 {feedbackSummary.negative_count}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detailed Views */}
                <Tabs defaultValue="overview" className="mt-4">
                    <TabsList className="w-full">
                        <TabsTrigger value="overview" className="flex-1 text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="errors" className="flex-1 text-xs">Errors</TabsTrigger>
                        <TabsTrigger value="tasks" className="flex-1 text-xs">Tasks</TabsTrigger>
                        <TabsTrigger value="reports" className="flex-1 text-xs">Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="text-xs text-slate-600 space-y-1">
                            <p>✅ Total Tasks: {stats.total_tasks || 0}</p>
                            <p>📊 Avg Quality: {stats.avg_quality_score?.toFixed(1) || 'N/A'}/10</p>
                            <p>💰 Total Cost: ${stats.total_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="errors" className="p-0">
                        <AgentErrorLogViewer agentName={agent?.name || profile.agent_name} />
                    </TabsContent>

                    <TabsContent value="tasks" className="p-0">
                        <TaskPerformanceBreakdownView agentName={agent?.name || profile.agent_name} />
                    </TabsContent>

                    <TabsContent value="reports" className="p-0">
                        <AgentSelfReportManager agentName={agent?.name || profile.agent_name} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}