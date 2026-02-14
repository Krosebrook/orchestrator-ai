import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingDown, Zap, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveWorkflowOptimizer({ workflows, executions }) {
    const [optimizations, setOptimizations] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOptimizations();
    }, []);

    const loadOptimizations = async () => {
        try {
            const opts = await base44.entities.WorkflowOptimization.list('-created_date', 50);
            setOptimizations(opts || []);
        } catch (error) {
            console.error('Failed to load optimizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeWorkflows = async () => {
        setAnalyzing(true);
        try {
            // Aggregate execution data per workflow
            const workflowStats = {};
            
            executions.forEach(exec => {
                if (!workflowStats[exec.workflow_id]) {
                    workflowStats[exec.workflow_id] = {
                        workflow_id: exec.workflow_id,
                        workflow_name: exec.workflow_name,
                        executions: [],
                        total_executions: 0,
                        successful: 0,
                        failed: 0,
                        total_time: 0,
                        total_cost: 0
                    };
                }
                
                const stats = workflowStats[exec.workflow_id];
                stats.executions.push(exec);
                stats.total_executions++;
                
                if (exec.status === 'completed') stats.successful++;
                if (exec.status === 'failed') stats.failed++;
                if (exec.execution_time_ms) stats.total_time += exec.execution_time_ms;
                if (exec.total_cost) stats.total_cost += exec.total_cost;
            });

            // Prepare analysis data
            const analysisData = Object.values(workflowStats).map(stats => ({
                workflow_id: stats.workflow_id,
                workflow_name: stats.workflow_name,
                total_executions: stats.total_executions,
                success_rate: stats.total_executions > 0 ? (stats.successful / stats.total_executions) * 100 : 0,
                avg_execution_time: stats.total_executions > 0 ? stats.total_time / stats.total_executions : 0,
                avg_cost: stats.total_executions > 0 ? stats.total_cost / stats.total_executions : 0,
                error_rate: stats.total_executions > 0 ? (stats.failed / stats.total_executions) * 100 : 0,
                recent_failures: stats.executions.filter(e => e.status === 'failed').slice(-5)
            }));

            // Call AI to analyze and generate recommendations
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an expert workflow optimization AI. Analyze these workflow execution patterns and identify opportunities for optimization:

${JSON.stringify(analysisData, null, 2)}

For each workflow with issues or optimization opportunities, provide:

1. **Optimization Type**: Choose from: bottleneck_removal, cost_reduction, speed_improvement, error_reduction, agent_reallocation, parallelization
2. **Severity**: low, medium, high, or critical based on impact
3. **Issue Detected**: Clear description of the problem
4. **Root Cause**: Why this is happening
5. **Proposed Changes**: Specific actionable changes with implementation difficulty
6. **Projected Improvements**: Estimated % improvements in metrics
7. **Confidence Score**: 0-100 on how confident you are

Focus on:
- Workflows with success rate < 80%
- Workflows with avg execution time > 5 minutes
- Workflows with high costs
- Recent patterns of failures
- Inefficient agent usage or sequential steps that could be parallelized`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        optimizations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    workflow_id: { type: "string" },
                                    workflow_name: { type: "string" },
                                    optimization_type: { type: "string" },
                                    severity: { type: "string" },
                                    issue_detected: { type: "string" },
                                    root_cause: { type: "string" },
                                    current_metrics: {
                                        type: "object",
                                        properties: {
                                            avg_execution_time: { type: "number" },
                                            success_rate: { type: "number" },
                                            avg_cost: { type: "number" },
                                            error_rate: { type: "number" }
                                        }
                                    },
                                    proposed_changes: {
                                        type: "object",
                                        properties: {
                                            description: { type: "string" },
                                            changes: { type: "array", items: { type: "string" } },
                                            implementation_difficulty: { type: "string" }
                                        }
                                    },
                                    projected_improvements: {
                                        type: "object",
                                        properties: {
                                            execution_time_reduction: { type: "number" },
                                            cost_reduction: { type: "number" },
                                            success_rate_increase: { type: "number" },
                                            error_rate_reduction: { type: "number" }
                                        }
                                    },
                                    confidence_score: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            // Create optimization records
            for (const opt of response.optimizations) {
                await base44.entities.WorkflowOptimization.create({
                    ...opt,
                    status: 'pending'
                });
            }

            toast.success(`Generated ${response.optimizations.length} optimization recommendations`);
            await loadOptimizations();
        } catch (error) {
            console.error('Failed to analyze workflows:', error);
            toast.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const updateOptimizationStatus = async (id, status) => {
        try {
            const updates = { status };
            if (status === 'implemented') {
                updates.implemented_at = new Date().toISOString();
            }
            await base44.entities.WorkflowOptimization.update(id, updates);
            toast.success('Status updated');
            await loadOptimizations();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Update failed');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-blue-100 text-blue-700 border-blue-300';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'bottleneck_removal': return AlertTriangle;
            case 'cost_reduction': return DollarSign;
            case 'speed_improvement': return Zap;
            case 'error_reduction': return XCircle;
            case 'parallelization': return Target;
            default: return TrendingDown;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'implemented': return 'bg-green-100 text-green-700';
            case 'testing': return 'bg-blue-100 text-blue-700';
            case 'approved': return 'bg-purple-100 text-purple-700';
            case 'rejected': return 'bg-slate-100 text-slate-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    const pendingOptimizations = optimizations.filter(o => o.status === 'pending');
    const activeOptimizations = optimizations.filter(o => ['approved', 'testing'].includes(o.status));
    const completedOptimizations = optimizations.filter(o => ['implemented', 'rejected'].includes(o.status));

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                Proactive Workflow Optimization
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                AI-powered analysis of workflow patterns to identify and fix inefficiencies
                            </p>
                        </div>
                        <Button
                            onClick={analyzeWorkflows}
                            disabled={analyzing || workflows.length === 0}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {analyzing ? 'Analyzing...' : 'Analyze Workflows'}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Pending Review</p>
                                <p className="text-2xl font-bold text-amber-600">{pendingOptimizations.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-amber-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Progress</p>
                                <p className="text-2xl font-bold text-blue-600">{activeOptimizations.length}</p>
                            </div>
                            <Target className="h-8 w-8 text-blue-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{completedOptimizations.length}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Optimizations */}
            {pendingOptimizations.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Pending Recommendations</h3>
                    <div className="space-y-4">
                        {pendingOptimizations.map((opt) => {
                            const Icon = getTypeIcon(opt.optimization_type);
                            return (
                                <Card key={opt.id} className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${getSeverityColor(opt.severity)}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-slate-800">{opt.workflow_name}</h4>
                                                            <Badge className={getSeverityColor(opt.severity)}>
                                                                {opt.severity}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {opt.optimization_type.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600">{opt.issue_detected}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={opt.confidence_score} className="w-16 h-2" />
                                                        <span className="text-sm font-semibold">{opt.confidence_score}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Root Cause */}
                                            <div className="bg-slate-50 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-slate-700 uppercase mb-1">Root Cause</p>
                                                <p className="text-sm text-slate-600">{opt.root_cause}</p>
                                            </div>

                                            {/* Current Metrics */}
                                            {opt.current_metrics && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div className="text-center p-2 bg-slate-50 rounded">
                                                        <p className="text-xs text-slate-500">Exec Time</p>
                                                        <p className="text-sm font-semibold">{(opt.current_metrics.avg_execution_time / 1000).toFixed(1)}s</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-slate-50 rounded">
                                                        <p className="text-xs text-slate-500">Success Rate</p>
                                                        <p className="text-sm font-semibold">{opt.current_metrics.success_rate?.toFixed(1)}%</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-slate-50 rounded">
                                                        <p className="text-xs text-slate-500">Avg Cost</p>
                                                        <p className="text-sm font-semibold">${opt.current_metrics.avg_cost?.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-slate-50 rounded">
                                                        <p className="text-xs text-slate-500">Error Rate</p>
                                                        <p className="text-sm font-semibold">{opt.current_metrics.error_rate?.toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Proposed Changes */}
                                            {opt.proposed_changes && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-semibold text-slate-700 uppercase">Proposed Changes</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {opt.proposed_changes.implementation_difficulty}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">{opt.proposed_changes.description}</p>
                                                    <ul className="space-y-1">
                                                        {opt.proposed_changes.changes?.slice(0, 3).map((change, idx) => (
                                                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                                                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <span>{change}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Projected Improvements */}
                                            {opt.projected_improvements && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">Expected Impact</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {opt.projected_improvements.execution_time_reduction > 0 && (
                                                            <div className="text-center">
                                                                <p className="text-xs text-slate-600">Time ↓</p>
                                                                <p className="text-sm font-bold text-green-700">-{opt.projected_improvements.execution_time_reduction}%</p>
                                                            </div>
                                                        )}
                                                        {opt.projected_improvements.cost_reduction > 0 && (
                                                            <div className="text-center">
                                                                <p className="text-xs text-slate-600">Cost ↓</p>
                                                                <p className="text-sm font-bold text-green-700">-{opt.projected_improvements.cost_reduction}%</p>
                                                            </div>
                                                        )}
                                                        {opt.projected_improvements.success_rate_increase > 0 && (
                                                            <div className="text-center">
                                                                <p className="text-xs text-slate-600">Success ↑</p>
                                                                <p className="text-sm font-bold text-green-700">+{opt.projected_improvements.success_rate_increase}%</p>
                                                            </div>
                                                        )}
                                                        {opt.projected_improvements.error_rate_reduction > 0 && (
                                                            <div className="text-center">
                                                                <p className="text-xs text-slate-600">Errors ↓</p>
                                                                <p className="text-sm font-bold text-green-700">-{opt.projected_improvements.error_rate_reduction}%</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    onClick={() => updateOptimizationStatus(opt.id, 'approved')}
                                                    className="flex-1 bg-green-600"
                                                    size="sm"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => updateOptimizationStatus(opt.id, 'testing')}
                                                    variant="outline"
                                                    className="flex-1"
                                                    size="sm"
                                                >
                                                    <Target className="h-4 w-4 mr-1" />
                                                    A/B Test
                                                </Button>
                                                <Button
                                                    onClick={() => updateOptimizationStatus(opt.id, 'rejected')}
                                                    variant="outline"
                                                    className="flex-1"
                                                    size="sm"
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active & Completed */}
            {(activeOptimizations.length > 0 || completedOptimizations.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeOptimizations.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">In Progress</h3>
                            <div className="space-y-3">
                                {activeOptimizations.map((opt) => (
                                    <Card key={opt.id}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-sm">{opt.workflow_name}</p>
                                                    <p className="text-xs text-slate-600">{opt.optimization_type.replace('_', ' ')}</p>
                                                </div>
                                                <Badge className={getStatusColor(opt.status)}>{opt.status}</Badge>
                                            </div>
                                            <Button
                                                onClick={() => updateOptimizationStatus(opt.id, 'implemented')}
                                                size="sm"
                                                className="w-full mt-2"
                                            >
                                                Mark as Implemented
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {completedOptimizations.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Completed</h3>
                            <div className="space-y-3">
                                {completedOptimizations.slice(0, 5).map((opt) => (
                                    <Card key={opt.id} className="opacity-75">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-sm">{opt.workflow_name}</p>
                                                    <p className="text-xs text-slate-600">{opt.optimization_type.replace('_', ' ')}</p>
                                                </div>
                                                <Badge className={getStatusColor(opt.status)}>{opt.status}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!loading && optimizations.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Sparkles className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-4">No optimization recommendations yet</p>
                        <Button
                            onClick={analyzeWorkflows}
                            disabled={analyzing || workflows.length === 0}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Start Analysis
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}