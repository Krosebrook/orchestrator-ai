import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function HelpTooltip({ content, children, side = "top", className }) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children || (
                        <button className={cn("inline-flex text-slate-400 hover:text-blue-600 transition-colors", className)}>
                            <HelpCircle className="h-4 w-4" />
                        </button>
                    )}
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-xs">
                    <p className="text-sm">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function ContextualHelp({ title, description, side = "right" }) {
    return (
        <HelpTooltip
            content={
                <div className="space-y-1">
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs text-slate-300">{description}</p>
                </div>
            }
            side={side}
        />
    );
}