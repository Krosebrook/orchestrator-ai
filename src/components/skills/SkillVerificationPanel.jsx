import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function SkillVerificationPanel({ onRefresh }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const pendingRequests = await base44.entities.SkillVerificationRequest.filter({ status: 'pending' });
            setRequests(pendingRequests || []);
        } catch (error) {
            console.error('Failed to load verification requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request) => {
        try {
            const user = await base44.auth.me();
            
            // Update verification request
            await base44.entities.SkillVerificationRequest.update(request.id, {
                status: 'approved',
                reviewed_by: user.email,
                reviewed_at: new Date().toISOString(),
                review_notes: reviewNotes,
                certification_level_granted: request.evidence?.certification_level || 'intermediate'
            });

            // Update the skill
            await base44.entities.AgentSkill.update(request.skill_id, {
                verified_by: user.email,
                verified_at: new Date().toISOString()
            });

            toast.success('Skill verified successfully');
            setReviewingId(null);
            setReviewNotes('');
            loadRequests();
            onRefresh?.();
        } catch (error) {
            console.error('Failed to approve verification:', error);
            toast.error('Failed to verify skill');
        }
    };

    const handleReject = async (request) => {
        try {
            const user = await base44.auth.me();
            
            await base44.entities.SkillVerificationRequest.update(request.id, {
                status: 'rejected',
                reviewed_by: user.email,
                reviewed_at: new Date().toISOString(),
                review_notes: reviewNotes
            });

            toast.success('Verification request rejected');
            setReviewingId(null);
            setReviewNotes('');
            loadRequests();
        } catch (error) {
            console.error('Failed to reject verification:', error);
            toast.error('Failed to reject request');
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-400">Loading...</div>;
    }

    if (requests.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No pending verification requests</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => (
                <Card key={request.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">{request.agent_name}</CardTitle>
                                <p className="text-sm text-slate-600 mt-1">{request.skill_name}</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">Justification:</p>
                            <p className="text-sm text-slate-600">{request.justification || 'No justification provided'}</p>
                        </div>

                        {request.evidence && (
                            <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                                <p className="text-xs font-semibold text-slate-700 uppercase">Evidence</p>
                                {request.evidence.usage_count && (
                                    <div className="text-sm">
                                        <span className="text-slate-600">Usage Count:</span>
                                        <span className="font-semibold ml-2">{request.evidence.usage_count}</span>
                                    </div>
                                )}
                                {request.evidence.success_rate !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-slate-600">Success Rate:</span>
                                        <span className="font-semibold ml-2 text-green-600">
                                            {Math.round(request.evidence.success_rate * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {reviewingId === request.id ? (
                            <div className="space-y-3">
                                <Textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add review notes (optional)..."
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleApprove(request)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Verify
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(request)}
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setReviewingId(null);
                                            setReviewNotes('');
                                        }}
                                        variant="ghost"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setReviewingId(request.id)}
                                variant="outline"
                            >
                                Review Request
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}