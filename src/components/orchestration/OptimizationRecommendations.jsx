import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Sparkles, 
    TrendingUp, 
    AlertTriangle, 
    Lightbulb, 
    Zap,
    ArrowRight,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import OrchestrationOptimizationEngine from './OrchestrationOptimizationEngine';

export default function OptimizationRecommendations({ orchestration, onApplyOptimization }) {
    const engine = OrchestrationOptimizationEngine();
    const [recommendations, setRecommendations] = useState([]);
    const [bottlenecks, setBottlenecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [optimalSequences, setOptimalSequences] = useState([]);

    useEffect(() => {
        if (engine.profiles.length > 0) {
            analyzeOrchestration();
        }
    }, [engine.profiles, orchestration]);

    const analyzeOrchestration = async () => {
        setLoading(true);
        try {
            const [recs, btlnks] = await Promise.all([
                engine.suggestOptimizations(orchestration),
                Promise.resolve(engine.identifyBottlenecks())
            ]);
            
            setRecommendations(recs);
            setBottlenecks(btlnks);

            // Find optimal sequences if agents are available
            if (orchestration.agents) {
                const sequences = engine.findOptimalAgentSequence(
                    orchestration.description,
                    orchestration.agents
                );
                setOptimalSequences(sequences);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'medium': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
            default: return <TrendingUp className="h-4 w-4 text-blue-600" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'border-red-300 bg-red-50';
            case 'medium': return 'border-yellow-300 bg-yellow-50';
            default: return 'border-blue-300 bg-blue-50';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-3 animate-spin" />
                    <p className="text-slate-600">Analyzing orchestration...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI-Driven Optimization Engine
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="recommendations">
                        <TabsList>
                            <TabsTrigger value="recommendations">
                                Recommendations ({recommendations.length})
                            </TabsTrigger>
                            <TabsTrigger value="bottlenecks">
                                Bottlenecks ({bottlenecks.length})
                            </TabsTrigger>
                            <TabsTrigger value="sequences">
                                Optimal Sequences
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="recommendations" className="space-y-3 mt-4">
                            {recommendations.length === 0 ? (
                                <Alert className="border-green-300 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-700" />
                                    <AlertDescription className="text-green-800">
                                        No optimization recommendations - this workflow looks great!
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                recommendations.map((rec, idx) => (
                                    <Alert key={idx} className={getPriorityColor(rec.priority)}>
                                        {getPriorityIcon(rec.priority)}
                                        <AlertDescription>
                                            <div className="space-y-2">
                                                <p className="font-semibold">{rec.message}</p>
                                                <p className="text-sm">{rec.suggestion}</p>
                                                {rec.impact && (
                                                    <Badge className="bg-purple-100 text-purple-700">
                                                        Impact: {rec.impact}
                                                    </Badge>
                                                )}
                                                {rec.agents && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {rec.agents.map((agent, i) => (
                                                            <Badge key={i} variant="outline">
                                                                {agent}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="bottlenecks" className="space-y-3 mt-4">
                            {bottlenecks.length === 0 ? (
                                <Alert className="border-green-300 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-700" />
                                    <AlertDescription className="text-green-800">
                                        No bottlenecks detected - all agents performing well!
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                bottlenecks.map((bottleneck, idx) => (
                                    <Alert key={idx} className={
                                        bottleneck.severity === 'high' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                                    }>
                                        <AlertTriangle className={
                                            bottleneck.severity === 'high' ? 'h-4 w-4 text-red-700' : 'h-4 w-4 text-yellow-700'
                                        } />
                                        <AlertDescription>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold">{bottleneck.agent}</p>
                                                    <Badge className={
                                                        bottleneck.severity === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                                                    }>
                                                        {bottleneck.severity}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm">{bottleneck.metric}</p>
                                                <p className="text-sm font-medium">{bottleneck.suggestion}</p>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="sequences" className="space-y-3 mt-4">
                            <p className="text-sm text-slate-600 mb-4">
                                Based on historical compatibility and performance data, here are the most optimal agent sequences:
                            </p>
                            {optimalSequences.map((seq, idx) => (
                                <Card key={idx} className="border-2">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                                                Option {idx + 1}
                                            </Badge>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-700">
                                                    {Math.round(seq.avgScore)}% compatibility
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {seq.path.map((agent, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-sm">
                                                        {agent}
                                                    </Badge>
                                                    {i < seq.path.length - 1 && (
                                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {idx === 0 && (
                                            <Button
                                                size="sm"
                                                className="mt-3 w-full"
                                                onClick={() => onApplyOptimization && onApplyOptimization(seq.path)}
                                            >
                                                <Zap className="h-3 w-3 mr-2" />
                                                Apply This Sequence
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}