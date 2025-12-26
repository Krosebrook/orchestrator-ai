import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Sparkles, GitBranch, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AgentCard({ agent, onSelect, isSelected, onManageVersions }) {
    const capabilities = agent.capabilities || [];
    const functionTools = agent.function_tools || [];

    return (
        <Card 
            className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                isSelected ? "border-blue-500 shadow-md" : "hover:border-slate-300"
            )}
            onClick={() => onSelect(agent)}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                        {onManageVersions && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onManageVersions(agent);
                                }}
                            >
                                <GitBranch className="h-4 w-4 mr-1" />
                                Versions
                            </Button>
                        )}
                        <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            className={isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {isSelected ? 'Selected' : 'Select'}
                        </Button>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <CardTitle>{agent.name}</CardTitle>
                    {agent.version && (
                        <Badge variant="outline" className="text-xs">v{agent.version}</Badge>
                    )}
                </div>
                <CardDescription className="text-sm">
                    {agent.description}
                </CardDescription>
                
                <div className="mt-3 space-y-2">
                    {capabilities.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-slate-500" />
                            <div className="flex flex-wrap gap-1">
                                {capabilities.slice(0, 3).map((cap, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs capitalize">
                                        {cap.replace(/_/g, ' ')}
                                    </Badge>
                                ))}
                                {capabilities.length > 3 && (
                                    <Badge variant="outline" className="text-xs">+{capabilities.length - 3}</Badge>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {(agent.tool_configs || functionTools).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {agent.tool_configs?.slice(0, 2).map((tool, idx) => (
                                <span 
                                    key={idx}
                                    className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                                >
                                    {tool.entity_name}
                                </span>
                            ))}
                            {functionTools.length > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    {functionTools.length} function{functionTools.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}