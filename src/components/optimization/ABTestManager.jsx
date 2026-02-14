import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, Play, Pause, Trophy, TrendingUp, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ABTestManager({ optimizations }) {
    const [abTests, setAbTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedOptimization, setSelectedOptimization] = useState(null);
    const [testConfig, setTestConfig] = useState({
        test_name: '',
        hypothesis: '',
        traffic_split: 50,
        min_sample_size: 20
    });

    useEffect(() => {
        loadABTests();
    }, []);

    const loadABTests = async () => {
        try {
            const tests = await base44.entities.WorkflowABTest.list('-created_date');
            setAbTests(tests || []);
        } catch (error) {
            console.error('Failed to load A/B tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const createABTest = async () => {
        if (!selectedOptimization || !testConfig.test_name) {
            toast.error('Fill in all required fields');
            return;
        }

        try {
            await base44.entities.WorkflowABTest.create({
                workflow_id: selectedOptimization.workflow_id,
                workflow_name: selectedOptimization.workflow_name,
                optimization_id: selectedOptimization.id,
                test_name: testConfig.test_name,
                hypothesis: testConfig.hypothesis || `Testing if ${selectedOptimization.optimization_type} improves performance`,
                variant_a: {
                    name: 'Control (Current)',
                    config: {},
                    executions: 0
                },
                variant_b: {
                    name: 'Optimized',
                    config: selectedOptimization.proposed_changes,
                    executions: 0
                },
                traffic_split: testConfig.traffic_split,
                min_sample_size: testConfig.min_sample_size,
                status: 'preparing'
            });

            toast.success('A/B test created');
            setCreateDialogOpen(false);
            setTestConfig({ test_name: '', hypothesis: '', traffic_split: 50, min_sample_size: 20 });
            await loadABTests();
        } catch (error) {
            console.error('Failed to create A/B test:', error);
            toast.error('Failed to create test');
        }
    };

    const updateTestStatus = async (testId, status) => {
        try {
            const updates = { status };
            if (status === 'running') {
                updates.started_at = new Date().toISOString();
            }
            if (status === 'completed') {
                updates.completed_at = new Date().toISOString();
            }
            await base44.entities.WorkflowABTest.update(testId, updates);
            toast.success('Status updated');
            await loadABTests();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Update failed');
        }
    };

    const analyzeResults = async (testId) => {
        const test = abTests.find(t => t.id === testId);
        if (!test || !test.variant_a || !test.variant_b) {
            toast.error('Insufficient data');
            return;
        }

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these A/B test results and determine the winner:

Test: ${test.test_name}
Hypothesis: ${test.hypothesis}

Variant A (Control):
- Executions: ${test.variant_a.executions}
- Avg Execution Time: ${test.variant_a.avg_execution_time}ms
- Success Rate: ${test.variant_a.success_rate}%
- Avg Cost: $${test.variant_a.avg_cost}
- Errors: ${test.variant_a.error_count}

Variant B (Optimized):
- Executions: ${test.variant_b.executions}
- Avg Execution Time: ${test.variant_b.avg_execution_time}ms
- Success Rate: ${test.variant_b.success_rate}%
- Avg Cost: $${test.variant_b.avg_cost}
- Errors: ${test.variant_b.error_count}

Determine:
1. Which variant performed better overall
2. Statistical significance estimate (0-1)
3. Detailed conclusion with recommendations`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        winner: { type: "string", enum: ["variant_a", "variant_b", "inconclusive"] },
                        statistical_significance: { type: "number" },
                        conclusion: { type: "string" }
                    }
                }
            });

            await base44.entities.WorkflowABTest.update(testId, {
                winner: response.winner,
                statistical_significance: response.statistical_significance,
                conclusion: response.conclusion,
                status: 'completed',
                completed_at: new Date().toISOString()
            });

            toast.success('Results analyzed');
            await loadABTests();
        } catch (error) {
            console.error('Failed to analyze results:', error);
            toast.error('Analysis failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-slate-100 text-slate-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    const runningTests = abTests.filter(t => t.status === 'running');
    const completedTests = abTests.filter(t => t.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                A/B Test Manager
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                Test optimizations before full deployment
                            </p>
                        </div>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600">
                                    <Target className="h-4 w-4 mr-2" />
                                    New A/B Test
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create A/B Test</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <Label>Select Optimization</Label>
                                        <select
                                            value={selectedOptimization?.id || ''}
                                            onChange={(e) => {
                                                const opt = optimizations.find(o => o.id === e.target.value);
                                                setSelectedOptimization(opt);
                                                if (opt) {
                                                    setTestConfig(prev => ({
                                                        ...prev,
                                                        test_name: `${opt.workflow_name} - ${opt.optimization_type}`,
                                                        hypothesis: `Testing if ${opt.optimization_type} improves ${opt.workflow_name}`
                                                    }));
                                                }
                                            }}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Choose...</option>
                                            {optimizations.filter(o => o.status === 'approved').map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.workflow_name} - {opt.optimization_type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Test Name</Label>
                                        <Input
                                            value={testConfig.test_name}
                                            onChange={(e) => setTestConfig(prev => ({ ...prev, test_name: e.target.value }))}
                                            placeholder="Speed optimization test"
                                        />
                                    </div>
                                    <div>
                                        <Label>Hypothesis</Label>
                                        <Input
                                            value={testConfig.hypothesis}
                                            onChange={(e) => setTestConfig(prev => ({ ...prev, hypothesis: e.target.value }))}
                                            placeholder="What are we testing?"
                                        />
                                    </div>
                                    <div>
                                        <Label>Traffic Split to Variant B: {testConfig.traffic_split}%</Label>
                                        <Slider
                                            value={[testConfig.traffic_split]}
                                            onValueChange={(value) => setTestConfig(prev => ({ ...prev, traffic_split: value[0] }))}
                                            min={10}
                                            max={90}
                                            step={5}
                                        />
                                    </div>
                                    <div>
                                        <Label>Min Sample Size Per Variant</Label>
                                        <Input
                                            type="number"
                                            value={testConfig.min_sample_size}
                                            onChange={(e) => setTestConfig(prev => ({ ...prev, min_sample_size: parseInt(e.target.value) }))}
                                            min={10}
                                        />
                                    </div>
                                    <Button onClick={createABTest} className="w-full">
                                        Create Test
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            {/* Running Tests */}
            {runningTests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Running Tests</h3>
                    <div className="space-y-4">
                        {runningTests.map((test) => {
                            const variantAProgress = test.min_sample_size > 0
                                ? Math.min((test.variant_a?.executions || 0) / test.min_sample_size * 100, 100)
                                : 0;
                            const variantBProgress = test.min_sample_size > 0
                                ? Math.min((test.variant_b?.executions || 0) / test.min_sample_size * 100, 100)
                                : 0;
                            const bothComplete = variantAProgress === 100 && variantBProgress === 100;

                            const chartData = [
                                {
                                    metric: 'Time (ms)',
                                    'Control': test.variant_a?.avg_execution_time || 0,
                                    'Optimized': test.variant_b?.avg_execution_time || 0
                                },
                                {
                                    metric: 'Success %',
                                    'Control': test.variant_a?.success_rate || 0,
                                    'Optimized': test.variant_b?.success_rate || 0
                                },
                                {
                                    metric: 'Cost $',
                                    'Control': test.variant_a?.avg_cost || 0,
                                    'Optimized': test.variant_b?.avg_cost || 0
                                }
                            ];

                            return (
                                <Card key={test.id} className="border-2 border-blue-200">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-lg">{test.test_name}</h4>
                                                    <p className="text-sm text-slate-600">{test.hypothesis}</p>
                                                </div>
                                                <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                                            </div>

                                            {/* Progress */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span>Control (A)</span>
                                                        <span className="font-semibold">{test.variant_a?.executions || 0}/{test.min_sample_size}</span>
                                                    </div>
                                                    <Progress value={variantAProgress} className="h-2" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span>Optimized (B)</span>
                                                        <span className="font-semibold">{test.variant_b?.executions || 0}/{test.min_sample_size}</span>
                                                    </div>
                                                    <Progress value={variantBProgress} className="h-2" />
                                                </div>
                                            </div>

                                            {/* Chart */}
                                            {(test.variant_a?.executions > 0 && test.variant_b?.executions > 0) && (
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <BarChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="metric" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="Control" fill="#94a3b8" />
                                                        <Bar dataKey="Optimized" fill="#3b82f6" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {bothComplete && (
                                                    <Button
                                                        onClick={() => analyzeResults(test.id)}
                                                        className="flex-1 bg-green-600"
                                                    >
                                                        <Trophy className="h-4 w-4 mr-2" />
                                                        Analyze Results
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => updateTestStatus(test.id, 'cancelled')}
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    <Pause className="h-4 w-4 mr-2" />
                                                    Cancel Test
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completed Tests */}
            {completedTests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Completed Tests</h3>
                    <div className="space-y-4">
                        {completedTests.map((test) => (
                            <Card key={test.id}>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold">{test.test_name}</h4>
                                                <p className="text-sm text-slate-600">{test.workflow_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={test.winner === 'variant_b' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                                                    {test.winner === 'variant_b' ? 'Optimized Won' : test.winner === 'variant_a' ? 'Control Won' : 'Inconclusive'}
                                                </Badge>
                                                {test.statistical_significance && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Confidence: {(test.statistical_significance * 100).toFixed(0)}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {test.conclusion && (
                                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{test.conclusion}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {!loading && abTests.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-4">No A/B tests created yet</p>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            disabled={optimizations.filter(o => o.status === 'approved').length === 0}
                        >
                            Create Your First Test
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}