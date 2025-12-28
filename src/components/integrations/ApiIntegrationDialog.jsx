import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Settings, ArrowRightLeft, Play } from 'lucide-react';
import ApiEndpointBrowser from './ApiEndpointBrowser';
import ApiParameterMapper from './ApiParameterMapper';
import ApiResponseParser from './ApiResponseParser';

export default function ApiIntegrationDialog({ open, onClose, integration, onSave }) {
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [parameterMappings, setParameterMappings] = useState([]);
    const [responseMappings, setResponseMappings] = useState([]);

    const handleSave = () => {
        if (!selectedEndpoint) {
            alert('Please select an API endpoint');
            return;
        }

        const config = {
            integration_id: integration.integration_id,
            integration_name: integration.integration_name,
            endpoint: selectedEndpoint,
            parameter_mappings: parameterMappings,
            response_mappings: responseMappings
        };

        onSave(config);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Configure API Integration
                        {integration && (
                            <span className="text-sm text-slate-500 font-normal">
                                → {integration.integration_name}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="endpoint" className="mt-4">
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="endpoint">
                            <Code className="h-4 w-4 mr-2" />
                            Endpoint
                        </TabsTrigger>
                        <TabsTrigger value="parameters" disabled={!selectedEndpoint}>
                            <Settings className="h-4 w-4 mr-2" />
                            Parameters
                        </TabsTrigger>
                        <TabsTrigger value="response" disabled={!selectedEndpoint}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Response
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="endpoint" className="mt-4">
                        <div className="space-y-4">
                            <div className="text-sm text-slate-600">
                                Select an API endpoint to invoke from this integration
                            </div>
                            <ApiEndpointBrowser
                                integrationId={integration?.integration_id}
                                onSelectEndpoint={setSelectedEndpoint}
                                selectedEndpoint={selectedEndpoint}
                            />
                            {selectedEndpoint && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        ✓ Selected: <strong>{selectedEndpoint.method}</strong> {selectedEndpoint.endpoint_path}
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="parameters" className="mt-4">
                        <div className="space-y-4">
                            <div className="text-sm text-slate-600">
                                Map workflow variables and inputs to API parameters
                            </div>
                            <ApiParameterMapper
                                endpoint={selectedEndpoint}
                                mappings={parameterMappings}
                                onMappingsChange={setParameterMappings}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="response" className="mt-4">
                        <div className="space-y-4">
                            <div className="text-sm text-slate-600">
                                Extract data from API responses to use in subsequent steps
                            </div>
                            <ApiResponseParser
                                responseSchema={selectedEndpoint?.response_schema}
                                mappings={responseMappings}
                                onMappingsChange={setResponseMappings}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!selectedEndpoint}>
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}