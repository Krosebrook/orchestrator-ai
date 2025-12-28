import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Zap, Code, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const METHOD_COLORS = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-orange-100 text-orange-700',
    PATCH: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700'
};

export default function ApiEndpointBrowser({ integrationId, onSelectEndpoint, selectedEndpoint }) {
    const [endpoints, setEndpoints] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEndpoints();
    }, [integrationId]);

    const loadEndpoints = async () => {
        try {
            const data = await base44.entities.ApiEndpoint.filter({
                integration_id: integrationId,
                is_enabled: true
            });
            setEndpoints(data || []);
        } catch (error) {
            console.error('Failed to load endpoints:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEndpoints = endpoints.filter(e =>
        e.endpoint_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="text-center py-8 text-slate-500">Loading endpoints...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search endpoints..."
                    className="pl-10"
                />
            </div>

            {filteredEndpoints.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Code className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No API endpoints available</p>
                    <p className="text-xs mt-1">Configure endpoints for this integration</p>
                </div>
            ) : (
                <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                        {filteredEndpoints.map((endpoint) => (
                            <Card
                                key={endpoint.id}
                                onClick={() => onSelectEndpoint(endpoint)}
                                className={cn(
                                    "cursor-pointer transition-all hover:shadow-md",
                                    selectedEndpoint?.id === endpoint.id && "border-2 border-blue-500"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={METHOD_COLORS[endpoint.method]}>
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="text-sm font-mono text-slate-700">
                                                    {endpoint.endpoint_path}
                                                </code>
                                            </div>
                                            {endpoint.description && (
                                                <p className="text-sm text-slate-600">{endpoint.description}</p>
                                            )}
                                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {endpoint.parameters.slice(0, 3).map((param, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {param.name}
                                                        </Badge>
                                                    ))}
                                                    {endpoint.parameters.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{endpoint.parameters.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}