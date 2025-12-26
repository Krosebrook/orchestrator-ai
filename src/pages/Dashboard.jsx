import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, User, Settings } from 'lucide-react';
import DashboardCustomizer from '../components/dashboards/DashboardCustomizer';
import ExecutiveDashboard from '../components/dashboards/ExecutiveDashboard';
import MarketingDashboard from '../components/dashboards/MarketingDashboard';
import SalesDashboard from '../components/dashboards/SalesDashboard';
import ProductDashboard from '../components/dashboards/ProductDashboard';
import SupportDashboard from '../components/dashboards/SupportDashboard';
import HRDashboard from '../components/dashboards/HRDashboard';
import DeveloperDashboard from '../components/dashboards/DeveloperDashboard';
import AnalystDashboard from '../components/dashboards/AnalystDashboard';
import ContentCreatorDashboard from '../components/dashboards/ContentCreatorDashboard';
import OperationsDashboard from '../components/dashboards/OperationsDashboard';

const PERSONAS = [
    { id: 'executive', name: 'Executive', component: ExecutiveDashboard },
    { id: 'marketing_manager', name: 'Marketing Manager', component: MarketingDashboard },
    { id: 'sales_rep', name: 'Sales Representative', component: SalesDashboard },
    { id: 'product_manager', name: 'Product Manager', component: ProductDashboard },
    { id: 'customer_support', name: 'Customer Support', component: SupportDashboard },
    { id: 'hr_manager', name: 'HR Manager', component: HRDashboard },
    { id: 'developer', name: 'Developer', component: DeveloperDashboard },
    { id: 'data_analyst', name: 'Data Analyst', component: AnalystDashboard },
    { id: 'content_creator', name: 'Content Creator', component: ContentCreatorDashboard },
    { id: 'operations_manager', name: 'Operations Manager', component: OperationsDashboard }
];

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [selectedPersona, setSelectedPersona] = useState('executive');
    const [loading, setLoading] = useState(true);
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [dashboardLayout, setDashboardLayout] = useState(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
            if (profiles && profiles.length > 0) {
                setUserProfile(profiles[0]);
                setSelectedPersona(profiles[0].persona);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePersonaChange = async (persona) => {
        setSelectedPersona(persona);
        
        if (user) {
            try {
                if (userProfile) {
                    await base44.entities.UserProfile.update(userProfile.id, { persona });
                } else {
                    await base44.entities.UserProfile.create({
                        user_email: user.email,
                        persona
                    });
                }
                await loadUserData();
            } catch (error) {
                console.error('Failed to update persona:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <LayoutDashboard className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const currentPersona = PERSONAS.find(p => p.id === selectedPersona);
    const DashboardComponent = currentPersona?.component;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="h-6 w-6 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
                            <p className="text-sm text-slate-500">{currentPersona?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCustomizer(true)}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Customize
                        </Button>
                        <Select value={selectedPersona} onValueChange={handlePersonaChange}>
                            <SelectTrigger className="w-64">
                                <User className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERSONAS.map((persona) => (
                                    <SelectItem key={persona.id} value={persona.id}>
                                        {persona.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
                {DashboardComponent ? (
                    <DashboardComponent user={user} />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select a Persona</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">Choose a persona from the dropdown to view the dashboard.</p>
                        </CardContent>
                    </Card>
                )}

                <DashboardCustomizer
                    open={showCustomizer}
                    onClose={() => setShowCustomizer(false)}
                    onSave={(layout) => setDashboardLayout(layout)}
                    currentLayout={dashboardLayout}
                />
            </div>
        </div>
    );
}