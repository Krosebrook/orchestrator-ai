import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function OAuthTokenManager({ connection }) {
    const [tokenInfo, setTokenInfo] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (connection) {
            // Simulate token info - in production this would come from the connection metadata
            setTokenInfo({
                expires_in: 3600,
                refresh_available: true,
                last_refreshed: connection.created_date,
                auto_refresh: true
            });
        }
    }, [connection]);

    const handleRefreshToken = async () => {
        setRefreshing(true);
        try {
            // Simulate token refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update connection with new token info
            await base44.entities.IntegrationConnection.update(connection.id, {
                last_used: new Date().toISOString(),
                metadata: {
                    ...connection.metadata,
                    token_refreshed_at: new Date().toISOString()
                }
            });

            setTokenInfo({
                ...tokenInfo,
                last_refreshed: new Date().toISOString()
            });

            toast.success('Token refreshed successfully');
        } catch (error) {
            console.error('Token refresh failed:', error);
            toast.error('Failed to refresh token');
        } finally {
            setRefreshing(false);
        }
    };

    const toggleAutoRefresh = async () => {
        const newAutoRefresh = !tokenInfo.auto_refresh;
        setTokenInfo({ ...tokenInfo, auto_refresh: newAutoRefresh });
        
        await base44.entities.IntegrationConnection.update(connection.id, {
            metadata: {
                ...connection.metadata,
                auto_refresh: newAutoRefresh
            }
        });

        toast.success(`Auto-refresh ${newAutoRefresh ? 'enabled' : 'disabled'}`);
    };

    if (!connection || connection.connection_type !== 'oauth') {
        return null;
    }

    const expiresInHours = tokenInfo ? Math.floor(tokenInfo.expires_in / 3600) : 0;
    const isExpiringSoon = expiresInHours < 24;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    OAuth Token Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isExpiringSoon && (
                    <Alert className="border-yellow-300 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-700" />
                        <AlertDescription className="text-yellow-800">
                            Token expires in {expiresInHours} hours. Consider refreshing.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500 mb-1">Token Status</p>
                        <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                        </Badge>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Auto-Refresh</p>
                        <Badge className={tokenInfo?.auto_refresh ? 'bg-blue-600' : 'bg-slate-400'}>
                            {tokenInfo?.auto_refresh ? 'Enabled' : 'Disabled'}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Expires In</p>
                        <p className="font-semibold">{expiresInHours}h</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Last Refreshed</p>
                        <p className="font-semibold text-xs">
                            {tokenInfo && new Date(tokenInfo.last_refreshed).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleRefreshToken}
                        disabled={refreshing}
                        className="flex-1"
                    >
                        {refreshing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Now
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={toggleAutoRefresh}
                        variant="outline"
                        className="flex-1"
                    >
                        {tokenInfo?.auto_refresh ? 'Disable' : 'Enable'} Auto-Refresh
                    </Button>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                        <strong>Auto-Refresh:</strong> When enabled, tokens are automatically refreshed 
                        24 hours before expiration to ensure uninterrupted API access.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}