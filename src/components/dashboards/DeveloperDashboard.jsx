import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Bug, CheckCircle, Clock, Plus } from 'lucide-react';

export default function DeveloperDashboard({ user }) {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const tasksData = await base44.entities.Task.filter({ assigned_to: user?.email }, '-updated_date', 50);
            setTasks(tasksData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const completed = tasks.filter(t => t.status === 'completed');
    const bugs = tasks.filter(t => t.tags?.includes('bug'));

    const getStatusColor = (status) => {
        const colors = {
            todo: 'bg-slate-100 text-slate-700',
            in_progress: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-500 text-white',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-slate-100 text-slate-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-500 text-white'
        };
        return colors[priority] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Developer Dashboard</h2>
                    <p className="text-slate-600">Your tasks and development workflow</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">To Do</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{todoTasks.length}</p>
                            </div>
                            <Clock className="h-10 w-10 text-slate-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Progress</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{inProgress.length}</p>
                            </div>
                            <Code className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Completed</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{completed.length}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Bugs</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{bugs.length}</p>
                            </div>
                            <Bug className="h-10 w-10 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    {tasks.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No tasks assigned yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.filter(t => t.status !== 'completed').map((task) => (
                                <div key={task.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                                <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                                                {task.priority && (
                                                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                {task.due_date && <span>Due: {task.due_date}</span>}
                                                {task.tags && task.tags.length > 0 && (
                                                    <span>Tags: {task.tags.join(', ')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">Update</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}