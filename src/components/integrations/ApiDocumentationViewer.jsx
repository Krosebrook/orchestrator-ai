import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ApiDocumentationViewer({ integrationId, integrationName }) {
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEndpoints();
    }, [integrationId]);

    const loadEndpoints = async () => {
        try {
            const data = await base44.entities.ApiEndpoint.filter({ 
                integration_id: integrationId 
            });
            setEndpoints(data || []);
        } catch (error) {
            console.error('Failed to load endpoints:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const generateMarkdown = () => {
        let markdown = `# ${integrationName} API Documentation\n\n`;
        markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;
        
        endpoints.forEach((endpoint) => {
            markdown += `## ${endpoint.method} ${endpoint.endpoint_path}\n\n`;
            markdown += `${endpoint.description}\n\n`;
            
            if (endpoint.parameters && endpoint.parameters.length > 0) {
                markdown += `### Parameters\n\n`;
                endpoint.parameters.forEach(param => {
                    markdown += `- **${param.name}** (${param.type})${param.required ? ' *required*' : ''}: ${param.description}\n`;
                });
                markdown += '\n';
            }
            
            if (endpoint.response_schema) {
                markdown += `### Response\n\n\`\`\`json\n${JSON.stringify(endpoint.response_schema, null, 2)}\n\`\`\`\n\n`;
            }
            
            markdown += '---\n\n';
        });

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${integrationName}-api-docs.md`;
        a.click();
        toast.success('Documentation downloaded');
    };

    if (loading) {
        return <div className="text-center py-8">Loading documentation...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        API Documentation
                    </CardTitle>
                    <Button onClick={generateMarkdown} size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                        {endpoints.map((endpoint, idx) => (
                            <Card key={idx} className="border-2">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className={
                                            endpoint.method === 'GET' ? 'bg-blue-600' :
                                            endpoint.method === 'POST' ? 'bg-green-600' :
                                            endpoint.method === 'PUT' ? 'bg-orange-600' :
                                            endpoint.method === 'DELETE' ? 'bg-red-600' :
                                            'bg-slate-600'
                                        }>
                                            {endpoint.method}
                                        </Badge>
                                        <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                                            {endpoint.endpoint_path}
                                        </code>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(endpoint.endpoint_path)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 mb-4">{endpoint.description}</p>

                                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold mb-2">Parameters:</p>
                                            <div className="space-y-2">
                                                {endpoint.parameters.map((param, pidx) => (
                                                    <div key={pidx} className="bg-slate-50 p-2 rounded text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <code className="font-semibold">{param.name}</code>
                                                            <Badge variant="outline" className="text-xs">
                                                                {param.type}
                                                            </Badge>
                                                            {param.required && (
                                                                <Badge className="bg-red-100 text-red-700 text-xs">
                                                                    required
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-600 mt-1">{param.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {endpoint.response_schema && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Response Schema:</p>
                                            <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
                                                {JSON.stringify(endpoint.response_schema, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}