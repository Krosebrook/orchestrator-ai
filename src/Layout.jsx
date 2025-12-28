import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Bot, Workflow, Home, Plug, Rocket, BookOpen, Shield, BarChart3, GitMerge, Users } from 'lucide-react';
import { PermissionsProvider, usePermissions } from './components/rbac/PermissionCheck';

function LayoutContent({ children, currentPageName }) {
    const { canAccessResource, loading } = usePermissions();
    
    const navLinkClass = (pageName) => {
        const isActive = currentPageName === pageName;
        return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
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
        <div className="min-h-screen bg-slate-50">
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
                        
                        <div className="flex items-center gap-2">
                        <Link to={createPageUrl('Landing')} className={navLinkClass('Landing')}>
                        <Home className="h-4 w-4" />
                        Home
                        </Link>
                        <Link to={createPageUrl('GettingStarted')} className={navLinkClass('GettingStarted')}>
                        <BookOpen className="h-4 w-4" />
                        Getting Started
                        </Link>
                        <Link to={createPageUrl('Dashboard')} className={navLinkClass('Dashboard')}>
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
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
                        {canAccessResource('integrations') && (
                        <Link to={createPageUrl('Integrations')} className={navLinkClass('Integrations')}>
                            <Plug className="h-4 w-4" />
                            Integrations
                        </Link>
                        )}
                        {canAccessResource('deployments') && (
                        <Link to={createPageUrl('Deployments')} className={navLinkClass('Deployments')}>
                            <Rocket className="h-4 w-4" />
                            Deployments
                        </Link>
                        )}
                        <Link to={createPageUrl('AgentPerformance')} className={navLinkClass('AgentPerformance')}>
                            <BarChart3 className="h-4 w-4" />
                            Performance
                        </Link>
                        <Link to={createPageUrl('Orchestration')} className={navLinkClass('Orchestration')}>
                            <GitMerge className="h-4 w-4" />
                            Orchestration
                        </Link>
                        <Link to={createPageUrl('AgentCollaborationHub')} className={navLinkClass('AgentCollaborationHub')}>
                            <Users className="h-4 w-4" />
                            Collaboration
                        </Link>
                        {canAccessResource('admin') && (
                        <>
                            <Link to={createPageUrl('RoleManagement')} className={navLinkClass('RoleManagement')}>
                                <Shield className="h-4 w-4" />
                                Roles
                            </Link>
                            <Link to={createPageUrl('UserManagement')} className={navLinkClass('UserManagement')}>
                                <Shield className="h-4 w-4" />
                                Users
                            </Link>
                            <Link to={createPageUrl('AgentProfileAdmin')} className={navLinkClass('AgentProfileAdmin')}>
                                <Shield className="h-4 w-4" />
                                Agent Admin
                            </Link>
                        </>
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