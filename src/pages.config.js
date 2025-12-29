import AgentCollaborationHub from './pages/AgentCollaborationHub';
import AgentPerformance from './pages/AgentPerformance';
import AgentProfileAdmin from './pages/AgentProfileAdmin';
import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import Deployments from './pages/Deployments';
import GettingStarted from './pages/GettingStarted';
import Integrations from './pages/Integrations';
import Landing from './pages/Landing';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Orchestration from './pages/Orchestration';
import RoleManagement from './pages/RoleManagement';
import TrainingHub from './pages/TrainingHub';
import UserManagement from './pages/UserManagement';
import Workflows from './pages/Workflows';
import KnowledgeBase from './pages/KnowledgeBase';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentCollaborationHub": AgentCollaborationHub,
    "AgentPerformance": AgentPerformance,
    "AgentProfileAdmin": AgentProfileAdmin,
    "Agents": Agents,
    "Dashboard": Dashboard,
    "Deployments": Deployments,
    "GettingStarted": GettingStarted,
    "Integrations": Integrations,
    "Landing": Landing,
    "MonitoringDashboard": MonitoringDashboard,
    "Orchestration": Orchestration,
    "RoleManagement": RoleManagement,
    "TrainingHub": TrainingHub,
    "UserManagement": UserManagement,
    "Workflows": Workflows,
    "KnowledgeBase": KnowledgeBase,
}

export const pagesConfig = {
    mainPage: "Agents",
    Pages: PAGES,
    Layout: __Layout,
};