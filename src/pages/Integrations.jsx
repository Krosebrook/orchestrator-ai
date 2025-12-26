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
    Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function IntegrationsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('available');

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
        
        if (integration.type === 'oauth') {
            toast.info(`OAuth connection for ${integration.name} would be initiated here`);
        } else {
            toast.info(`API key configuration for ${integration.name} would open here`);
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
                                    <p className="text-3xl font-bold text-slate-800">0</p>
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
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="available">Available</TabsTrigger>
                        <TabsTrigger value="coming_soon">Coming Soon</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {filteredIntegrations.length === 0 ? (
                            <Card>
                                <CardContent className="pt-12 pb-12 text-center">
                                    <Plug className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">No integrations found matching your criteria</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredIntegrations.map((integration) => (
                                    <Card key={integration.id} className="border-2 hover:shadow-lg transition-all">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-4xl">{integration.icon}</div>
                                                    <div>
                                                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "mt-1",
                                                                integration.status === 'available' && "border-green-500 text-green-700",
                                                                integration.status === 'coming_soon' && "border-orange-500 text-orange-700"
                                                            )}
                                                        >
                                                            {integration.status === 'available' ? 'Available' : 'Coming Soon'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <CardDescription className="mt-2">
                                                {integration.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600">Type:</span>
                                                    <Badge variant="outline">
                                                        {integration.type === 'oauth' ? 'OAuth' : 'API Key'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600">Category:</span>
                                                    <Badge variant="outline" className="capitalize">
                                                        {integration.category}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    className="w-full mt-4"
                                                    variant={integration.status === 'available' ? 'default' : 'outline'}
                                                    onClick={() => handleConnect(integration)}
                                                    disabled={integration.status === 'coming_soon'}
                                                >
                                                    {integration.status === 'available' ? (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Connect
                                                        </>
                                                    ) : (
                                                        'Coming Soon'
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
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
            </div>
        </div>
    );
}