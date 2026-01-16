import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, Plus, Minus, Edit, ArrowRight } from 'lucide-react';

export default function VersionComparison({ version1, version2 }) {
    const [differences, setDifferences] = useState(null);

    useEffect(() => {
        if (version1 && version2) {
            calculateDifferences();
        }
    }, [version1, version2]);

    const calculateDifferences = () => {
        const config1 = version1.agent_config || {};
        const config2 = version2.agent_config || {};

        const diffs = {
            added: [],
            removed: [],
            modified: []
        };

        // Find added and modified fields
        Object.keys(config2).forEach(key => {
            if (!(key in config1)) {
                diffs.added.push({
                    field: key,
                    value: config2[key]
                });
            } else if (JSON.stringify(config1[key]) !== JSON.stringify(config2[key])) {
                diffs.modified.push({
                    field: key,
                    oldValue: config1[key],
                    newValue: config2[key]
                });
            }
        });

        // Find removed fields
        Object.keys(config1).forEach(key => {
            if (!(key in config2)) {
                diffs.removed.push({
                    field: key,
                    value: config1[key]
                });
            }
        });

        setDifferences(diffs);
    };

    const formatValue = (value) => {
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    if (!version1 || !version2) {
        return null;
    }

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <GitCompare className="h-5 w-5 text-blue-600" />
                    Version Comparison
                </CardTitle>
                <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{version1.version}</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="outline">{version2.version}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-4">
                        {/* Added Fields */}
                        {differences?.added.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700">
                                    <Plus className="h-4 w-4" />
                                    Added ({differences.added.length})
                                </h3>
                                <div className="space-y-2">
                                    {differences.added.map((item, idx) => (
                                        <div key={idx} className="bg-green-50 border border-green-200 p-3 rounded">
                                            <p className="text-xs font-mono font-semibold text-green-900 mb-1">
                                                {item.field}
                                            </p>
                                            <pre className="text-xs text-green-700 whitespace-pre-wrap">
                                                {formatValue(item.value)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modified Fields */}
                        {differences?.modified.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-700">
                                    <Edit className="h-4 w-4" />
                                    Modified ({differences.modified.length})
                                </h3>
                                <div className="space-y-2">
                                    {differences.modified.map((item, idx) => (
                                        <div key={idx} className="bg-orange-50 border border-orange-200 p-3 rounded">
                                            <p className="text-xs font-mono font-semibold text-orange-900 mb-2">
                                                {item.field}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Before:</p>
                                                    <pre className="text-xs text-red-700 bg-red-50 p-2 rounded whitespace-pre-wrap">
                                                        {formatValue(item.oldValue)}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">After:</p>
                                                    <pre className="text-xs text-green-700 bg-green-50 p-2 rounded whitespace-pre-wrap">
                                                        {formatValue(item.newValue)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Removed Fields */}
                        {differences?.removed.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700">
                                    <Minus className="h-4 w-4" />
                                    Removed ({differences.removed.length})
                                </h3>
                                <div className="space-y-2">
                                    {differences.removed.map((item, idx) => (
                                        <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded">
                                            <p className="text-xs font-mono font-semibold text-red-900 mb-1">
                                                {item.field}
                                            </p>
                                            <pre className="text-xs text-red-700 whitespace-pre-wrap">
                                                {formatValue(item.value)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {differences?.added.length === 0 && 
                         differences?.modified.length === 0 && 
                         differences?.removed.length === 0 && (
                            <p className="text-center text-slate-500 py-8">No configuration differences</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}