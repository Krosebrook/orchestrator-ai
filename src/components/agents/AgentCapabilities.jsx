import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Database, Code, Wrench, Globe, CheckCircle } from 'lucide-react';

export default function AgentCapabilities({ agent }) {
    const capabilities = agent.capabilities || [];
    const functionTools = agent.function_tools || [];
    const entityTools = agent.tool_configs || [];
    const hasApiCapabilities = agent.api_capabilities?.enabled;

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

            {/* Entity CRUD Tools */}
            {entityTools.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Entity Operations
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
                                        <Badge variant="outline" className="text-xs">
                                            {tool.allowed_operations.length} ops
                                        </Badge>
                                    </div>
                                    {tool.description && (
                                        <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {tool.allowed_operations.map((op, opIdx) => (
                                            <Badge 
                                                key={opIdx} 
                                                className={
                                                    op === 'create' ? 'text-xs bg-green-100 text-green-700' :
                                                    op === 'read' ? 'text-xs bg-blue-100 text-blue-700' :
                                                    op === 'update' ? 'text-xs bg-yellow-100 text-yellow-700' :
                                                    op === 'delete' ? 'text-xs bg-red-100 text-red-700' :
                                                    'text-xs bg-slate-100 text-slate-700'
                                                }
                                            >
                                                {op.toUpperCase()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
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
                                <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm text-slate-800">
                                            {tool.function_name}
                                        </span>
                                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                                            {tool.integration_package}
                                        </Badge>
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

            {/* API Capabilities */}
            {hasApiCapabilities && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Globe className="h-4 w-4 text-green-600" />
                            API Integration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-slate-600">
                            {agent.api_capabilities.description}
                        </p>

                        {agent.api_capabilities.supported_methods && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                    HTTP Methods
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {agent.api_capabilities.supported_methods.map((method) => (
                                        <Badge 
                                            key={method}
                                            className="bg-green-100 text-green-700 text-xs"
                                        >
                                            {method}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {agent.api_capabilities.supported_endpoints && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Supported Services
                                </p>
                                <div className="space-y-1">
                                    {agent.api_capabilities.supported_endpoints.map((endpoint, idx) => (
                                        <div key={idx} className="text-xs text-slate-700">
                                            <span className="font-medium">{endpoint.service}</span>
                                            <span className="text-slate-500 ml-2">
                                                ({endpoint.operations.length} operations)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {agent.api_capabilities.features && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Features
                                </p>
                                <div className="space-y-1">
                                    {agent.api_capabilities.features.slice(0, 4).map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {capabilities.length === 0 && functionTools.length === 0 && entityTools.length === 0 && !hasApiCapabilities && (
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