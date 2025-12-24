import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AgentCard({ agent, onSelect, isSelected }) {
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
                    <Button 
                        size="sm" 
                        variant={isSelected ? "default" : "outline"}
                        className={isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {isSelected ? 'Selected' : 'Select'}
                    </Button>
                </div>
                <CardTitle className="mt-4">{agent.name}</CardTitle>
                <CardDescription className="text-sm">
                    {agent.description}
                </CardDescription>
                
                {agent.tool_configs && agent.tool_configs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {agent.tool_configs.map((tool, idx) => (
                            <span 
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                            >
                                {tool.entity_name}
                            </span>
                        ))}
                    </div>
                )}
            </CardHeader>
        </Card>
    );
}