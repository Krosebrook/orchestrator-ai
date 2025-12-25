import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function OperationsDashboard({ user }) {
    const [tasks, setTasks] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [executions, setExecutions] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tasksData, workflowsData, executionsData] = await Promise.all([
                base44.entities.Task.list('-updated_date', 50),
                base44.entities.Workflow.list('-updated_date', 20),
                base44.entities.WorkflowExecution.list('-updated_date', 20)
            ]);
            setTasks(tasksData || []);
            setWorkflows(workflowsData || []);
            setExecutions(executionsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
    const activeWorkflows = workflows.filter(w => w.status === 'active');
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const failedExecutions = executions.filter(e => e.status === 'failed');

    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Operations Dashboard</h2>
                <p className="text-slate-600">Process efficiency and workflow monitoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active Workflows</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{activeWorkflows.length}</p>
                            </div>
                            <Activity className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Completion Rate</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{completionRate.toFixed(0)}%</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Pending Tasks</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{pendingTasks.length}</p>
                            </div>
                            <Clock className="h-10 w-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Failed Executions</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{failedExecutions.length}</p>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                    {activeWorkflows.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No active workflows</p>
                    ) : (
                        <div className="space-y-3">
                            {activeWorkflows.map((workflow) => (
                                <div key={workflow.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{workflow.name}</h3>
                                            <p className="text-sm text-slate-600 mt-1">{workflow.steps?.length || 0} steps</p>
                                        </div>
                                        <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Workflow Executions</CardTitle>
                </CardHeader>
                <CardContent>
                    {executions.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No executions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {executions.slice(0, 10).map((execution) => (
                                <div key={execution.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{execution.workflow_name}</h3>
                                            <p className="text-sm text-slate-600 mt-1 line-clamp-1">{execution.initial_input}</p>
                                        </div>
                                        <span className={`text-sm px-3 py-1 rounded-full ${
                                            execution.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            execution.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                            execution.status === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {execution.status}
                                        </span>
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