import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ConversationList({ 
    conversations, 
    selectedConversation, 
    onSelectConversation, 
    onNewConversation 
}) {
    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
            <div className="p-4 border-b border-slate-200">
                <Button 
                    onClick={onNewConversation}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Conversation
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const isSelected = selectedConversation?.id === conv.id;
                            const lastMessage = conv.messages?.[conv.messages.length - 1];
                            
                            return (
                                <Card
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv)}
                                    className={cn(
                                        "p-3 cursor-pointer transition-all hover:shadow-md",
                                        isSelected 
                                            ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300" 
                                            : "hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className={cn(
                                            "h-4 w-4 mt-0.5 flex-shrink-0",
                                            isSelected ? "text-blue-600" : "text-slate-400"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {conv.metadata?.name || 'Conversation'}
                                            </p>
                                            {lastMessage && (
                                                <p className="text-xs text-slate-500 truncate mt-1">
                                                    {lastMessage.content?.substring(0, 50)}...
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(conv.updated_date), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}