import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Eye, MousePointer, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function MarketingDashboard({ user }) {
    const [campaigns, setCampaigns] = useState([]);
    const [contentPieces, setContentPieces] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [campaignsData, contentData] = await Promise.all([
                base44.entities.Campaign.list('-updated_date', 10),
                base44.entities.ContentPiece.list('-updated_date', 10)
            ]);
            setCampaigns(campaignsData || []);
            setContentPieces(contentData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            planning: 'bg-slate-100 text-slate-700',
            active: 'bg-green-100 text-green-700',
            paused: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-blue-100 text-blue-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Marketing Dashboard</h2>
                    <p className="text-slate-600">Campaign performance and content analytics</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active Campaigns</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{activeCampaigns.length}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Budget</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">${totalBudget.toLocaleString()}</p>
                            </div>
                            <DollarSign className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Budget Used</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">
                                    {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                                </p>
                            </div>
                            <MousePointer className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Content Pieces</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{contentPieces.length}</p>
                            </div>
                            <Eye className="h-10 w-10 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaigns */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                    {campaigns.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No campaigns yet. Create your first campaign to get started.</p>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-800">{campaign.name}</h3>
                                                <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                                                <Badge variant="outline">{campaign.type}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                <span>Budget: ${campaign.budget?.toLocaleString() || 0}</span>
                                                <span>Spent: ${campaign.spent?.toLocaleString() || 0}</span>
                                                {campaign.start_date && <span>Start: {campaign.start_date}</span>}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">View Details</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Content Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Content Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    {contentPieces.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No content pieces yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contentPieces.slice(0, 6).map((content) => (
                                <div key={content.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all">
                                    <Badge className="mb-2">{content.type}</Badge>
                                    <h4 className="font-semibold text-slate-800 mb-1">{content.title}</h4>
                                    <p className="text-sm text-slate-600 mb-3">Status: {content.status}</p>
                                    {content.publish_date && (
                                        <p className="text-xs text-slate-500">Publish: {content.publish_date}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}