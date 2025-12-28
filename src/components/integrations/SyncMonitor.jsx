import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SyncMonitor({ syncs, onEdit, onDelete, onToggle, onSync }) {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'paused':
                return <Pause className="h-4 w-4 text-yellow-600" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'paused':
                return 'bg-yellow-100 text-yellow-700';
            case 'error':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-4">
            {syncs.map((sync) => (
                <Card key={sync.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-base">{sync.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        {sync.entity_name}
                                    </Badge>
                                    <span className="text-xs text-slate-400">↔</span>
                                    <Badge variant="outline" className="text-xs">
                                        {sync.integration_name} - {sync.external_resource}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(sync.status)}
                                <Badge className={getStatusColor(sync.status)}>
                                    {sync.status}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 space-y-1">
                                <p>
                                    <span className="font-medium">Direction:</span> {sync.sync_direction}
                                </p>
                                <p>
                                    <span className="font-medium">Frequency:</span> {sync.sync_frequency}
                                </p>
                                {sync.last_sync && (
                                    <p>
                                        <span className="font-medium">Last sync:</span>{' '}
                                        {formatDistanceToNow(new Date(sync.last_sync), { addSuffix: true })}
                                    </p>
                                )}
                                <p>
                                    <span className="font-medium">Records synced:</span> {sync.sync_count || 0}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSync(sync)}
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Sync Now
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onToggle(sync)}
                                >
                                    {sync.status === 'active' ? (
                                        <Pause className="h-3 w-3 mr-1" />
                                    ) : (
                                        <Play className="h-3 w-3 mr-1" />
                                    )}
                                    {sync.status === 'active' ? 'Pause' : 'Resume'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(sync)}
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete(sync)}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {syncs.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <RefreshCw className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No sync configurations yet</p>
                        <p className="text-sm text-slate-400 mt-1">Set up data synchronization to keep services in sync</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}