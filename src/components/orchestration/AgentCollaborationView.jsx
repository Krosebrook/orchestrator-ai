import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentCollaborationView({ orchestrations, handoffs, agents }) {
    // Build collaboration graph
    const collaborationMap = {};
    
    handoffs.forEach(handoff => {
        const key = `${handoff.from_agent}-${handoff.to_agent}`;
        if (!collaborationMap[key]) {
            collaborationMap[key] = {
                from: handoff.from_agent,
                to: handoff.to_agent,
                count: 0,
                successCount: 0,
                avgTime: 0,
                totalTime: 0
            };
        }
        collaborationMap[key].count++;
        if (handoff.status === 'completed') {
            collaborationMap[key].successCount++;
        }
        if (handoff.execution_time_ms) {
            collaborationMap[key].totalTime += handoff.execution_time_ms;
        }
    });

    Object.values(collaborationMap).forEach(collab => {
        if (collab.count > 0) {
            collab.avgTime = collab.totalTime / collab.count;
            collab.successRate = (collab.successCount / collab.count * 100).toFixed(0);
        }
    });

    const collaborations = Object.values(collaborationMap).sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Agent Collaboration Network</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {collaborations.map((collab, idx) => (
                            <div key={idx} className="p-4 border rounded-lg bg-gradient-to-r from-white to-slate-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-blue-600">{collab.from}</Badge>
                                        <span className="text-slate-400">→</span>
                                        <Badge className="bg-purple-600">{collab.to}</Badge>
                                    </div>
                                    <Badge variant="outline">{collab.count} handoffs</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500">Success Rate</p>
                                        <p className="font-semibold">{collab.successRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Avg Handoff Time</p>
                                        <p className="font-semibold">
                                            {(collab.avgTime / 1000).toFixed(2)}s
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total Handoffs</p>
                                        <p className="font-semibold">{collab.count}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}