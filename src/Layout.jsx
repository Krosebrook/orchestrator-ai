import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useState } from 'react';
import { LayoutDashboard, Bot, Workflow, Home, Plug, Rocket, BookOpen, Shield, BarChart3, GitMerge, Users, Sparkles, Activity, Settings, Brain } from 'lucide-react';
import { PermissionsProvider, usePermissions } from './components/rbac/PermissionCheck';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LiveActivityRail from './components/shared/LiveActivityRail';

function LayoutContent({ children, currentPageName }) {
    const { canAccessResource, loading } = usePermissions();
    const [showActivityRail, setShowActivityRail] = useState(true);
    
    const navLinkClass = (pageName) => {
        const isActive = currentPageName === pageName;
        return `flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
            isActive 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-700 hover:bg-slate-100'
        }`;
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3 animate-pulse" />
                <p className="text-slate-600">Loading permissions...</p>
            </div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-white">
            {showActivityRail && <LiveActivityRail />}

            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to={createPageUrl('Landing')} className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold">AI</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800">AI Platform</span>
                        </Link>
                        
                        <div className="flex items-center gap-1">
                            {/* PRIMARY NAVIGATION */}
                            <Link to={createPageUrl('Dashboard')} className={navLinkClass('Dashboard')}>
                            <LayoutDashboard className="h-4 w-4" />
                            Command Center
                            </Link>
                            {canAccessResource('agents') && (
                            <Link to={createPageUrl('Agents')} className={navLinkClass('Agents')}>
                                <Bot className="h-4 w-4" />
                                Agents
                            </Link>
                            )}
                            {canAccessResource('workflows') && (
                            <Link to={createPageUrl('Workflows')} className={navLinkClass('Workflows')}>
                                <Workflow className="h-4 w-4" />
                                Workflows
                            </Link>
                            )}

                            {/* CONTEXTUAL NAVIGATION */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
                                        <GitMerge className="h-4 w-4 mr-2" />
                                        Operations
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('AgentPerformance')} className="flex items-center">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Performance
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('Orchestration')} className="flex items-center">
                                            <GitMerge className="h-4 w-4 mr-2" />
                                            Orchestration
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('AgentCollaborationHub')} className="flex items-center">
                                            <Users className="h-4 w-4 mr-2" />
                                            Collaboration
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('MonitoringDashboard')} className="flex items-center">
                                            <Activity className="h-4 w-4 mr-2" />
                                            Monitoring
                                        </Link>
                                    </DropdownMenuItem>
                                    {canAccessResource('admin') && (
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('RealTimeAgentMonitor')} className="flex items-center">
                                                <Activity className="h-4 w-4 mr-2" />
                                                Real-Time Monitor
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Configure
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {canAccessResource('integrations') && (
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('Integrations')} className="flex items-center">
                                                <Plug className="h-4 w-4 mr-2" />
                                                Integrations
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('AgentSkillsManagement')} className="flex items-center">
                                            <Brain className="h-4 w-4 mr-2" />
                                            Skills & Knowledge
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('TrainingHub')} className="flex items-center">
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Training
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('KnowledgeBase')} className="flex items-center">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Knowledge Base
                                        </Link>
                                    </DropdownMenuItem>
                                    {canAccessResource('deployments') && (
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('Deployments')} className="flex items-center">
                                                <Rocket className="h-4 w-4 mr-2" />
                                                Deployments
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {canAccessResource('admin') && (
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('WorkflowCICD')} className="flex items-center">
                                                <Rocket className="h-4 w-4 mr-2" />
                                                CI/CD Pipeline
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {canAccessResource('admin') && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
                                            <Shield className="h-4 w-4 mr-2" />
                                            Admin
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('RoleManagement')} className="flex items-center">
                                                <Shield className="h-4 w-4 mr-2" />
                                                Roles
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('UserManagement')} className="flex items-center">
                                                <Users className="h-4 w-4 mr-2" />
                                                Users
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('AgentProfileAdmin')} className="flex items-center">
                                                <Bot className="h-4 w-4 mr-2" />
                                                Agent Admin
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main>
                {children}
            </main>
        </div>
        );
        }

        export default function Layout({ children, currentPageName }) {
        return (
        <PermissionsProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
        </PermissionsProvider>
        );
        }