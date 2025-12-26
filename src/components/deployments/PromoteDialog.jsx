import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PromoteDialog({ open, onClose, sourceEnvironment, onDeploy }) {
    const [commitMessage, setCommitMessage] = useState('');
    const [deploying, setDeploying] = useState(false);

    const getTargetEnvironment = () => {
        if (!sourceEnvironment) return null;
        if (sourceEnvironment.name === 'development') return 'staging';
        if (sourceEnvironment.name === 'staging') return 'production';
        return null;
    };

    const handleDeploy = async () => {
        if (!commitMessage.trim()) {
            alert('Please enter a commit message');
            return;
        }

        setDeploying(true);
        try {
            await onDeploy(getTargetEnvironment(), sourceEnvironment.name, commitMessage);
            onClose();
            setCommitMessage('');
        } catch (error) {
            console.error('Deploy failed:', error);
        } finally {
            setDeploying(false);
        }
    };

    if (!sourceEnvironment) return null;

    const targetEnv = getTargetEnvironment();
    const isProduction = targetEnv === 'production';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Promote to {targetEnv}</DialogTitle>
                    <DialogDescription>
                        Deploy changes from {sourceEnvironment.display_name} to {targetEnv}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Promotion Flow */}
                    <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <div className="text-center">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                                <span className="text-xl">📦</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">{sourceEnvironment.display_name}</p>
                            <p className="text-xs text-slate-500">{sourceEnvironment.current_version}</p>
                        </div>
                        <ArrowRight className="h-6 w-6 text-slate-400" />
                        <div className="text-center">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                                isProduction ? 'bg-red-100' : 'bg-orange-100'
                            }`}>
                                <span className="text-xl">{isProduction ? '🚀' : '🔧'}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 capitalize">{targetEnv}</p>
                        </div>
                    </div>

                    {isProduction && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You're deploying to production. Make sure all changes have been tested in staging.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Commit Message */}
                    <div className="space-y-2">
                        <Label htmlFor="commitMessage">Deployment Description *</Label>
                        <Textarea
                            id="commitMessage"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Describe what's being deployed..."
                            rows={4}
                        />
                        <p className="text-xs text-slate-500">
                            Provide details about features, fixes, or changes included in this deployment.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={deploying}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeploy}
                            disabled={deploying || !commitMessage.trim()}
                            className={isProduction 
                                ? 'bg-gradient-to-r from-red-600 to-pink-600' 
                                : 'bg-gradient-to-r from-orange-600 to-yellow-600'
                            }
                        >
                            {deploying ? (
                                'Deploying...'
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Deploy to {targetEnv}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}