import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, Clock, Star } from 'lucide-react';

export default function PerformanceOverview({ metrics }) {
    const taskMetrics = metrics.filter(m => m.metric_type === 'task_completion');
    const apiMetrics = metrics.filter(m => m.metric_type === 'api_call');
    const workflowMetrics = metrics.filter(m => m.metric_type === 'workflow_execution');
    const satisfactionMetrics = metrics.filter(m => m.metric_type === 'user_satisfaction' && m.satisfaction_rating);

    const completionRate = taskMetrics.length > 0
        ? ((taskMetrics.filter(m => m.status === 'success').length / taskMetrics.length) * 100).toFixed(1)
        : 0;

    const apiSuccessRate = apiMetrics.length > 0
        ? ((apiMetrics.filter(m => m.status === 'success').length / apiMetrics.length) * 100).toFixed(1)
        : 0;

    const avgExecutionTime = workflowMetrics.length > 0
        ? (workflowMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / workflowMetrics.length / 1000).toFixed(2)
        : 0;

    const avgSatisfaction = satisfactionMetrics.length > 0
        ? (satisfactionMetrics.reduce((sum, m) => sum + m.satisfaction_rating, 0) / satisfactionMetrics.length).toFixed(1)
        : 0;

    const stats = [
        {
            label: 'Task Completion Rate',
            value: `${completionRate}%`,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            trend: completionRate >= 80 ? 'up' : 'down'
        },
        {
            label: 'API Success Rate',
            value: `${apiSuccessRate}%`,
            icon: CheckCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            trend: apiSuccessRate >= 90 ? 'up' : 'down'
        },
        {
            label: 'Avg Execution Time',
            value: `${avgExecutionTime}s`,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            trend: avgExecutionTime <= 5 ? 'up' : 'down'
        },
        {
            label: 'User Satisfaction',
            value: `${avgSatisfaction}/5`,
            icon: Star,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            trend: avgSatisfaction >= 4 ? 'up' : 'down'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
                
                return (
                    <Card key={index}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <TrendIcon className={`h-5 w-5 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}