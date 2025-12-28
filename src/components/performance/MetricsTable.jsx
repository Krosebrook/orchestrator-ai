import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

export default function MetricsTable({ metrics }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortField, setSortField] = useState('created_date');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    let filtered = metrics.filter(m => {
        const matchesSearch = m.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.metric_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || m.metric_type === filterType;
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (sortField === 'created_date') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-700';
            case 'failure': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle className="text-base">Detailed Metrics</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="pl-10 w-48"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="task_completion">Task Completion</SelectItem>
                                <SelectItem value="api_call">API Call</SelectItem>
                                <SelectItem value="workflow_execution">Workflow</SelectItem>
                                <SelectItem value="user_satisfaction">Satisfaction</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failure">Failure</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead 
                                    className="cursor-pointer"
                                    onClick={() => handleSort('agent_name')}
                                >
                                    Agent <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead 
                                    className="cursor-pointer"
                                    onClick={() => handleSort('execution_time_ms')}
                                >
                                    Time <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead 
                                    className="cursor-pointer"
                                    onClick={() => handleSort('created_date')}
                                >
                                    Date <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No metrics found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.slice(0, 100).map((metric) => (
                                    <TableRow key={metric.id}>
                                        <TableCell className="font-medium">{metric.agent_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {metric.metric_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(metric.status)}>
                                                {metric.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {metric.execution_time_ms 
                                                ? `${(metric.execution_time_ms / 1000).toFixed(2)}s`
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {metric.satisfaction_rating 
                                                ? `${metric.satisfaction_rating}/5`
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {format(new Date(metric.created_date), 'MMM d, HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {filtered.length > 100 && (
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        Showing 100 of {filtered.length} results
                    </p>
                )}
            </CardContent>
        </Card>
    );
}