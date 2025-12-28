import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Activity, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CollaborationSessionCard({ session, onClick }) {
    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-700',
            paused: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-blue-100 text-blue-700',
            failed: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    return (
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={onClick}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{session.description}</p>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                        {session.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-slate-600">Goal:</span>
                        <span className="font-medium">{session.goal}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-slate-600">Agents:</span>
                        <div className="flex gap-1">
                            {session.participating_agents?.slice(0, 3).map((agent, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                    {agent.agent_name}
                                </Badge>
                            ))}
                            {session.participating_agents?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{session.participating_agents.length - 3}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {session.current_phase && (
                        <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-green-600" />
                            <span className="text-slate-600">Phase:</span>
                            <span className="font-medium">{session.current_phase}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                        <span>{session.interactions?.length || 0} interactions</span>
                        <span>{session.proposals?.length || 0} proposals</span>
                        <span>{formatDistanceToNow(new Date(session.updated_date), { addSuffix: true })}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}