import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import moment from 'moment';

export default function AlertsPanel({ alerts, onAcknowledge, onResolve }) {
    const severityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    const typeLabels = {
        anomaly: 'Anomaly',
        performance_degradation: 'Performance',
        error_spike: 'Error Spike',
        overload: 'Overload',
        prediction: 'Prediction'
    };

    if (alerts.length === 0) {
        return (
            <Card>
                <CardContent className="pt-12 pb-12 text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <p className="text-slate-600">No active alerts - All systems operating normally</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {alerts.map(alert => (
                <Card key={alert.id} className="border-2">
                    <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                                <AlertTriangle className={`h-5 w-5 mt-1 ${
                                    alert.severity === 'critical' ? 'text-red-600' :
                                    alert.severity === 'high' ? 'text-orange-600' :
                                    'text-yellow-600'
                                }`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold">{alert.title}</h3>
                                        <Badge className={severityColors[alert.severity]}>
                                            {alert.severity}
                                        </Badge>
                                        <Badge variant="outline">
                                            {typeLabels[alert.alert_type]}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                                    
                                    {alert.metrics && (
                                        <div className="bg-slate-50 p-2 rounded text-xs mb-2">
                                            <span className="font-semibold">Current: </span>
                                            {alert.metrics.current_value?.toFixed(2)} | 
                                            <span className="font-semibold"> Baseline: </span>
                                            {alert.metrics.baseline_value?.toFixed(2)} | 
                                            <span className="font-semibold"> Change: </span>
                                            <span className={alert.metrics.deviation_percentage > 0 ? 'text-red-600' : 'text-green-600'}>
                                                {alert.metrics.deviation_percentage?.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}

                                    {alert.ai_analysis && (
                                        <div className="bg-purple-50 border border-purple-200 p-3 rounded mb-2">
                                            <p className="text-xs font-semibold text-purple-900 mb-1">AI Analysis:</p>
                                            <p className="text-xs text-purple-700">{alert.ai_analysis}</p>
                                        </div>
                                    )}

                                    {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                                            <p className="text-xs font-semibold text-blue-900 mb-1">Recommended Actions:</p>
                                            <ul className="space-y-0.5">
                                                {alert.recommended_actions.map((action, idx) => (
                                                    <li key={idx} className="text-xs text-blue-700">• {action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-500 mt-2">
                                        {moment(alert.created_date).fromNow()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onAcknowledge(alert.id)}
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Acknowledge
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onResolve(alert.id)}
                            >
                                <X className="h-3 w-3 mr-1" />
                                Resolve
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}