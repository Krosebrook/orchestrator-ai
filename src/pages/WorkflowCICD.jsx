import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Rocket, Clock, CheckCircle } from 'lucide-react';
import WorkflowVersionControl from '../components/cicd/WorkflowVersionControl';
import DeploymentPipeline from '../components/cicd/DeploymentPipeline';
import EnvironmentManager from '../components/cicd/EnvironmentManager';
import DeploymentHistory from '../components/cicd/DeploymentHistory';
import { toast } from 'sonner';

export default function WorkflowCICDPage() {
    const [workflows, setWorkflows] = useState([]);
    const [versions, setVersions] = useState([]);
    const [deployments, setDeployments] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [workflowsList, versionsList, deploymentsList, envList] = await Promise.all([
                base44.entities.Workflow.list('-updated_date'),
                base44.entities.WorkflowVersion.list('-created_date'),
                base44.entities.WorkflowDeployment.list('-created_date', 100),
                base44.entities.Environment.list()
            ]);
            
            setWorkflows(workflowsList || []);
            setVersions(versionsList || []);
            setDeployments(deploymentsList || []);
            setEnvironments(envList || []);
        } catch (error) {
            console.error('Failed to load CI/CD data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeploy = async (workflowId, versionId, environment) => {
        try {
            const version = versions.find(v => v.id === versionId);
            const workflow = workflows.find(w => w.id === workflowId);

            // Create deployment
            const deployment = await base44.entities.WorkflowDeployment.create({
                workflow_id: workflowId,
                workflow_version_id: versionId,
                version: version.version,
                environment,
                status: 'testing',
                deployment_type: 'manual',
                deployed_config: version.workflow_config
            });

            toast.success(`Deployment to ${environment} started`);

            // Run tests
            await runTests(deployment.id);
            
            await loadData();
        } catch (error) {
            console.error('Deployment failed:', error);
            toast.error('Deployment failed');
        }
    };

    const runTests = async (deploymentId) => {
        // Simulate testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await base44.entities.WorkflowDeployment.update(deploymentId, {
            status: 'deploying',
            test_results: {
                passed: 8,
                failed: 0,
                total: 8,
                details: []
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await base44.entities.WorkflowDeployment.update(deploymentId, {
            status: 'deployed',
            deployed_at: new Date().toISOString()
        });
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Rocket className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600">Loading CI/CD pipeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Workflow CI/CD Pipeline
                    </h1>
                    <p className="text-slate-600 mt-1">Version control and automated deployments</p>
                </div>

                <Tabs defaultValue="pipeline" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="pipeline">
                            <Rocket className="h-4 w-4 mr-2" />
                            Pipeline
                        </TabsTrigger>
                        <TabsTrigger value="versions">
                            <GitBranch className="h-4 w-4 mr-2" />
                            Versions
                        </TabsTrigger>
                        <TabsTrigger value="environments">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Environments
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <Clock className="h-4 w-4 mr-2" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pipeline">
                        <DeploymentPipeline
                            workflows={workflows}
                            versions={versions}
                            deployments={deployments}
                            onDeploy={handleDeploy}
                            onRefresh={loadData}
                        />
                    </TabsContent>

                    <TabsContent value="versions">
                        <WorkflowVersionControl
                            workflows={workflows}
                            versions={versions}
                            onRefresh={loadData}
                        />
                    </TabsContent>

                    <TabsContent value="environments">
                        <EnvironmentManager
                            environments={environments}
                            deployments={deployments}
                            onRefresh={loadData}
                        />
                    </TabsContent>

                    <TabsContent value="history">
                        <DeploymentHistory
                            deployments={deployments}
                            workflows={workflows}
                            versions={versions}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}