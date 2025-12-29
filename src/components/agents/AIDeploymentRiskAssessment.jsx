import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Loader2, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function AIDeploymentRiskAssessment({ version, agentName, onAssessmentComplete }) {
    const [assessing, setAssessing] = useState(false);
    const [assessment, setAssessment] = useState(null);

    const assessRisk = async () => {
        setAssessing(true);
        try {
            const [metrics, errors, activeExecutions] = await Promise.all([
                base44.entities.AgentPerformanceMetric.filter({ agent_name: agentName }, '-created_date', 100),
                base44.entities.AgentErrorLog.filter({ agent_name: agentName }, '-created_date', 50),
                base44.entities.WorkflowExecution.filter({ status: 'running' })
            ]);

            const currentSuccessRate = metrics.length > 0
                ? (metrics.filter(m => m.status === 'success').length / metrics.length * 100).toFixed(1)
                : 0;
            const recentErrors = errors.slice(0, 10);
            const activeWorkflows = activeExecutions.filter(e => 
                e.workflow_name && e.workflow_name.includes(agentName)
            ).length;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Assess the risk of deploying agent version ${version.version}.

Agent: ${agentName}
Current Performance:
- Success Rate: ${currentSuccessRate}%
- Recent Errors: ${recentErrors.length}
- Active Workflows: ${activeWorkflows}

Version Changes:
${version.config_changes ? JSON.stringify(version.config_changes, null, 2) : 'No change data'}

Changelog:
${version.changelog?.join('\n') || 'No changelog'}

Recent Error Types:
${recentErrors.map(e => `- ${e.error_type}: ${e.error_message}`).join('\n')}

Provide a comprehensive risk assessment:
1. Overall risk level (low, medium, high, critical)
2. Risk score (0-100)
3. Specific concerns
4. Impact on active workflows
5. Recommended precautions
6. Go/No-Go recommendation
7. Rollback plan readiness`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        risk_level: { type: "string" },
                        risk_score: { type: "number" },
                        concerns: { type: "array", items: { type: "string" } },
                        workflow_impact: { type: "string" },
                        precautions: { type: "array", items: { type: "string" } },
                        recommendation: { type: "string" },
                        go_no_go: { type: "string" },
                        rollback_plan: { type: "string" }
                    }
                }
            });

            setAssessment(result);
            onAssessmentComplete(result);
            toast.success('Risk assessment completed');
        } catch (error) {
            console.error('Failed to assess risk:', error);
            toast.error('Failed to assess deployment risk');
        } finally {
            setAssessing(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-orange-600';
            case 'critical': return 'text-red-600';
            default: return 'text-slate-600';
        }
    };

    return (
        <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        AI Risk Assessment
                    </h3>
                    {!assessment && (
                        <Button size="sm" onClick={assessRisk} disabled={assessing}>
                            {assessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                'Analyze Risk'
                            )}
                        </Button>
                    )}
                </div>

                {assessment ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Risk Level</span>
                            <Badge className={`${getRiskColor(assessment.risk_level)} bg-white`}>
                                {assessment.risk_level.toUpperCase()}
                            </Badge>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Risk Score</span>
                                <span className="font-semibold">{assessment.risk_score}/100</span>
                            </div>
                            <Progress value={assessment.risk_score} className="h-2" />
                        </div>

                        {assessment.concerns?.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                                <p className="text-xs font-semibold text-yellow-900 mb-2">Concerns:</p>
                                {assessment.concerns.map((concern, idx) => (
                                    <p key={idx} className="text-xs text-yellow-700">⚠️ {concern}</p>
                                ))}
                            </div>
                        )}

                        {assessment.workflow_impact && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Workflow Impact:</p>
                                <p className="text-xs text-blue-700">{assessment.workflow_impact}</p>
                            </div>
                        )}

                        {assessment.precautions?.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                                <p className="text-xs font-semibold text-orange-900 mb-2">Recommended Precautions:</p>
                                {assessment.precautions.map((precaution, idx) => (
                                    <p key={idx} className="text-xs text-orange-700">• {precaution}</p>
                                ))}
                            </div>
                        )}

                        <div className={`p-3 rounded border-2 ${
                            assessment.go_no_go === 'go' 
                                ? 'bg-green-50 border-green-500' 
                                : 'bg-red-50 border-red-500'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {assessment.go_no_go === 'go' ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                )}
                                <span className={`font-semibold ${
                                    assessment.go_no_go === 'go' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {assessment.go_no_go === 'go' ? 'APPROVED FOR DEPLOYMENT' : 'DEPLOYMENT NOT RECOMMENDED'}
                                </span>
                            </div>
                            <p className={`text-xs ${
                                assessment.go_no_go === 'go' ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {assessment.recommendation}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-600 text-center py-4">
                        Run AI analysis to assess deployment risk
                    </p>
                )}
            </CardContent>
        </Card>
    );
}