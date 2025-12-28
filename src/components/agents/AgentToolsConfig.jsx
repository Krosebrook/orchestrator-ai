import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, Globe, CheckCircle, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

const OPERATION_ICONS = {
    create: { icon: '➕', color: 'text-green-600', label: 'Create' },
    read: { icon: '👁️', color: 'text-blue-600', label: 'Read' },
    update: { icon: '✏️', color: 'text-yellow-600', label: 'Update' },
    delete: { icon: '🗑️', color: 'text-red-600', label: 'Delete' }
};

export default function AgentToolsConfig({ agent }) {
    const hasEntityTools = agent.tool_configs && agent.tool_configs.length > 0;
    const hasFunctionTools = agent.function_tools && agent.function_tools.length > 0;
    const hasApiCapabilities = agent.api_capabilities?.enabled;

    return (
        <div className="space-y-4">
            {/* Entity CRUD Tools */}
            {hasEntityTools && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">Entity Operations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {agent.tool_configs.map((tool, index) => (
                            <div key={index} className="p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-slate-800">{tool.entity_name}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {tool.allowed_operations.length} operations
                                    </Badge>
                                </div>
                                {tool.description && (
                                    <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {tool.allowed_operations.map((op) => {
                                        const config = OPERATION_ICONS[op];
                                        return (
                                            <Badge 
                                                key={op} 
                                                variant="secondary"
                                                className={cn("text-xs", config?.color)}
                                            >
                                                <span className="mr-1">{config?.icon}</span>
                                                {config?.label || op}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Function Tools */}
            {hasFunctionTools && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-lg">Function Tools</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {agent.function_tools.map((tool, index) => (
                            <div key={index} className="p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">
                                        {tool.function_name}
                                    </span>
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                                        {tool.integration_package}
                                    </Badge>
                                </div>
                                {tool.description && (
                                    <p className="text-xs text-slate-600 mt-1">{tool.description}</p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* API Capabilities */}
            {hasApiCapabilities && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">API Integration</CardTitle>
                        </div>
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
                                <div className="flex flex-wrap gap-2">
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
                                <div className="space-y-2">
                                    {agent.api_capabilities.supported_endpoints.map((endpoint, idx) => (
                                        <div key={idx} className="p-2 bg-green-50 rounded">
                                            <p className="font-semibold text-sm text-slate-800">
                                                {endpoint.service}
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {endpoint.operations.slice(0, 3).map((op) => (
                                                    <span key={op} className="text-xs text-slate-600">
                                                        {op}
                                                    </span>
                                                ))}
                                                {endpoint.operations.length > 3 && (
                                                    <span className="text-xs text-slate-500">
                                                        +{endpoint.operations.length - 3} more
                                                    </span>
                                                )}
                                            </div>
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
                                    {agent.api_capabilities.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {agent.api_capabilities.data_mapping?.enabled && (
                            <div className="p-2 bg-blue-50 rounded">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Data Mapping</p>
                                        <p className="text-xs text-slate-600">
                                            {agent.api_capabilities.data_mapping.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!hasEntityTools && !hasFunctionTools && !hasApiCapabilities && (
                <Card>
                    <CardContent className="py-8 text-center">
                        <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No tools configured for this agent</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}