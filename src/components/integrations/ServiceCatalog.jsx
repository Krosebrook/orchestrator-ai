import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Zap } from 'lucide-react';

const SERVICE_CATALOG = [
    {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'CRM',
        description: 'Sync leads, contacts, and opportunities',
        icon: '☁️',
        resources: ['Leads', 'Contacts', 'Accounts', 'Opportunities'],
        popular: true
    },
    {
        id: 'hubspot',
        name: 'HubSpot',
        category: 'CRM',
        description: 'Marketing and sales automation',
        icon: '🧲',
        resources: ['Contacts', 'Companies', 'Deals', 'Tickets'],
        popular: true
    },
    {
        id: 'slack',
        name: 'Slack',
        category: 'Communication',
        description: 'Team communication and notifications',
        icon: '💬',
        resources: ['Messages', 'Channels', 'Users'],
        popular: true
    },
    {
        id: 'asana',
        name: 'Asana',
        category: 'Project Management',
        description: 'Task and project tracking',
        icon: '✅',
        resources: ['Tasks', 'Projects', 'Teams']
    },
    {
        id: 'jira',
        name: 'Jira',
        category: 'Project Management',
        description: 'Issue tracking and agile project management',
        icon: '🔷',
        resources: ['Issues', 'Projects', 'Sprints']
    },
    {
        id: 'notion',
        name: 'Notion',
        category: 'Productivity',
        description: 'Wiki, docs, and project management',
        icon: '📝',
        resources: ['Pages', 'Databases', 'Blocks']
    },
    {
        id: 'mailchimp',
        name: 'Mailchimp',
        category: 'Marketing',
        description: 'Email marketing automation',
        icon: '📧',
        resources: ['Lists', 'Campaigns', 'Subscribers']
    },
    {
        id: 'stripe',
        name: 'Stripe',
        category: 'Payments',
        description: 'Payment processing and subscriptions',
        icon: '💳',
        resources: ['Customers', 'Payments', 'Subscriptions']
    }
];

export default function ServiceCatalog({ onConnect, connectedServices = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['all', ...new Set(SERVICE_CATALOG.map(s => s.category))];

    const filteredServices = SERVICE_CATALOG.filter(service => {
        const matchesSearch = 
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const isConnected = (serviceId) => connectedServices.includes(serviceId);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Service Catalog</h2>
                <p className="text-slate-600">Discover and connect third-party services</p>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search services..."
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className="capitalize"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{service.icon}</div>
                                    <div>
                                        <CardTitle className="text-base">{service.name}</CardTitle>
                                        <Badge variant="outline" className="mt-1 text-xs">
                                            {service.category}
                                        </Badge>
                                    </div>
                                </div>
                                {service.popular && (
                                    <Badge className="bg-orange-100 text-orange-700">
                                        Popular
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="text-sm">
                                {service.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-2">Available Resources:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {service.resources.map((resource, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {resource}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => onConnect(service)}
                                    disabled={isConnected(service.id)}
                                    className="w-full"
                                    variant={isConnected(service.id) ? 'secondary' : 'default'}
                                >
                                    {isConnected(service.id) ? (
                                        <>Connected</>
                                    ) : (
                                        <>
                                            <Zap className="h-4 w-4 mr-2" />
                                            Connect
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}