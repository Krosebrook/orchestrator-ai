import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, RotateCcw, Archive, Clock, User, TrendingUp, TrendingDown } from 'lucide-react';
import moment from 'moment';
import { cn } from "@/lib/utils";

export default function DeploymentTracker({ version, onDeploy, onRollback, onArchive, isActive }) {
    const statusColors = {
        draft: "bg-gray-100 text-gray-700",
        deployed: "bg-green-100 text-green-700",
        archived: "bg-slate-100 text-slate-700",
        rolled_back: "bg-red-100 text-red-700"
    };

    const performanceImpact = version.performance_impact;
    const hasPerformanceData = performanceImpact && 
        performanceImpact.success_rate_before !== undefined &&
        performanceImpact.success_rate_after !== undefined;

    return (
        <Card className={cn(
            "border-2 transition-all",
            isActive && "border-green-500 bg-green-50/50"
        )}>
            <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">v{version.version}</span>
                            <Badge className={statusColors[version.status] || statusColors.draft}>
                                {version.status}
                            </Badge>
                            {isActive && <Badge className="bg-green-600">Active</Badge>}
                            {version.tags?.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-sm text-slate-600">{version.description}</p>
                    </div>
                </div>

                {/* Deployment Info */}
                {version.deployed_at && (
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded">
                        <div className="flex items-center gap-1 text-slate-600">
                            <Clock className="h-3 w-3" />
                            <span>{moment(version.deployed_at).format('MMM D, YYYY h:mm A')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                            <User className="h-3 w-3" />
                            <span>{version.deployed_by || 'Unknown'}</span>
                        </div>
                    </div>
                )}

                {/* Performance Impact */}
                {hasPerformanceData && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <p className="text-xs font-semibold text-blue-900 mb-2">Performance Impact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-slate-600 mb-1">Success Rate</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {performanceImpact.success_rate_before}% → {performanceImpact.success_rate_after}%
                                    </span>
                                    {performanceImpact.success_rate_after > performanceImpact.success_rate_before ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : performanceImpact.success_rate_after < performanceImpact.success_rate_before ? (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    ) : null}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 mb-1">Avg Response Time</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {performanceImpact.avg_response_time_before}s → {performanceImpact.avg_response_time_after}s
                                    </span>
                                    {performanceImpact.avg_response_time_after < performanceImpact.avg_response_time_before ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : performanceImpact.avg_response_time_after > performanceImpact.avg_response_time_before ? (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rollback Info */}
                {version.rollback_count > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                        <p className="text-xs text-yellow-800">
                            ⚠️ Rolled back {version.rollback_count} time{version.rollback_count > 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {version.status === 'draft' && (
                        <Button size="sm" onClick={() => onDeploy(version)} className="flex-1">
                            <Rocket className="h-3 w-3 mr-1" />
                            Deploy
                        </Button>
                    )}
                    {version.status === 'deployed' && !isActive && (
                        <Button size="sm" variant="outline" onClick={() => onRollback(version)} className="flex-1">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Rollback
                        </Button>
                    )}
                    {version.status !== 'archived' && !isActive && (
                        <Button size="sm" variant="outline" onClick={() => onArchive(version)}>
                            <Archive className="h-3 w-3 mr-1" />
                            Archive
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}