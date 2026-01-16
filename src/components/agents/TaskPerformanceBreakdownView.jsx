import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, Star } from 'lucide-react';

export default function TaskPerformanceBreakdownView({ agentName }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, [agentName]);

    const loadTasks = async () => {
        try {
            const taskData = await base44.entities.TaskPerformanceBreakdown.filter(
                { agent_name: agentName },
                '-created_date',
                100
            );
            setTasks(taskData || []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTaskTypeStats = () => {
        const byType = {};
        tasks.forEach(task => {
            if (!byType[task.task_type]) {
                byType[task.task_type] = { total: 0, success: 0, avgTime: 0, avgQuality: 0 };
            }
            byType[task.task_type].total++;
            if (task.status === 'success') byType[task.task_type].success++;
            if (task.execution_time_ms) byType[task.task_type].avgTime += task.execution_time_ms;
            if (task.quality_score) byType[task.task_type].avgQuality += task.quality_score;
        });

        return Object.entries(byType).map(([type, stats]) => ({
            name: type,
            'Success Rate': Math.round((stats.success / stats.total) * 100),
            'Avg Time (s)': ((stats.avgTime / stats.total) / 1000).toFixed(2),
            'Avg Quality': (stats.avgQuality / stats.total).toFixed(1)
        }));
    };

    const getStatusDistribution = () => {
        const dist = { success: 0, partial_success: 0, failure: 0 };
        tasks.forEach(t => dist[t.status]++);
        return [
            { name: 'Success', value: dist.success, color: '#10b981' },
            { name: 'Partial', value: dist.partial_success, color: '#f59e0b' },
            { name: 'Failure', value: dist.failure, color: '#ef4444' }
        ];
    };

    const getRecentFeedback = () => {
        return tasks
            .filter(t => t.user_feedback_score)
            .slice(0, 10)
            .reverse();
    };

    if (loading) return <div className="text-sm text-slate-500">Loading performance data...</div>;

    const typeStats = getTaskTypeStats();
    const statusDist = getStatusDistribution();
    const recentFeedback = getRecentFeedback();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Task Performance Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="by-type">
                    <TabsList>
                        <TabsTrigger value="by-type">By Type</TabsTrigger>
                        <TabsTrigger value="status">Status</TabsTrigger>
                        <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    </TabsList>

                    <TabsContent value="by-type" className="mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={typeStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="Success Rate" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="status" className="mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusDist}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="feedback" className="mt-4">
                        <div className="space-y-3">
                            {recentFeedback.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No feedback yet</p>
                            ) : (
                                recentFeedback.map((task) => (
                                    <div key={task.id} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium">{task.task_type}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${
                                                            i < task.user_feedback_score
                                                                ? 'fill-yellow-500 text-yellow-500'
                                                                : 'text-slate-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {task.user_feedback_text && (
                                            <p className="text-xs text-slate-600 italic">"{task.user_feedback_text}"</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}