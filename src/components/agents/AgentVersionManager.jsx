import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, GitBranch, Plus, Tag, GitCompare, Rocket } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import moment from 'moment';
import VersionComparison from './VersionComparison';
import DeploymentTracker from './DeploymentTracker';
import AIDeploymentRiskAssessment from './AIDeploymentRiskAssessment';
import AutomatedRollbackMonitor from './AutomatedRollbackMonitor';

export default function AgentVersionManager({ open, onClose, agentName, currentConfig }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateVersion, setShowCreateVersion] = useState(false);
    const [newVersion, setNewVersion] = useState({
        version: '',
        description: '',
        changelog: [],
        tags: []
    });
    const [compareVersions, setCompareVersions] = useState({ v1: null, v2: null });
    const [deployingVersion, setDeployingVersion] = useState(null);
    const [riskAssessment, setRiskAssessment] = useState(null);

    useEffect(() => {
        if (open && agentName) {
            loadVersions();
        }
    }, [open, agentName]);

    const loadVersions = async () => {
        try {
            const data = await base44.entities.AgentVersion.filter({ 
                agent_name: agentName 
            });
            setVersions(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        } catch (error) {
            console.error('Failed to load versions:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateConfigChanges = (oldConfig, newConfig) => {
        const changes = { added: [], modified: [], removed: [] };
        
        Object.keys(newConfig).forEach(key => {
            if (!(key in oldConfig)) {
                changes.added.push(key);
            } else if (JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key])) {
                changes.modified.push(key);
            }
        });
        
        Object.keys(oldConfig).forEach(key => {
            if (!(key in newConfig)) {
                changes.removed.push(key);
            }
        });
        
        return changes;
    };

    const handleCreateVersion = async () => {
        if (!newVersion.version || !newVersion.description) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const user = await base44.auth.me();
            const previousVersion = versions.find(v => v.is_active);
            
            const configChanges = previousVersion 
                ? calculateConfigChanges(previousVersion.agent_config, currentConfig)
                : { added: Object.keys(currentConfig), modified: [], removed: [] };

            await base44.entities.AgentVersion.create({
                agent_name: agentName,
                version: newVersion.version,
                description: newVersion.description,
                agent_config: currentConfig,
                is_active: false,
                status: 'draft',
                changelog: newVersion.changelog.filter(c => c.trim()),
                config_changes: configChanges,
                previous_version_id: previousVersion?.id || null,
                tags: newVersion.tags.filter(t => t.trim())
            });

            toast.success('Version created successfully');
            setShowCreateVersion(false);
            setNewVersion({ version: '', description: '', changelog: [], tags: [] });
            await loadVersions();
        } catch (error) {
            console.error('Failed to create version:', error);
            toast.error('Failed to create version');
        }
    };

    const handleInitiateDeploy = (version) => {
        setDeployingVersion(version);
        setRiskAssessment(null);
    };

    const handleDeploy = async (version, assessment) => {
        if (assessment && assessment.go_no_go !== 'go') {
            if (!confirm(`AI recommends NOT to deploy due to ${assessment.risk_level} risk. Deploy anyway?`)) {
                return;
            }
        }

        try {
            const user = await base44.auth.me();
            const currentActive = versions.find(v => v.is_active);
            
            const metrics = await base44.entities.AgentPerformanceMetric.filter(
                { agent_name: agentName },
                '-created_date',
                50
            );
            
            const currentSuccessRate = metrics.length > 0
                ? (metrics.filter(m => m.status === 'success').length / metrics.length * 100).toFixed(1)
                : 0;
            const currentAvgTime = metrics.length > 0
                ? (metrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / metrics.length / 1000).toFixed(2)
                : 0;

            if (currentActive) {
                await base44.entities.AgentVersion.update(currentActive.id, { 
                    is_active: false,
                    status: 'archived'
                });
            }

            await base44.entities.AgentVersion.update(version.id, {
                is_active: true,
                status: 'deployed',
                deployed_at: new Date().toISOString(),
                deployed_by: user.email,
                performance_impact: {
                    success_rate_before: parseFloat(currentSuccessRate),
                    avg_response_time_before: parseFloat(currentAvgTime)
                }
            });

            toast.success(`Version ${version.version} deployed - Monitoring active`);
            setDeployingVersion(null);
            await loadVersions();
        } catch (error) {
            console.error('Failed to deploy version:', error);
            toast.error('Failed to deploy version');
        }
    };

    const handleAutoRollback = async (version, issues) => {
        try {
            const previousVersion = versions.find(v => v.id === version.previous_version_id);
            
            if (!previousVersion) {
                toast.error('No previous version available for rollback');
                return;
            }

            const user = await base44.auth.me();

            await base44.entities.AgentVersion.update(version.id, { 
                is_active: false,
                status: 'rolled_back',
                rollback_count: (version.rollback_count || 0) + 1
            });

            await base44.entities.AgentVersion.update(previousVersion.id, {
                is_active: true,
                status: 'deployed',
                deployed_at: new Date().toISOString(),
                deployed_by: `auto-rollback (${user.email})`
            });

            toast.success(`Auto-rollback completed: Reverted to v${previousVersion.version}`);
            await loadVersions();
        } catch (error) {
            console.error('Auto-rollback failed:', error);
            toast.error('Auto-rollback failed - manual intervention required');
        }
    };

    const handleRollback = async (version) => {
        if (!confirm(`Rollback to version ${version.version}? This will replace the current active version.`)) return;

        try {
            const user = await base44.auth.me();
            const currentActive = versions.find(v => v.is_active);

            if (currentActive) {
                await base44.entities.AgentVersion.update(currentActive.id, { 
                    is_active: false,
                    status: 'rolled_back',
                    rollback_count: (currentActive.rollback_count || 0) + 1
                });
            }

            await base44.entities.AgentVersion.update(version.id, {
                is_active: true,
                status: 'deployed',
                deployed_at: new Date().toISOString(),
                deployed_by: user.email
            });

            toast.success(`Rolled back to version ${version.version}`);
            await loadVersions();
        } catch (error) {
            console.error('Failed to rollback:', error);
            toast.error('Failed to rollback version');
        }
    };

    const handleArchive = async (version) => {
        if (!confirm(`Archive version ${version.version}?`)) return;

        try {
            await base44.entities.AgentVersion.update(version.id, {
                status: 'archived'
            });

            toast.success(`Version ${version.version} archived`);
            await loadVersions();
        } catch (error) {
            console.error('Failed to archive version:', error);
            toast.error('Failed to archive version');
        }
    };

    const activeVersion = versions.find(v => v.is_active);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Version History: {agentName}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden space-y-4">
                    <Tabs defaultValue="versions">
                        <TabsList className="w-full">
                            <TabsTrigger value="versions" className="flex-1">
                                <GitBranch className="h-4 w-4 mr-2" />
                                Versions
                            </TabsTrigger>
                            <TabsTrigger value="compare" className="flex-1">
                                <GitCompare className="h-4 w-4 mr-2" />
                                Compare
                            </TabsTrigger>
                            <TabsTrigger value="deployments" className="flex-1">
                                <Rocket className="h-4 w-4 mr-2" />
                                Deployments
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="versions" className="mt-4 space-y-4">
                            {/* Current Active Version */}
                            {activeVersion && (
                                <Card className="border-2 border-green-200 bg-green-50">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-800">
                                                            Version {activeVersion.version}
                                                        </span>
                                                        <Badge className="bg-green-600">Active</Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {activeVersion.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                    {/* Create New Version */}
                    {!showCreateVersion ? (
                        <Button
                            onClick={() => setShowCreateVersion(true)}
                            className="w-full"
                            variant="outline"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Version
                        </Button>
                    ) : (
                        <Card className="border-2 border-blue-200">
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <Label>Version Number</Label>
                                    <Input
                                        value={newVersion.version}
                                        onChange={(e) => setNewVersion({...newVersion, version: e.target.value})}
                                        placeholder="e.g., 2.1.0"
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={newVersion.description}
                                        onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                                        placeholder="What changed in this version?"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <Label>Changelog (one per line)</Label>
                                    <Textarea
                                        value={newVersion.changelog.join('\n')}
                                        onChange={(e) => setNewVersion({
                                            ...newVersion, 
                                            changelog: e.target.value.split('\n')
                                        })}
                                        placeholder="- Added new capabilities&#10;- Fixed bugs&#10;- Improved performance"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label>Tags (comma separated)</Label>
                                    <Input
                                        value={newVersion.tags.join(', ')}
                                        onChange={(e) => setNewVersion({
                                            ...newVersion,
                                            tags: e.target.value.split(',').map(t => t.trim())
                                        })}
                                        placeholder="e.g., hotfix, feature, experimental"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowCreateVersion(false);
                                            setNewVersion({ version: '', description: '', changelog: [], tags: [] });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreateVersion}>
                                        Create Version
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Version List */}
                    <ScrollArea className="h-96">
                        <div className="space-y-3">
                            {loading ? (
                                <p className="text-center text-slate-500 py-4">Loading versions...</p>
                            ) : versions.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Tag className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                    <p>No versions yet. Create the first version!</p>
                                </div>
                            ) : (
                                versions.map((version) => (
                                    <Card
                                        key={version.id}
                                        className={cn(
                                            "transition-all",
                                            version.is_active && "border-green-200 bg-green-50"
                                        )}
                                    >
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-slate-800">
                                                            Version {version.version}
                                                        </span>
                                                        {version.is_active && (
                                                            <Badge className="bg-green-600">Active</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">
                                                        {version.description}
                                                    </p>
                                                    {version.changelog && version.changelog.length > 0 && (
                                                        <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                                                            <p className="text-xs font-semibold text-slate-600 mb-1">
                                                                Changelog:
                                                            </p>
                                                            <ul className="text-xs text-slate-600 space-y-0.5">
                                                                {version.changelog.map((change, idx) => (
                                                                    <li key={idx}>• {change}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                                        <span>By {version.created_by || 'Unknown'}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {moment(version.created_date).fromNow()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {version.status === 'draft' && (
                                                   <Button
                                                       size="sm"
                                                       onClick={() => handleInitiateDeploy(version)}
                                                   >
                                                       Deploy
                                                   </Button>
                                                )}
                                                {version.status === 'deployed' && !version.is_active && (
                                                   <Button
                                                       size="sm"
                                                       variant="outline"
                                                       onClick={() => handleRollback(version)}
                                                   >
                                                       Rollback
                                                   </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                        </TabsContent>

                        <TabsContent value="compare" className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Version 1</Label>
                                    <Select 
                                        value={compareVersions.v1?.id || ''} 
                                        onValueChange={(id) => setCompareVersions({
                                            ...compareVersions,
                                            v1: versions.find(v => v.id === id)
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select version" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {versions.map(v => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    v{v.version}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Version 2</Label>
                                    <Select 
                                        value={compareVersions.v2?.id || ''} 
                                        onValueChange={(id) => setCompareVersions({
                                            ...compareVersions,
                                            v2: versions.find(v => v.id === id)
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select version" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {versions.map(v => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    v{v.version}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {compareVersions.v1 && compareVersions.v2 && (
                                <VersionComparison 
                                    version1={compareVersions.v1} 
                                    version2={compareVersions.v2} 
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="deployments" className="mt-4">
                            <ScrollArea className="h-96">
                                <div className="space-y-3">
                                    {activeVersion && (
                                        <AutomatedRollbackMonitor
                                            agentName={agentName}
                                            deployedVersion={activeVersion}
                                            onRollbackTriggered={handleAutoRollback}
                                        />
                                    )}
                                    
                                    {versions.filter(v => v.status !== 'draft').length === 0 ? (
                                        <p className="text-center text-slate-500 py-8">
                                            No deployments yet
                                        </p>
                                    ) : (
                                        versions
                                            .filter(v => v.status !== 'draft')
                                            .map(version => (
                                                <DeploymentTracker
                                                    key={version.id}
                                                    version={version}
                                                    isActive={version.is_active}
                                                    onDeploy={handleInitiateDeploy}
                                                    onRollback={handleRollback}
                                                    onArchive={handleArchive}
                                                />
                                            ))
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Deployment Risk Assessment Dialog */}
                <Dialog open={!!deployingVersion} onOpenChange={() => setDeployingVersion(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Deploy Version {deployingVersion?.version}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <AIDeploymentRiskAssessment
                                version={deployingVersion}
                                agentName={agentName}
                                onAssessmentComplete={(assessment) => setRiskAssessment(assessment)}
                            />
                            
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setDeployingVersion(null)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={() => handleDeploy(deployingVersion, riskAssessment)}
                                    disabled={!riskAssessment}
                                    className={riskAssessment?.go_no_go === 'no-go' ? 'bg-orange-600' : ''}
                                >
                                    {riskAssessment?.go_no_go === 'no-go' ? 'Deploy Anyway' : 'Deploy'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}