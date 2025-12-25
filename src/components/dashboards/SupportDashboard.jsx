import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, Clock, Star, AlertTriangle, Plus } from 'lucide-react';

export default function SupportDashboard({ user }) {
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const ticketsData = await base44.entities.Ticket.list('-updated_date', 20);
            setTickets(ticketsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            open: 'bg-red-100 text-red-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            waiting_customer: 'bg-blue-100 text-blue-700',
            resolved: 'bg-green-100 text-green-700',
            closed: 'bg-slate-100 text-slate-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-slate-100 text-slate-700',
            medium: 'bg-blue-100 text-blue-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-500 text-white'
        };
        return colors[priority] || 'bg-slate-100 text-slate-700';
    };

    const openTickets = tickets.filter(t => t.status === 'open');
    const avgResolutionTime = tickets.filter(t => t.resolution_time).reduce((sum, t) => sum + t.resolution_time, 0) / tickets.filter(t => t.resolution_time).length || 0;
    const avgSatisfaction = tickets.filter(t => t.satisfaction_rating).reduce((sum, t) => sum + t.satisfaction_rating, 0) / tickets.filter(t => t.satisfaction_rating).length || 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Support Dashboard</h2>
                    <p className="text-slate-600">Customer support tickets and metrics</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Open Tickets</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{openTickets.length}</p>
                            </div>
                            <Headphones className="h-10 w-10 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Tickets</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{tickets.length}</p>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Avg Resolution (hrs)</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{avgResolutionTime.toFixed(1)}</p>
                            </div>
                            <Clock className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Satisfaction</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{avgSatisfaction.toFixed(1)}/5</p>
                            </div>
                            <Star className="h-10 w-10 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    {tickets.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No tickets yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-800">{ticket.title}</h3>
                                                <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                                                <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                                            </div>
                                            {ticket.description && (
                                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{ticket.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                {ticket.customer_email && <span>Customer: {ticket.customer_email}</span>}
                                                {ticket.type && <span>Type: {ticket.type}</span>}
                                                {ticket.assigned_to && <span>Assigned: {ticket.assigned_to}</span>}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">View</Button>
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