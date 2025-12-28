import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Lightbulb, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ProposalVotingSystem({ proposals, agents, onCreate, onVote }) {
    const [showDialog, setShowDialog] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [proposedBy, setProposedBy] = useState('');

    const handleCreate = () => {
        if (workflowName.trim() && description.trim() && proposedBy) {
            onCreate({
                proposed_by: proposedBy,
                workflow_name: workflowName,
                description
            });
            setWorkflowName('');
            setDescription('');
            setProposedBy('');
            setShowDialog(false);
        }
    };

    const getProposalStatus = (proposal) => {
        const voteCount = Object.keys(proposal.votes || {}).length;
        const approvals = Object.values(proposal.votes || {}).filter(v => v === 'approve').length;
        
        if (proposal.status === 'executed') return { icon: CheckCircle, color: 'text-green-600', label: 'Executed' };
        if (proposal.status === 'rejected') return { icon: XCircle, color: 'text-red-600', label: 'Rejected' };
        if (approvals >= agents.length / 2) return { icon: CheckCircle, color: 'text-green-600', label: 'Approved' };
        return { icon: Clock, color: 'text-yellow-600', label: 'Pending' };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-orange-600" />
                        Proposals ({proposals.length})
                    </span>
                    <Button size="sm" onClick={() => setShowDialog(true)}>
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Propose
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {proposals.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No proposals yet
                        </p>
                    ) : (
                        proposals.map((proposal) => {
                            const status = getProposalStatus(proposal);
                            const StatusIcon = status.icon;
                            
                            return (
                                <div key={proposal.id} className="border rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {proposal.proposed_by}
                                                </Badge>
                                                <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold">{proposal.workflow_name}</p>
                                            <p className="text-xs text-slate-600 mt-1">{proposal.description}</p>
                                        </div>
                                    </div>

                                    {proposal.status === 'pending' && (
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-green-600"
                                                onClick={() => onVote(proposal.id, 'approve')}
                                            >
                                                <ThumbsUp className="h-3 w-3 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-red-600"
                                                onClick={() => onVote(proposal.id, 'reject')}
                                            >
                                                <ThumbsDown className="h-3 w-3 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-2 text-xs text-slate-500">
                                        <span>
                                            {Object.values(proposal.votes || {}).filter(v => v === 'approve').length} approvals
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {Object.values(proposal.votes || {}).filter(v => v === 'reject').length} rejections
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Propose Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Proposed By</Label>
                            <Input
                                value={proposedBy}
                                onChange={(e) => setProposedBy(e.target.value)}
                                placeholder="Your name or agent name"
                            />
                        </div>
                        <div>
                            <Label>Workflow Name</Label>
                            <Input
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="Name of the workflow"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what this workflow will do..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Proposal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}