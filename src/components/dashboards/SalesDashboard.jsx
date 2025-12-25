import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, Target, Plus } from 'lucide-react';

export default function SalesDashboard({ user }) {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const leadsData = await base44.entities.Lead.list('-updated_date', 20);
            setLeads(leadsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-blue-100 text-blue-700',
            contacted: 'bg-purple-100 text-purple-700',
            qualified: 'bg-green-100 text-green-700',
            proposal: 'bg-yellow-100 text-yellow-700',
            negotiation: 'bg-orange-100 text-orange-700',
            closed_won: 'bg-green-500 text-white',
            closed_lost: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const qualifiedLeads = leads.filter(l => l.status === 'qualified');
    const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
    const avgScore = leads.length > 0 ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Sales Dashboard</h2>
                    <p className="text-slate-600">Lead pipeline and deal tracking</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Lead
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Leads</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{leads.length}</p>
                            </div>
                            <Users className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Qualified Leads</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{qualifiedLeads.length}</p>
                            </div>
                            <Target className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Pipeline Value</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">${totalValue.toLocaleString()}</p>
                            </div>
                            <DollarSign className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Avg Lead Score</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{Math.round(avgScore)}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leads Pipeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    {leads.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No leads yet. Add your first lead to start tracking.</p>
                    ) : (
                        <div className="space-y-3">
                            {leads.map((lead) => (
                                <div key={lead.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-800">{lead.name}</h3>
                                                <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                                                {lead.score && (
                                                    <span className="text-sm text-slate-600">Score: {lead.score}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                {lead.company && <span>{lead.company}</span>}
                                                {lead.email && <span>{lead.email}</span>}
                                                {lead.value && <span>Value: ${lead.value.toLocaleString()}</span>}
                                            </div>
                                            {lead.next_action && (
                                                <p className="text-sm text-blue-600 mt-2">Next: {lead.next_action}</p>
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}