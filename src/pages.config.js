import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import Landing from './pages/Landing';
import Workflows from './pages/Workflows';
import Deployments from './pages/Deployments';


export const PAGES = {
    "Agents": Agents,
    "Dashboard": Dashboard,
    "Integrations": Integrations,
    "Landing": Landing,
    "Workflows": Workflows,
    "Deployments": Deployments,
}

export const pagesConfig = {
    mainPage: "Agents",
    Pages: PAGES,
};