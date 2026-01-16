import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowApprovalPanel() {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadApprovals();
        const interval = setInterval(loadApprovals, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadApprovals = async () => {
        try {
            const pending = await base44.entities.WorkflowApproval.filter(
                { status: 'pending' },
                '-created_date'
            );
            setApprovals(pending || []);
        } catch (error) {
            console.error('Failed to load approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (approval) => {
        try {
            const user = await base44.auth.me();
            await base44.entities.WorkflowApproval.update(approval.id, {
                status: 'approved',
                approved_by: user.email,
                approved_at: new Date().toISOString()
            });
            toast.success('Workflow approved');
            await loadApprovals();
        } catch (error) {
            console.error('Failed to approve:', error);
            toast.error('Failed to approve workflow');
        }
    };

    const handleReject = async (approval, reason) => {
        try {
            const user = await base44.auth.me();
            await base44.entities.WorkflowApproval.update(approval.id, {
                status: 'rejected',
                approved_by: user.email,
                decision: reason,
                approved_at: new Date().toISOString()
            });
            toast.success('Workflow rejected');
            await loadApprovals();
        } catch (error) {
            console.error('Failed to reject:', error);
            toast.error('Failed to reject workflow');
        }
    };

    if (approvals.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-slate-600">No pending approvals</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {approvals.map(approval => (
                <Card key={approval.id} className="border-2 border-orange-200">
                    <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    <h3 className="font-semibold">{approval.workflow_name}</h3>
                                    <Badge className="bg-orange-600">Pending Approval</Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">
                                    Type: {approval.approval_type}
                                </p>
                            </div>
                        </div>

                        {approval.data_to_review && (
                            <div className="bg-slate-50 p-3 rounded mb-3">
                                <p className="text-xs font-semibold mb-1">Data to Review:</p>
                                <pre className="text-xs whitespace-pre-wrap">
                                    {JSON.stringify(approval.data_to_review, null, 2)}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleApprove(approval)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const reason = prompt('Reason for rejection:');
                                    if (reason) handleReject(approval, reason);
                                }}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}