/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgentCollaborationHub from './pages/AgentCollaborationHub';
import AgentPerformance from './pages/AgentPerformance';
import AgentProfileAdmin from './pages/AgentProfileAdmin';
import AgentSkillsManagement from './pages/AgentSkillsManagement';
import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import Deployments from './pages/Deployments';
import GettingStarted from './pages/GettingStarted';
import Integrations from './pages/Integrations';
import KnowledgeBase from './pages/KnowledgeBase';
import Landing from './pages/Landing';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Orchestration from './pages/Orchestration';
import RealTimeAgentMonitor from './pages/RealTimeAgentMonitor';
import RoleManagement from './pages/RoleManagement';
import TrainingHub from './pages/TrainingHub';
import UserManagement from './pages/UserManagement';
import WorkflowCICD from './pages/WorkflowCICD';
import Workflows from './pages/Workflows';
import WorkflowAnalytics from './pages/WorkflowAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentCollaborationHub": AgentCollaborationHub,
    "AgentPerformance": AgentPerformance,
    "AgentProfileAdmin": AgentProfileAdmin,
    "AgentSkillsManagement": AgentSkillsManagement,
    "Agents": Agents,
    "Dashboard": Dashboard,
    "Deployments": Deployments,
    "GettingStarted": GettingStarted,
    "Integrations": Integrations,
    "KnowledgeBase": KnowledgeBase,
    "Landing": Landing,
    "MonitoringDashboard": MonitoringDashboard,
    "Orchestration": Orchestration,
    "RealTimeAgentMonitor": RealTimeAgentMonitor,
    "RoleManagement": RoleManagement,
    "TrainingHub": TrainingHub,
    "UserManagement": UserManagement,
    "WorkflowCICD": WorkflowCICD,
    "Workflows": Workflows,
    "WorkflowAnalytics": WorkflowAnalytics,
}

export const pagesConfig = {
    mainPage: "Agents",
    Pages: PAGES,
    Layout: __Layout,
};