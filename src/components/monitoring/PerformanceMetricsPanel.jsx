import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PerformanceMetricsPanel({ agents, metrics }) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = agents.map(agent => {
        const agentMetrics = metrics.filter(m => 
            m.agent_name === agent.name && 
            new Date(m.created_date) > last24Hours
        );

        const successCount = agentMetrics.filter(m => m.status === 'success').length;
        const totalCount = agentMetrics.length;
        const successRate = totalCount > 0 ? successCount / totalCount : 0;

        return {
            name: agent.name,
            totalTasks: totalCount,
            successRate,
            trend: successRate > 0.8 ? 'up' : 'down'
        };
    }).sort((a, b) => b.totalTasks - a.totalTasks);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.slice(0, 8).map((stat) => (
                <Card key={stat.name}>
                    <CardHeader className="pb-2">
                        <p className="text-sm font-semibold truncate">{stat.name}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-bold">{stat.totalTasks}</p>
                                <p className="text-xs text-slate-500">tasks (24h)</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1">
                                    {stat.trend === 'up' ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={`text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.round(stat.successRate * 100)}%
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">success</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}