import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ABTestingDashboard({ workflows, executions }) {
    const [abTests, setAbTests] = useState([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [testName, setTestName] = useState('');
    const [variantA, setVariantA] = useState('');
    const [variantB, setVariantB] = useState('');

    const createABTest = async () => {
        try {
            await base44.entities.Workflow.create({
                name: testName,
                description: `A/B test: ${variantA} vs ${variantB}`,
                status: 'active',
                tags: ['ab-test', `variant-a:${variantA}`, `variant-b:${variantB}`],
                nodes: [],
                edges: []
            });
            
            toast.success('A/B test created');
            setShowCreateDialog(false);
            setTestName('');
            setVariantA('');
            setVariantB('');
        } catch (error) {
            console.error('Failed to create A/B test:', error);
            toast.error('Failed to create test');
        }
    };

    // Group workflows by A/B test
    const testGroups = workflows
        .filter(w => w.tags?.includes('ab-test'))
        .reduce((acc, wf) => {
            const testTag = wf.tags.find(t => t.startsWith('variant-'));
            if (testTag) {
                const [_, variantInfo] = testTag.split(':');
                const testKey = wf.name.split(' - ')[0];
                
                if (!acc[testKey]) {
                    acc[testKey] = { name: testKey, variants: [] };
                }
                
                acc[testKey].variants.push({
                    id: wf.id,
                    name: wf.name,
                    variant: variantInfo,
                    executions: executions.filter(e => e.workflow_id === wf.id)
                });
            }
            return acc;
        }, {});

    const calculateMetrics = (execs) => {
        if (execs.length === 0) return { count: 0, successRate: 0, avgDuration: 0 };
        
        return {
            count: execs.length,
            successRate: Math.round((execs.filter(e => e.status === 'completed').length / execs.length) * 100),
            avgDuration: Math.round(execs.reduce((a, e) => a + (e.execution_time_ms || 0), 0) / execs.length / 1000)
        };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">A/B Testing</h2>
                    <p className="text-sm text-slate-600 mt-1">Compare workflow variations to optimize performance</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New A/B Test
                </Button>
            </div>

            {/* Test Results */}
            {Object.values(testGroups).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Zap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No A/B tests running. Create one to start optimizing!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.values(testGroups).map((test) => (
                        <Card key={test.name}>
                            <CardHeader>
                                <CardTitle>{test.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {test.variants.map((variant) => {
                                        const metrics = calculateMetrics(variant.executions);
                                        return (
                                            <div key={variant.id} className="border border-slate-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-semibold text-slate-800">{variant.name}</h4>
                                                    <Badge>Variant {variant.variant}</Badge>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-slate-600">Executions</span>
                                                        <span className="font-semibold">{metrics.count}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-slate-600">Success Rate</span>
                                                        <span className={`font-semibold ${
                                                            metrics.successRate >= 90 ? 'text-green-600' : 'text-amber-600'
                                                        }`}>
                                                            {metrics.successRate}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-slate-600">Avg Duration</span>
                                                        <span className="font-semibold">{metrics.avgDuration}s</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Winner Determination */}
                                {test.variants.length === 2 && test.variants.every(v => v.executions.length >= 10) && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                            <span className="font-semibold text-blue-900">Analysis</span>
                                        </div>
                                        <p className="text-sm text-blue-800">
                                            {(() => {
                                                const [a, b] = test.variants.map(v => calculateMetrics(v.executions));
                                                const aScore = a.successRate * 0.6 + (100 - a.avgDuration / 10) * 0.4;
                                                const bScore = b.successRate * 0.6 + (100 - b.avgDuration / 10) * 0.4;
                                                
                                                if (Math.abs(aScore - bScore) < 5) {
                                                    return "Both variants are performing similarly. Continue testing for conclusive results.";
                                                }
                                                
                                                const winner = aScore > bScore ? test.variants[0] : test.variants[1];
                                                return `${winner.name} is performing ${Math.abs(aScore - bScore).toFixed(0)}% better overall.`;
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create A/B Test Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create A/B Test</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Test Name</Label>
                            <Input
                                value={testName}
                                onChange={(e) => setTestName(e.target.value)}
                                placeholder="Lead Qualification Test"
                            />
                        </div>
                        <div>
                            <Label>Variant A (Workflow ID)</Label>
                            <Select value={variantA} onValueChange={setVariantA}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select workflow" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflows.map((wf) => (
                                        <SelectItem key={wf.id} value={wf.id}>
                                            {wf.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Variant B (Workflow ID)</Label>
                            <Select value={variantB} onValueChange={setVariantB}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select workflow" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflows.filter(w => w.id !== variantA).map((wf) => (
                                        <SelectItem key={wf.id} value={wf.id}>
                                            {wf.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            onClick={createABTest}
                            disabled={!testName || !variantA || !variantB}
                            className="w-full"
                        >
                            Create Test
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}