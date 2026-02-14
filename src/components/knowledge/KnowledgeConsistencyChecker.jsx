import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function KnowledgeConsistencyChecker({ articles, onFixRequired }) {
    const [checking, setChecking] = useState(false);
    const [issues, setIssues] = useState([]);

    const checkConsistency = async () => {
        setChecking(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these knowledge articles for consistency issues:

Articles:
${articles.map(a => `
Title: ${a.title}
Category: ${a.category}
Content: ${a.content}
Tags: ${a.tags?.join(', ')}
---`).join('\n')}

Check for:
1. **Contradictions**: Articles saying different things about the same topic
2. **Duplicates**: Multiple articles covering the same content
3. **Outdated Info**: References to old practices that may no longer apply
4. **Missing Links**: Articles that should reference each other but don't
5. **Category Mismatches**: Articles in wrong categories

For each issue, provide:
- Type of issue
- Affected articles (by title)
- Description of the problem
- Suggested fix
- Severity (critical/warning/info)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        issues: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    severity: { type: "string" },
                                    affected_articles: { 
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    description: { type: "string" },
                                    suggested_fix: { type: "string" }
                                }
                            }
                        },
                        overall_health: { type: "string" }
                    }
                }
            });

            setIssues(result.issues || []);
            
            if (result.issues.length === 0) {
                toast.success('Knowledge base is consistent!');
            } else {
                toast.warning(`Found ${result.issues.length} consistency issues`);
            }
        } catch (error) {
            console.error('Consistency check failed:', error);
            toast.error('Consistency check failed');
        } finally {
            setChecking(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getSeverityIcon = (severity) => {
        return severity === 'critical' ? AlertTriangle : AlertTriangle;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                        Consistency Checker
                    </CardTitle>
                    <Button
                        onClick={checkConsistency}
                        disabled={checking || articles.length === 0}
                    >
                        {checking ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Consistency
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {issues.length === 0 && !checking && (
                    <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <p className="text-slate-600">Run a consistency check to ensure quality</p>
                    </div>
                )}

                {issues.length > 0 && (
                    <div className="space-y-3">
                        {issues.map((issue, idx) => {
                            const Icon = getSeverityIcon(issue.severity);
                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border-2 ${getSeverityColor(issue.severity)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold">{issue.type}</h4>
                                                <Badge className="text-xs">{issue.severity}</Badge>
                                            </div>
                                            <p className="text-sm mb-2">{issue.description}</p>
                                            
                                            <div className="text-xs space-y-1 mb-2">
                                                <p className="font-semibold">Affected Articles:</p>
                                                <ul className="list-disc list-inside">
                                                    {issue.affected_articles.map((title, i) => (
                                                        <li key={i}>{title}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-white/50 p-2 rounded text-xs mb-2">
                                                <p className="font-semibold mb-1">Suggested Fix:</p>
                                                <p>{issue.suggested_fix}</p>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const affected = articles.filter(a => 
                                                        issue.affected_articles.includes(a.title)
                                                    );
                                                    onFixRequired?.(issue, affected);
                                                }}
                                            >
                                                Review & Fix
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}