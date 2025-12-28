import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AgentErrorLogViewer({ agentName }) {
    const [errors, setErrors] = useState([]);
    const [expandedError, setExpandedError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadErrors();
    }, [agentName]);

    const loadErrors = async () => {
        try {
            const errorData = await base44.entities.AgentErrorLog.filter(
                { agent_name: agentName },
                '-created_date',
                50
            );
            setErrors(errorData || []);
        } catch (error) {
            console.error('Failed to load errors:', error);
        } finally {
            setLoading(false);
        }
    };

    const markResolved = async (errorId, notes) => {
        await base44.entities.AgentErrorLog.update(errorId, {
            resolved: true,
            resolution_notes: notes
        });
        loadErrors();
    };

    const getErrorIcon = (type) => {
        const icons = {
            timeout: <Clock className="h-4 w-4" />,
            api_error: <AlertCircle className="h-4 w-4" />,
            validation_error: <AlertCircle className="h-4 w-4" />,
            system_error: <AlertCircle className="h-4 w-4" />,
            integration_error: <AlertCircle className="h-4 w-4" />
        };
        return icons[type] || <AlertCircle className="h-4 w-4" />;
    };

    const getErrorColor = (type) => {
        const colors = {
            timeout: 'bg-yellow-100 text-yellow-700',
            api_error: 'bg-red-100 text-red-700',
            validation_error: 'bg-orange-100 text-orange-700',
            system_error: 'bg-red-100 text-red-700',
            integration_error: 'bg-purple-100 text-purple-700'
        };
        return colors[type] || 'bg-slate-100 text-slate-700';
    };

    if (loading) return <div className="text-sm text-slate-500">Loading errors...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Error Log ({errors.length})
                    </span>
                    <Badge className={errors.filter(e => !e.resolved).length > 0 ? 'bg-red-600' : 'bg-green-600'}>
                        {errors.filter(e => !e.resolved).length} unresolved
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {errors.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">No errors recorded</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {errors.map((error) => (
                                <div key={error.id} className="border rounded-lg p-3">
                                    <div 
                                        className="flex items-start justify-between cursor-pointer"
                                        onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={getErrorColor(error.error_type)}>
                                                    {getErrorIcon(error.error_type)}
                                                    <span className="ml-1">{error.error_type}</span>
                                                </Badge>
                                                {error.resolved && (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Resolved
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-slate-800">{error.error_message}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatDistanceToNow(new Date(error.created_date), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {expandedError === error.id ? (
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        )}
                                    </div>
                                    
                                    {expandedError === error.id && (
                                        <div className="mt-3 space-y-2 text-xs">
                                            {error.stack_trace && (
                                                <div className="bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto">
                                                    <pre>{error.stack_trace}</pre>
                                                </div>
                                            )}
                                            {error.context && (
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="font-semibold mb-1">Context:</p>
                                                    <pre>{JSON.stringify(error.context, null, 2)}</pre>
                                                </div>
                                            )}
                                            {error.resolution_notes && (
                                                <div className="bg-green-50 p-2 rounded">
                                                    <p className="font-semibold mb-1">Resolution:</p>
                                                    <p>{error.resolution_notes}</p>
                                                </div>
                                            )}
                                            {!error.resolved && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => markResolved(error.id, 'Marked as resolved')}
                                                >
                                                    Mark as Resolved
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}