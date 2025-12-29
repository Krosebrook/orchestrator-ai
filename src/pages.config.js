import AgentCollaborationHub from './pages/AgentCollaborationHub';
import AgentPerformance from './pages/AgentPerformance';
import AgentProfileAdmin from './pages/AgentProfileAdmin';
import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import Deployments from './pages/Deployments';
import GettingStarted from './pages/GettingStarted';
import Integrations from './pages/Integrations';
import Landing from './pages/Landing';
import Orchestration from './pages/Orchestration';
import RoleManagement from './pages/RoleManagement';
import UserManagement from './pages/UserManagement';
import Workflows from './pages/Workflows';
import TrainingHub from './pages/TrainingHub';
import MonitoringDashboard from './pages/MonitoringDashboard';
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
    "Orchestration": Orchestration,
    "RoleManagement": RoleManagement,
    "UserManagement": UserManagement,
    "Workflows": Workflows,
    "TrainingHub": TrainingHub,
    "MonitoringDashboard": MonitoringDashboard,
    "KnowledgeBase": KnowledgeBase,
}

export const pagesConfig = {
    mainPage: "Agents",
    Pages: PAGES,
    Layout: __Layout,
};