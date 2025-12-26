import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import Landing from './pages/Landing';
import Integrations from './pages/Integrations';


export const PAGES = {
    "Agents": Agents,
    "Dashboard": Dashboard,
    "Workflows": Workflows,
    "Landing": Landing,
    "Integrations": Integrations,
}

export const pagesConfig = {
    mainPage: "Agents",
    Pages: PAGES,
};