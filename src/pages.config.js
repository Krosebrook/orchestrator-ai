import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import Landing from './pages/Landing';
import Workflows from './pages/Workflows';


export const PAGES = {
    "Agents": Agents,
    "Dashboard": Dashboard,
    "Integrations": Integrations,
    "Landing": Landing,
    "Workflows": Workflows,
}

export const pagesConfig = {
    mainPage: "Agents",
    Pages: PAGES,
};