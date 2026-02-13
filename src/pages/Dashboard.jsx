import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, MessageSquare, Play, CheckCircle, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LiveActivityRail from '../components/shared/LiveActivityRail';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        tasksToday: 0,
        successRate: 0,
        idleAgents: 0,
        activeWorkflows: 0
    });
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const [metrics, statuses, executions] = await Promise.all([
                base44.entities.AgentPerformanceMetric.filter({ 
                    created_date: { $gte: today.toISOString() } 
                }),
                base44.entities.AgentStatus.list(),
                base44.entities.WorkflowExecution.list('-created_date', 10)
            ]);

            const successCount = metrics.filter(m => m.status === 'success').length;
            const totalTasks = metrics.length;
            const idleCount = statuses.filter(s => s.status === 'idle').length;
            const activeCount = statuses.filter(s => s.status === 'active' || s.status === 'busy').length;

            setStats({
                tasksToday: totalTasks,
                successRate: totalTasks > 0 ? Math.round((successCount / totalTasks) * 100) : 0,
                idleAgents: idleCount,
                activeWorkflows: activeCount
            });

            const recent = executions
                .filter(e => e.status === 'completed' || e.status === 'success')
                .slice(0, 5)
                .map(e => ({
                    id: e.id,
                    title: e.workflow_name || 'Workflow',
                    time: new Date(e.updated_date),
                    success: e.status === 'completed' || e.status === 'success'
                }));

            setRecentResults(recent);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <LiveActivityRail />
            
            <div className="max-w-6xl mx-auto px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black text-slate-900 mb-4">
                        Command Center
                    </h1>
                    <p className="text-xl text-slate-600">
                        Mission control for your AI agents
                    </p>
                </div>

                {/* Quick Actions - DOMINANT FOCAL POINT */}
                <div className="mb-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <Link to={createPageUrl('Workflows')}>
                            <Button 
                                size="lg" 
                                className="w-full h-24 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                            >
                                <Workflow className="h-6 w-6 mr-3" />
                                Run Workflow
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Agents')}>
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="w-full h-24 text-lg border-2 hover:bg-slate-50"
                            >
                                <MessageSquare className="h-6 w-6 mr-3" />
                                Chat with Agent
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* System Health */}
                <div className="mb-12">
                    <h3 className="text-lg font-semibold text-slate-700 mb-6 uppercase tracking-wide text-xs">
                        System Health
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-l-4 border-blue-600">
                            <CardContent className="pt-6">
                                <p className="text-sm text-slate-600 mb-1">Tasks Today</p>
                                <p className="text-4xl font-bold text-slate-900">{stats.tasksToday}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-green-600">
                            <CardContent className="pt-6">
                                <p className="text-sm text-slate-600 mb-1">Success Rate</p>
                                <p className="text-4xl font-bold text-green-600">{stats.successRate}%</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-amber-600">
                            <CardContent className="pt-6">
                                <p className="text-sm text-slate-600 mb-1">Idle Agents</p>
                                <p className="text-4xl font-bold text-amber-600">{stats.idleAgents}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-purple-600">
                            <CardContent className="pt-6">
                                <p className="text-sm text-slate-600 mb-1">Active</p>
                                <p className="text-4xl font-bold text-purple-600">{stats.activeWorkflows}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Results */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-6 uppercase tracking-wide text-xs">
                        Recent Results
                    </h3>
                    {recentResults.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Play className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 mb-4">No executions yet</p>
                                <Link to={createPageUrl('Workflows')}>
                                    <Button variant="outline">
                                        Run Your First Workflow
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {recentResults.map((result) => (
                                <div 
                                    key={result.id}
                                    className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-slate-900 font-medium">{result.title}</span>
                                    </div>
                                    <span className="text-sm text-slate-500">
                                        {Math.round((new Date() - result.time) / 1000 / 60)}m ago
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}