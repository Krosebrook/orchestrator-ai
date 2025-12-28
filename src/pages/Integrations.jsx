import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plug, 
    CheckCircle, 
    XCircle, 
    Settings, 
    Plus, 
    Search,
    Globe,
    Database,
    Webhook,
    Key,
    Zap,
    Trash2,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import ConnectionDialog from '../components/integrations/ConnectionDialog';
import ServiceCatalog from '../components/integrations/ServiceCatalog';
import SyncConfigurationDialog from '../components/integrations/SyncConfigurationDialog';
import SyncMonitor from '../components/integrations/SyncMonitor';

export default function IntegrationsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('connections');
    const [connections, setConnections] = useState([]);
    const [syncConfigs, setSyncConfigs] = useState([]);
    const [entities, setEntities] = useState(['Lead', 'Ticket', 'Task', 'Campaign', 'ContentPiece']);
    const [user, setUser] = useState(null);
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [showConnectionDialog, setShowConnectionDialog] = useState(false);
    const [showSyncDialog, setShowSyncDialog] = useState(false);

    useEffect(() => {
        loadUserAndConnections();
    }, []);

    const loadUserAndConnections = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const [userConnections, syncs] = await Promise.all([
                base44.entities.IntegrationConnection.filter({
                    user_email: currentUser.email
                }),
                base44.entities.SyncConfiguration.list('-updated_date')
            ]);
            
            setConnections(userConnections || []);
            setSyncConfigs(syncs || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const isConnected = (integrationId) => {
        return connections.some(
            conn => conn.integration_id === integrationId && conn.status === 'active'
        );
    };

    const getConnection = (integrationId) => {
        return connections.find(
            conn => conn.integration_id === integrationId && conn.status === 'active'
        );
    };

    const integrations = [
        {
            id: 'google-calendar',
            name: 'Google Calendar',
            category: 'productivity',
            description: 'Access and manage Google Calendar events',
            icon: '📅',
            status: 'available',
            type: 'oauth',
            requiredScopes: ['calendar.readonly', 'calendar.events']
        },
        {
            id: 'google-drive',
            name: 'Google Drive',
            category: 'storage',
            description: 'Access and manage files in Google Drive',
            icon: '📁',
            status: 'available',
            type: 'oauth',
            requiredScopes: ['drive.file']
        },
        {
            id: 'slack',
            name: 'Slack',
            category: 'communication',
            description: 'Send messages and interact with Slack workspaces',
            icon: '💬',
            status: 'available',
            type: 'oauth',
            requiredScopes: ['chat:write', 'channels:read']
        },
        {
            id: 'notion',
            name: 'Notion',
            category: 'productivity',
            description: 'Access and manage Notion workspaces and databases',
            icon: '📝',
            status: 'available',
            type: 'oauth',
            requiredScopes: ['read_content', 'update_content']
        },
        {
            id: 'salesforce',
            name: 'Salesforce',
            category: 'crm',
            description: 'Access and manage Salesforce CRM data',
            icon: '☁️',
            status: 'available',
            type: 'oauth',
            requiredScopes: ['api', 'refresh_token']
        },
        {
            id: 'hubspot',
            name: 'HubSpot',
            category: 'crm',
            description: 'Manage contacts, deals, and marketing campaigns',
            icon: '🎯',
            status: 'available',
            type: 'oauth',
            requiredScopes: ['contacts', 'crm.objects.deals.read']
        },
        {
            id: 'stripe',
            name: 'Stripe',
            category: 'payment',
            description: 'Process payments and manage subscriptions',
            icon: '💳',
            status: 'coming_soon',
            type: 'api_key'
        },
        {
            id: 'openai',
            name: 'OpenAI',
            category: 'ai',
            description: 'Access GPT models and AI capabilities',
            icon: '🤖',
            status: 'coming_soon',
            type: 'api_key'
        },
        {
            id: 'sendgrid',
            name: 'SendGrid',
            category: 'email',
            description: 'Send transactional and marketing emails',
            icon: '✉️',
            status: 'coming_soon',
            type: 'api_key'
        },
        {
            id: 'twilio',
            name: 'Twilio',
            category: 'communication',
            description: 'Send SMS and make voice calls',
            icon: '📱',
            status: 'coming_soon',
            type: 'api_key'
        }
    ];

    const categories = [
        { id: 'all', name: 'All', icon: Globe },
        { id: 'productivity', name: 'Productivity', icon: Zap },
        { id: 'communication', name: 'Communication', icon: Webhook },
        { id: 'crm', name: 'CRM', icon: Database },
        { id: 'payment', name: 'Payment', icon: Key },
        { id: 'ai', name: 'AI', icon: Settings }
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredIntegrations = integrations.filter(integration => {
        const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        const matchesTab = activeTab === 'all' || 
                          (activeTab === 'available' && integration.status === 'available') ||
                          (activeTab === 'coming_soon' && integration.status === 'coming_soon');
        return matchesSearch && matchesCategory && matchesTab;
    });

    const handleConnect = (integration) => {
        if (integration.status === 'coming_soon') {
            toast.info(`${integration.name} integration coming soon!`);
            return;
        }
        
        setSelectedIntegration(integration);
        setShowConnectionDialog(true);
    };

    const handleDisconnect = async (integration) => {
        if (!confirm(`Disconnect ${integration.name}?`)) return;

        try {
            const connection = getConnection(integration.id);
            if (connection) {
                await base44.entities.IntegrationConnection.update(connection.id, {
                    status: 'revoked'
                });
                toast.success(`${integration.name} disconnected`);
                await loadUserAndConnections();
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
            toast.error('Failed to disconnect');
        }
    };

    const handleConfigureSync = (integration) => {
        setSelectedIntegration(integration);
        setShowSyncDialog(true);
    };

    const handleSaveSync = async (syncConfig) => {
        try {
            await base44.entities.SyncConfiguration.create(syncConfig);
            toast.success('Sync configuration created');
            await loadUserAndConnections();
            setShowSyncDialog(false);
        } catch (error) {
            console.error('Failed to create sync:', error);
            toast.error('Failed to create sync configuration');
        }
    };

    const handleToggleSync = async (sync) => {
        const newStatus = sync.status === 'active' ? 'paused' : 'active';
        try {
            await base44.entities.SyncConfiguration.update(sync.id, { status: newStatus });
            toast.success(`Sync ${newStatus === 'active' ? 'resumed' : 'paused'}`);
            await loadUserAndConnections();
        } catch (error) {
            console.error('Failed to toggle sync:', error);
            toast.error('Failed to update sync');
        }
    };

    const handleSyncNow = async (sync) => {
        toast.info('Manual sync triggered - this would sync data now');
        // In production, this would trigger actual sync logic
    };

    const handleDeleteSync = async (sync) => {
        if (!confirm(`Delete sync configuration "${sync.name}"?`)) return;
        
        try {
            await base44.entities.SyncConfiguration.delete(sync.id);
            toast.success('Sync configuration deleted');
            await loadUserAndConnections();
        } catch (error) {
            console.error('Failed to delete sync:', error);
            toast.error('Failed to delete sync');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Integrations & Connections
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Connect your favorite tools and services to enhance your AI workflows
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Integrations</p>
                                    <p className="text-3xl font-bold text-slate-800">{integrations.length}</p>
                                </div>
                                <Plug className="h-10 w-10 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Available Now</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {integrations.filter(i => i.status === 'available').length}
                                    </p>
                                </div>
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Connected</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {connections.filter(c => c.status === 'active').length}
                                    </p>
                                </div>
                                <Zap className="h-10 w-10 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Coming Soon</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {integrations.filter(i => i.status === 'coming_soon').length}
                                    </p>
                                </div>
                                <Settings className="h-10 w-10 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search integrations..."
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    return (
                                        <Button
                                            key={category.id}
                                            variant={selectedCategory === category.id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedCategory(category.id)}
                                            className="whitespace-nowrap"
                                        >
                                            <Icon className="h-4 w-4 mr-1" />
                                            {category.name}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white">
                        <TabsTrigger value="connections">
                            <Plug className="h-4 w-4 mr-2" />
                            My Connections
                        </TabsTrigger>
                        <TabsTrigger value="catalog">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Service Catalog
                        </TabsTrigger>
                        <TabsTrigger value="sync">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Data Sync
                        </TabsTrigger>
                    </TabsList>

                    {/* My Connections Tab */}
                    <TabsContent value="connections" className="mt-6">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <p className="text-slate-600">Manage your connected services</p>
                                <Button onClick={() => setActiveTab('catalog')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Connection
                                </Button>
                            </div>

                            {connections.filter(c => c.status === 'active').length === 0 ? (
                                <Card>
                                    <CardContent className="pt-12 pb-12 text-center">
                                        <Plug className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 mb-4">No connections yet</p>
                                        <Button onClick={() => setActiveTab('catalog')}>
                                            Browse Service Catalog
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {connections.filter(c => c.status === 'active').map((connection) => {
                                        const integration = integrations.find(i => i.id === connection.integration_id);
                                        return (
                                            <Card key={connection.id}>
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-3xl">{integration?.icon || '🔌'}</div>
                                                            <div>
                                                                <CardTitle className="text-base">
                                                                    {connection.integration_name}
                                                                </CardTitle>
                                                                <Badge className="mt-1 bg-green-100 text-green-700">
                                                                    Connected
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleConfigureSync(connection)}
                                                            className="flex-1"
                                                        >
                                                            <RefreshCw className="h-3 w-3 mr-1" />
                                                            Configure Sync
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDisconnect(integration)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Service Catalog Tab */}
                    <TabsContent value="catalog" className="mt-6">
                        <ServiceCatalog
                            onConnect={handleConnect}
                            connectedServices={connections.filter(c => c.status === 'active').map(c => c.integration_id)}
                        />
                    </TabsContent>

                    {/* Data Sync Tab */}
                    <TabsContent value="sync" className="mt-6">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">Data Synchronization</h2>
                                    <p className="text-slate-600">Configure automatic data sync between services</p>
                                </div>
                                <Button 
                                    onClick={() => setShowSyncDialog(true)}
                                    disabled={connections.filter(c => c.status === 'active').length === 0}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Sync
                                </Button>
                            </div>

                            <SyncMonitor
                                syncs={syncConfigs}
                                onEdit={handleConfigureSync}
                                onDelete={handleDeleteSync}
                                onToggle={handleToggleSync}
                                onSync={handleSyncNow}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Custom Integration CTA */}
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                    <Settings className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Need a Custom Integration?</h3>
                                    <p className="text-sm text-slate-600">
                                        Create custom integrations using our backend functions and API connector
                                    </p>
                                </div>
                            </div>
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                                Learn More
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Connection Dialog */}
                <ConnectionDialog
                    open={showConnectionDialog}
                    onClose={() => {
                        setShowConnectionDialog(false);
                        setSelectedIntegration(null);
                    }}
                    integration={selectedIntegration}
                    onConnected={loadUserAndConnections}
                />

                {/* Sync Configuration Dialog */}
                <SyncConfigurationDialog
                    open={showSyncDialog}
                    onClose={() => setShowSyncDialog(false)}
                    integration={selectedIntegration}
                    entities={entities}
                    onSave={handleSaveSync}
                />
            </div>
        </div>
    );
}