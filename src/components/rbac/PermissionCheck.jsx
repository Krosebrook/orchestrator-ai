import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";

const PermissionsContext = createContext({});

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            // Super admins (role === 'admin') have all permissions
            if (currentUser.role === 'admin') {
                setPermissions(getAllPermissions());
                setLoading(false);
                return;
            }

            // Load role assignments for user
            const assignments = await base44.entities.RoleAssignment.filter({
                user_email: currentUser.email
            });

            if (assignments.length === 0) {
                // No role assigned - minimal permissions
                setPermissions(getDefaultPermissions());
                setLoading(false);
                return;
            }

            // Get the role details
            const roleId = assignments[0].role_id;
            const roles = await base44.entities.Role.filter({ id: roleId });
            
            if (roles.length > 0) {
                setPermissions(roles[0].permissions || getDefaultPermissions());
            } else {
                setPermissions(getDefaultPermissions());
            }
        } catch (error) {
            console.error('Failed to load permissions:', error);
            setPermissions(getDefaultPermissions());
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (resource, action) => {
        if (!permissions) return false;
        if (user?.role === 'admin') return true; // Super admin
        return permissions[resource]?.[action] === true;
    };

    const canAccessResource = (resource) => {
        if (!permissions) return false;
        if (user?.role === 'admin') return true;
        const resourcePerms = permissions[resource];
        if (!resourcePerms) return false;
        return Object.values(resourcePerms).some(p => p === true);
    };

    return (
        <PermissionsContext.Provider value={{ permissions, loading, hasPermission, canAccessResource, user, refresh: loadPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within PermissionsProvider');
    }
    return context;
};

export const ProtectedAction = ({ resource, action, children, fallback = null }) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(resource, action)) {
        return fallback;
    }
    
    return children;
};

export const ProtectedRoute = ({ resource, children, fallback = null }) => {
    const { canAccessResource } = usePermissions();
    
    if (!canAccessResource(resource)) {
        return fallback || (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg font-semibold text-slate-800 mb-2">Access Denied</p>
                    <p className="text-slate-600">You don't have permission to access this resource</p>
                </div>
            </div>
        );
    }
    
    return children;
};

// Helper functions
const getAllPermissions = () => ({
    agents: { view: true, chat: true, create: true, edit: true, delete: true, manage_versions: true },
    workflows: { view: true, create: true, edit: true, delete: true, execute: true, view_executions: true },
    entities: { view: true, create: true, edit: true, delete: true },
    integrations: { view: true, connect: true, disconnect: true },
    deployments: { view: true, deploy: true, rollback: true },
    admin: { manage_users: true, manage_roles: true, view_analytics: true }
});

const getDefaultPermissions = () => ({
    agents: { view: true, chat: true, create: false, edit: false, delete: false, manage_versions: false },
    workflows: { view: true, create: false, edit: false, delete: false, execute: true, view_executions: true },
    entities: { view: true, create: false, edit: false, delete: false },
    integrations: { view: true, connect: false, disconnect: false },
    deployments: { view: true, deploy: false, rollback: false },
    admin: { manage_users: false, manage_roles: false, view_analytics: false }
});