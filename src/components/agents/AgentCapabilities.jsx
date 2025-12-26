import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Database, Code, Wrench } from 'lucide-react';

export default function AgentCapabilities({ agent }) {
    const capabilities = agent.capabilities || [];
    const functionTools = agent.function_tools || [];
    const entityTools = agent.tool_configs || [];

    return (
        <div className="space-y-4">
            {/* Capabilities */}
            {capabilities.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Capabilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {capabilities.map((cap, idx) => (
                                <Badge key={idx} variant="outline" className="capitalize">
                                    {cap.replace(/_/g, ' ')}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Function Tools */}
            {functionTools.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Function Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {functionTools.map((tool, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm text-slate-800">
                                            {tool.integration_package}.{tool.function_name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">Function</Badge>
                                    </div>
                                    {tool.description && (
                                        <p className="text-xs text-slate-600">{tool.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Entity Tools */}
            {entityTools.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Entity Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {entityTools.map((tool, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm text-slate-800">
                                            {tool.entity_name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">Entity</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {tool.allowed_operations.map((op, opIdx) => (
                                            <Badge key={opIdx} className="text-xs bg-blue-100 text-blue-700">
                                                {op}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {capabilities.length === 0 && functionTools.length === 0 && entityTools.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center text-slate-500">
                        <Wrench className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No tools or capabilities configured</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}