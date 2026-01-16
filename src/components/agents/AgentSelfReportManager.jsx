import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentSelfReportManager({ agentName, isAdmin = false }) {
    const [reports, setReports] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        loadReports();
    }, [agentName]);

    const loadReports = async () => {
        try {
            const filter = isAdmin ? {} : { agent_name: agentName };
            const reportData = await base44.entities.AgentSelfReport.filter(filter, '-created_date', 50);
            setReports(reportData || []);
        } catch (error) {
            console.error('Failed to load reports:', error);
        }
    };

    const generateSelfReport = async () => {
        try {
            toast.info('Generating self-assessment...');
            
            const [errors, tasks, metrics] = await Promise.all([
                base44.entities.AgentErrorLog.filter({ agent_name: agentName }, '-created_date', 20),
                base44.entities.TaskPerformanceBreakdown.filter({ agent_name: agentName }, '-created_date', 50),
                base44.entities.AgentPerformanceMetric.filter({ agent_name: agentName }, '-created_date', 100)
            ]);

            const context = {
                agent: agentName,
                recent_errors: errors.length,
                success_rate: tasks.filter(t => t.status === 'success').length / tasks.length * 100,
                avg_feedback: tasks.filter(t => t.user_feedback_score).reduce((sum, t) => sum + t.user_feedback_score, 0) / tasks.filter(t => t.user_feedback_score).length,
                total_tasks: tasks.length
            };

            const aiResponse = await base44.integrations.Core.InvokeLLM({
                prompt: `As the AI agent "${agentName}", perform a self-assessment based on recent performance:

Recent Errors: ${context.recent_errors}
Success Rate: ${context.success_rate.toFixed(1)}%
Average User Rating: ${context.avg_feedback?.toFixed(1) || 'N/A'}/5
Total Tasks: ${context.total_tasks}

Identify:
1. Your strongest capabilities (be specific and honest)
2. Areas where you struggle or underperform
3. Specific improvements that could help

Provide 2-3 self-reports in JSON format.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        reports: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    report_type: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    suggested_action: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (aiResponse.reports) {
                for (const report of aiResponse.reports) {
                    await base44.entities.AgentSelfReport.create({
                        agent_name: agentName,
                        ...report,
                        auto_generated: true,
                        status: 'pending'
                    });
                }
                toast.success('Self-assessment generated');
                loadReports();
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            toast.error('Failed to generate self-assessment');
        }
    };

    const reviewReport = async (reportId, decision) => {
        try {
            const user = await base44.auth.me();
            await base44.entities.AgentSelfReport.update(reportId, {
                status: decision,
                reviewed_by: user.email,
                review_notes: reviewNotes,
                reviewed_date: new Date().toISOString()
            });

            if (decision === 'approved') {
                const report = reports.find(r => r.id === reportId);
                if (report) {
                    const profile = (await base44.entities.AgentProfile.filter({ agent_name: agentName }))[0];
                    if (profile) {
                        const updateData = {};
                        if (report.report_type === 'strength') {
                            updateData.self_reported_strengths = [...(profile.self_reported_strengths || []), report.title];
                        } else if (report.report_type === 'weakness') {
                            updateData.self_reported_weaknesses = [...(profile.self_reported_weaknesses || []), report.title];
                        }
                        await base44.entities.AgentProfile.update(profile.id, updateData);
                    }
                }
            }

            toast.success(`Report ${decision}`);
            setShowDialog(false);
            setSelectedReport(null);
            setReviewNotes('');
            loadReports();
        } catch (error) {
            console.error('Failed to review report:', error);
            toast.error('Failed to review report');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: 'bg-yellow-100 text-yellow-700', icon: Clock },
            approved: { bg: 'bg-green-100 text-green-700', icon: CheckCircle },
            rejected: { bg: 'bg-red-100 text-red-700', icon: XCircle },
            under_review: { bg: 'bg-blue-100 text-blue-700', icon: Clock }
        };
        const { bg, icon: Icon } = config[status];
        return (
            <Badge className={bg}>
                <Icon className="h-3 w-3 mr-1" />
                {status}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Self-Reports ({reports.length})
                    </span>
                    {!isAdmin && (
                        <Button size="sm" onClick={generateSelfReport}>
                            <Sparkles className="h-3 w-3 mr-2" />
                            Generate Self-Assessment
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {reports.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No self-reports yet</p>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={
                                                report.report_type === 'strength' ? 'bg-green-100 text-green-700' :
                                                report.report_type === 'weakness' ? 'bg-red-100 text-red-700' :
                                                report.report_type === 'improvement' ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                            }>
                                                {report.report_type}
                                            </Badge>
                                            {getStatusBadge(report.status)}
                                            {report.auto_generated && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    AI
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-semibold text-sm">{report.title}</p>
                                        <p className="text-xs text-slate-600 mt-1">{report.description}</p>
                                        {report.suggested_action && (
                                            <p className="text-xs text-blue-600 mt-2">💡 {report.suggested_action}</p>
                                        )}
                                    </div>
                                </div>
                                {isAdmin && report.status === 'pending' && (
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedReport(report);
                                                setShowDialog(true);
                                            }}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                )}
                                {report.review_notes && (
                                    <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                                        <p className="font-semibold">Review Notes:</p>
                                        <p>{report.review_notes}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Self-Report</DialogTitle>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="space-y-4">
                            <div>
                                <Label>Report</Label>
                                <p className="text-sm font-semibold mt-1">{selectedReport.title}</p>
                                <p className="text-xs text-slate-600 mt-1">{selectedReport.description}</p>
                            </div>
                            <div>
                                <Label>Review Notes</Label>
                                <Textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add your review notes..."
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="text-red-600"
                            onClick={() => reviewReport(selectedReport.id, 'rejected')}
                        >
                            Reject
                        </Button>
                        <Button
                            onClick={() => reviewReport(selectedReport.id, 'approved')}
                        >
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}