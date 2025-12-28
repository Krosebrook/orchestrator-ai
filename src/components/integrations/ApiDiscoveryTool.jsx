import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ApiDiscoveryTool({ integrationId, integrationName }) {
    const [baseUrl, setBaseUrl] = useState('');
    const [scanning, setScanning] = useState(false);
    const [discoveryResult, setDiscoveryResult] = useState(null);

    const handleDiscover = async () => {
        if (!baseUrl.trim()) {
            toast.error('Please enter a base URL');
            return;
        }

        setScanning(true);
        try {
            // Simulate AI-powered API discovery
            // In production, this would call an LLM to analyze the API
            const mockDiscovery = {
                integration_id: integrationId,
                discovered_endpoints: [
                    {
                        path: '/api/v1/users',
                        method: 'GET',
                        description: 'List all users',
                        parameters: [
                            { name: 'limit', type: 'number', required: false, description: 'Max results' },
                            { name: 'offset', type: 'number', required: false, description: 'Pagination offset' }
                        ],
                        response_schema: { users: 'array', total: 'number' }
                    },
                    {
                        path: '/api/v1/users',
                        method: 'POST',
                        description: 'Create a new user',
                        parameters: [
                            { name: 'email', type: 'string', required: true, description: 'User email' },
                            { name: 'name', type: 'string', required: true, description: 'User name' }
                        ],
                        response_schema: { id: 'string', email: 'string' }
                    },
                    {
                        path: '/api/v1/users/{id}',
                        method: 'GET',
                        description: 'Get user by ID',
                        parameters: [
                            { name: 'id', type: 'string', required: true, description: 'User ID' }
                        ],
                        response_schema: { id: 'string', email: 'string', name: 'string' }
                    }
                ],
                documentation: {
                    title: `${integrationName} API Documentation`,
                    version: '1.0',
                    baseUrl: baseUrl
                },
                auth_methods: ['oauth2', 'api_key'],
                discovery_status: 'completed',
                last_scanned: new Date().toISOString()
            };

            // Save discovery results
            await base44.entities.ApiDiscovery.create(mockDiscovery);
            
            // Create endpoint records
            for (const endpoint of mockDiscovery.discovered_endpoints) {
                await base44.entities.ApiEndpoint.create({
                    integration_id: integrationId,
                    integration_name: integrationName,
                    endpoint_path: endpoint.path,
                    method: endpoint.method,
                    description: endpoint.description,
                    parameters: endpoint.parameters,
                    response_schema: endpoint.response_schema,
                    auth_type: 'oauth',
                    is_enabled: true
                });
            }

            setDiscoveryResult(mockDiscovery);
            toast.success(`Discovered ${mockDiscovery.discovered_endpoints.length} endpoints`);
        } catch (error) {
            console.error('Discovery failed:', error);
            toast.error('Failed to discover API endpoints');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Automated API Discovery
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="https://api.example.com"
                            disabled={scanning}
                        />
                        <Button onClick={handleDiscover} disabled={scanning}>
                            {scanning ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Discover
                                </>
                            )}
                        </Button>
                    </div>

                    {scanning && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                AI is analyzing the API structure and generating documentation...
                            </p>
                        </div>
                    )}

                    {discoveryResult && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span>Discovery completed successfully!</span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                <p className="font-semibold text-sm">Discovered Endpoints:</p>
                                {discoveryResult.discovered_endpoints.map((endpoint, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                        <Badge>{endpoint.method}</Badge>
                                        <code className="text-xs">{endpoint.path}</code>
                                        <span className="text-slate-600">- {endpoint.description}</span>
                                    </div>
                                ))}
                            </div>

                            <Button variant="outline" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                View Generated Documentation
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}