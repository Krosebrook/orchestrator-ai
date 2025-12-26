import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Bot, Workflow, Home, Plug, Rocket } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
    const navLinkClass = (pageName) => {
        const isActive = currentPageName === pageName;
        return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
        }`;
    };

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
                    <Link to={createPageUrl('Dashboard')} className={navLinkClass('Dashboard')}>
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link to={createPageUrl('Agents')} className={navLinkClass('Agents')}>
                        <Bot className="h-4 w-4" />
                        Agents
                    </Link>
                    <Link to={createPageUrl('Workflows')} className={navLinkClass('Workflows')}>
                        <Workflow className="h-4 w-4" />
                        Workflows
                    </Link>
                    <Link to={createPageUrl('Integrations')} className={navLinkClass('Integrations')}>
                        <Plug className="h-4 w-4" />
                        Integrations
                    </Link>
                    <Link to={createPageUrl('Deployments')} className={navLinkClass('Deployments')}>
                        <Rocket className="h-4 w-4" />
                        Deployments
                    </Link>
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