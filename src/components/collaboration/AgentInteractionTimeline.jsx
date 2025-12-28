import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Users, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AgentInteractionTimeline({ interactions, agents }) {
    const getAgentColor = (agentName) => {
        const colors = [
            'bg-blue-100 text-blue-700',
            'bg-purple-100 text-purple-700',
            'bg-green-100 text-green-700',
            'bg-orange-100 text-orange-700',
            'bg-pink-100 text-pink-700'
        ];
        const index = agents.findIndex(a => a.agent_name === agentName);
        return colors[index % colors.length];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Interaction Timeline ({interactions.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px]">
                    {interactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No interactions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interactions.map((interaction, idx) => (
                                <div key={idx} className="relative pl-8 pb-3">
                                    <div className="absolute left-0 top-0 h-full w-px bg-slate-200" />
                                    <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-blue-600" />
                                    
                                    <div className="bg-white border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {interaction.from_agent === 'user' ? (
                                                    <Badge className="bg-slate-700">
                                                        <User className="h-3 w-3 mr-1" />
                                                        User
                                                    </Badge>
                                                ) : (
                                                    <Badge className={getAgentColor(interaction.from_agent)}>
                                                        {interaction.from_agent}
                                                    </Badge>
                                                )}
                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                {interaction.to_agent === 'all' ? (
                                                    <Badge variant="outline">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        All Agents
                                                    </Badge>
                                                ) : (
                                                    <Badge className={getAgentColor(interaction.to_agent)}>
                                                        {interaction.to_agent}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700">{interaction.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}