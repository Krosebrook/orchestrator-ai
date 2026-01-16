import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Rocket, GitBranch, CheckCircle2, XCircle,
    ArrowRight, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import EnvironmentCard from '../components/deployments/EnvironmentCard';
import DeploymentHistory from '../components/deployments/DeploymentHistory';
import PromoteDialog from '../components/deployments/PromoteDialog';

export default function DeploymentsPage() {
    const [environments, setEnvironments] = useState([]);
    const [deployments, setDeployments] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPromoteDialog, setShowPromoteDialog] = useState(false);
    const [selectedEnvironment, setSelectedEnvironment] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const [envs, deps] = await Promise.all([
                base44.entities.Environment.list(),
                base44.entities.Deployment.list('-created_date', 50)
            ]);

            // Initialize default environments if none exist
            if (!envs || envs.length === 0) {
                await initializeEnvironments();
            } else {
                setEnvironments(envs);
            }

            setDeployments(deps || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load deployment data');
        } finally {
            setLoading(false);
        }
    };

    const initializeEnvironments = async () => {
        const defaultEnvs = [
            { name: 'development', display_name: 'Development', status: 'active', current_version: '1.0.0' },
            { name: 'staging', display_name: 'Staging', status: 'active', current_version: '1.0.0' },
            { name: 'production', display_name: 'Production', status: 'active', current_version: '1.0.0' }
        ];

        const created = [];
        for (const env of defaultEnvs) {
            const newEnv = await base44.entities.Environment.create(env);
            created.push(newEnv);
        }

        setEnvironments(created);
    };

    const handlePromote = (fromEnv) => {
        setSelectedEnvironment(fromEnv);
        setShowPromoteDialog(true);
    };

    const handleDeploy = async (targetEnv, sourceEnv, commitMessage) => {
        try {
            const version = `v${Date.now()}`;
            
            const deployment = await base44.entities.Deployment.create({
                environment: targetEnv,
                version,
                type: 'full_deploy',
                status: 'in_progress',
                deployed_by: user.email,
                source_environment: sourceEnv,
                commit_message: commitMessage,
                changes: []
            });

            toast.success('Deployment initiated');

            // Simulate deployment
            setTimeout(async () => {
                await base44.entities.Deployment.update(deployment.id, {
                    status: 'completed',
                    duration_seconds: Math.floor(Math.random() * 60) + 10
                });

                const env = environments.find(e => e.name === targetEnv);
                if (env) {
                    await base44.entities.Environment.update(env.id, {
                        current_version: version,
                        last_deployed_at: new Date().toISOString(),
                        last_deployed_by: user.email
                    });
                }

                await loadData();
                toast.success('Deployment completed successfully!');
            }, 3000);

        } catch (error) {
            console.error('Deployment failed:', error);
            toast.error('Deployment failed');
        }
    };

    const handleRollback = async (environment) => {
        if (!confirm(`Rollback ${environment.display_name} to previous version?`)) return;

        try {
            const envDeployments = deployments.filter(
                d => d.environment === environment.name && d.status === 'completed'
            ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

            if (envDeployments.length < 2) {
                toast.error('No previous version to rollback to');
                return;
            }

            const previousDeployment = envDeployments[1];

            const rollbackDep = await base44.entities.Deployment.create({
                environment: environment.name,
                version: previousDeployment.version,
                type: 'full_deploy',
                status: 'completed',
                deployed_by: user.email,
                commit_message: `Rollback to ${previousDeployment.version}`,
                rollback_from: envDeployments[0].id,
                duration_seconds: 5
            });

            await base44.entities.Environment.update(environment.id, {
                current_version: previousDeployment.version,
                last_deployed_at: new Date().toISOString(),
                last_deployed_by: user.email
            });

            toast.success('Rollback completed');
            await loadData();
        } catch (error) {
            console.error('Rollback failed:', error);
            toast.error('Rollback failed');
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Rocket className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading deployment data...</p>
                </div>
            </div>
        );
    }

    const devEnv = environments.find(e => e.name === 'development');
    const stagingEnv = environments.find(e => e.name === 'staging');
    const prodEnv = environments.find(e => e.name === 'production');

    const stats = {
        total: deployments.length,
        successful: deployments.filter(d => d.status === 'completed').length,
        failed: deployments.filter(d => d.status === 'failed').length,
        inProgress: deployments.filter(d => d.status === 'in_progress').length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        CI/CD & Deployments
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Manage environments and deploy changes across your pipeline
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Deployments</p>
                                    <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                                </div>
                                <Rocket className="h-10 w-10 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Successful</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.successful}</p>
                                </div>
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Failed</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                                </div>
                                <XCircle className="h-10 w-10 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">In Progress</p>
                                    <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
                                </div>
                                <Activity className="h-10 w-10 text-orange-600 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Environment Pipeline */}
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            Deployment Pipeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {devEnv && (
                                <div className="space-y-3">
                                    <EnvironmentCard 
                                        environment={devEnv}
                                        deployments={deployments.filter(d => d.environment === 'development')}
                                        onRollback={handleRollback}
                                    />
                                    <div className="flex justify-center">
                                        <Button
                                            size="sm"
                                            onClick={() => handlePromote(devEnv)}
                                            className="bg-gradient-to-r from-blue-600 to-cyan-600"
                                        >
                                            Promote to Staging
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {stagingEnv && (
                                <div className="space-y-3">
                                    <EnvironmentCard 
                                        environment={stagingEnv}
                                        deployments={deployments.filter(d => d.environment === 'staging')}
                                        onRollback={handleRollback}
                                    />
                                    <div className="flex justify-center">
                                        <Button
                                            size="sm"
                                            onClick={() => handlePromote(stagingEnv)}
                                            className="bg-gradient-to-r from-orange-600 to-red-600"
                                        >
                                            Promote to Production
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {prodEnv && (
                                <div className="space-y-3">
                                    <EnvironmentCard 
                                        environment={prodEnv}
                                        deployments={deployments.filter(d => d.environment === 'production')}
                                        onRollback={handleRollback}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Deployment History */}
                <DeploymentHistory deployments={deployments} />

                {/* Promote Dialog */}
                <PromoteDialog
                    open={showPromoteDialog}
                    onClose={() => {
                        setShowPromoteDialog(false);
                        setSelectedEnvironment(null);
                    }}
                    sourceEnvironment={selectedEnvironment}
                    onDeploy={handleDeploy}
                />
            </div>
        </div>
    );
}