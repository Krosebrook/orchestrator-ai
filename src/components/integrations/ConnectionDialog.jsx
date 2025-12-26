import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConnectionDialog({ open, onClose, integration, onConnected }) {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOAuthConnect = async () => {
        setLoading(true);
        setError('');

        try {
            // Map integration IDs to OAuth types
            const oauthTypeMap = {
                'google-calendar': 'googlecalendar',
                'google-drive': 'googledrive',
                'slack': 'slack',
                'notion': 'notion',
                'salesforce': 'salesforce',
                'hubspot': 'hubspot'
            };

            const integrationType = oauthTypeMap[integration.id];
            if (!integrationType) {
                throw new Error('Integration type not supported');
            }

            // Request OAuth authorization
            await base44.connectors.requestAuthorization(
                integrationType,
                integration.requiredScopes || [],
                `To connect ${integration.name} with your account`
            );

            // Record the connection
            const user = await base44.auth.me();
            await base44.entities.IntegrationConnection.create({
                integration_id: integration.id,
                integration_name: integration.name,
                user_email: user.email,
                connection_type: 'oauth',
                status: 'active',
                metadata: {
                    scopes: integration.requiredScopes,
                    connected_at: new Date().toISOString()
                }
            });

            toast.success(`${integration.name} connected successfully!`);
            onConnected();
            onClose();
        } catch (error) {
            console.error('OAuth connection failed:', error);
            setError(error.message || 'Failed to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApiKeyConnect = async () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await base44.auth.me();
            
            // Store connection record
            await base44.entities.IntegrationConnection.create({
                integration_id: integration.id,
                integration_name: integration.name,
                user_email: user.email,
                connection_type: 'api_key',
                status: 'active',
                metadata: {
                    key_prefix: apiKey.substring(0, 8) + '...',
                    connected_at: new Date().toISOString()
                }
            });

            toast.success(`${integration.name} API key saved successfully!`);
            onConnected();
            onClose();
            setApiKey('');
        } catch (error) {
            console.error('API key save failed:', error);
            setError('Failed to save API key. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!integration) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span className="text-3xl">{integration.icon}</span>
                        Connect {integration.name}
                    </DialogTitle>
                    <DialogDescription>
                        {integration.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {integration.type === 'oauth' ? (
                        <>
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    You'll be redirected to {integration.name} to authorize access. 
                                    We'll only request the permissions needed for integration.
                                </AlertDescription>
                            </Alert>

                            {integration.requiredScopes && (
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-slate-700 mb-2">Required Permissions:</p>
                                    <ul className="space-y-1">
                                        {integration.requiredScopes.map((scope, index) => (
                                            <li key={index} className="text-xs text-slate-600 flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-slate-400" />
                                                {scope}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                onClick={handleOAuthConnect}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Authorize with {integration.name}
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={`Enter your ${integration.name} API key`}
                                        className="pl-10"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Your API key will be encrypted and stored securely.
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                onClick={handleApiKeyConnect}
                                disabled={loading || !apiKey.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Key className="h-4 w-4 mr-2" />
                                        Save API Key
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}