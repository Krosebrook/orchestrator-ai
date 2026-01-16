import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions, ProtectedRoute } from '../components/rbac/PermissionCheck';

const PERMISSION_CATEGORIES = [
    {
        id: 'agents',
        label: 'Agents',
        permissions: [
            { key: 'view', label: 'View Agents' },
            { key: 'chat', label: 'Chat with Agents' },
            { key: 'create', label: 'Create Agents' },
            { key: 'edit', label: 'Edit Agents' },
            { key: 'delete', label: 'Delete Agents' },
            { key: 'manage_versions', label: 'Manage Versions' }
        ]
    },
    {
        id: 'workflows',
        label: 'Workflows',
        permissions: [
            { key: 'view', label: 'View Workflows' },
            { key: 'create', label: 'Create Workflows' },
            { key: 'edit', label: 'Edit Workflows' },
            { key: 'delete', label: 'Delete Workflows' },
            { key: 'execute', label: 'Execute Workflows' },
            { key: 'view_executions', label: 'View Executions' }
        ]
    },
    {
        id: 'entities',
        label: 'Entity Data',
        permissions: [
            { key: 'view', label: 'View Data' },
            { key: 'create', label: 'Create Records' },
            { key: 'edit', label: 'Edit Records' },
            { key: 'delete', label: 'Delete Records' }
        ]
    },
    {
        id: 'integrations',
        label: 'Integrations',
        permissions: [
            { key: 'view', label: 'View Integrations' },
            { key: 'connect', label: 'Connect Services' },
            { key: 'disconnect', label: 'Disconnect Services' }
        ]
    },
    {
        id: 'deployments',
        label: 'Deployments',
        permissions: [
            { key: 'view', label: 'View Deployments' },
            { key: 'deploy', label: 'Deploy Changes' },
            { key: 'rollback', label: 'Rollback Deployments' }
        ]
    },
    {
        id: 'admin',
        label: 'Administration',
        permissions: [
            { key: 'manage_users', label: 'Manage Users' },
            { key: 'manage_roles', label: 'Manage Roles' },
            { key: 'view_analytics', label: 'View Analytics' }
        ]
    }
];

export default function RoleManagementPage() {
    const { hasPermission } = usePermissions();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permissions: {}
    });

    useEffect(() => {
        loadRoles();
        initializeSystemRoles();
    }, []);

    const initializeSystemRoles = async () => {
        try {
            const existingRoles = await base44.entities.Role.list();
            const systemRoleNames = ['Administrator', 'Editor', 'Viewer'];
            
            for (const roleName of systemRoleNames) {
                const exists = existingRoles.find(r => r.name === roleName && r.is_system_role);
                if (!exists) {
                    await base44.entities.Role.create(getSystemRoleConfig(roleName));
                }
            }
        } catch (error) {
            console.error('Failed to initialize system roles:', error);
        }
    };

    const getSystemRoleConfig = (roleName) => {
        const configs = {
            'Administrator': {
                name: 'Administrator',
                description: 'Full access to all features',
                is_system_role: true,
                permissions: {
                    agents: { view: true, chat: true, create: true, edit: true, delete: true, manage_versions: true },
                    workflows: { view: true, create: true, edit: true, delete: true, execute: true, view_executions: true },
                    entities: { view: true, create: true, edit: true, delete: true },
                    integrations: { view: true, connect: true, disconnect: true },
                    deployments: { view: true, deploy: true, rollback: true },
                    admin: { manage_users: true, manage_roles: true, view_analytics: true }
                }
            },
            'Editor': {
                name: 'Editor',
                description: 'Can create and edit content',
                is_system_role: true,
                permissions: {
                    agents: { view: true, chat: true, create: true, edit: true, delete: false, manage_versions: false },
                    workflows: { view: true, create: true, edit: true, delete: false, execute: true, view_executions: true },
                    entities: { view: true, create: true, edit: true, delete: false },
                    integrations: { view: true, connect: false, disconnect: false },
                    deployments: { view: true, deploy: false, rollback: false },
                    admin: { manage_users: false, manage_roles: false, view_analytics: false }
                }
            },
            'Viewer': {
                name: 'Viewer',
                description: 'Read-only access',
                is_system_role: true,
                permissions: {
                    agents: { view: true, chat: true, create: false, edit: false, delete: false, manage_versions: false },
                    workflows: { view: true, create: false, edit: false, delete: false, execute: true, view_executions: true },
                    entities: { view: true, create: false, edit: false, delete: false },
                    integrations: { view: true, connect: false, disconnect: false },
                    deployments: { view: true, deploy: false, rollback: false },
                    admin: { manage_users: false, manage_roles: false, view_analytics: false }
                }
            }
        };
        return configs[roleName];
    };

    const loadRoles = async () => {
        try {
            const rolesList = await base44.entities.Role.list('-created_date');
            setRoles(rolesList || []);
        } catch (error) {
            console.error('Failed to load roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = () => {
        setEditingRole(null);
        setRoleForm({
            name: '',
            description: '',
            permissions: initializePermissions()
        });
        setShowRoleDialog(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || initializePermissions()
        });
        setShowRoleDialog(true);
    };

    const handleSaveRole = async () => {
        if (!roleForm.name) {
            toast.error('Role name is required');
            return;
        }

        try {
            if (editingRole) {
                await base44.entities.Role.update(editingRole.id, roleForm);
                toast.success('Role updated successfully');
            } else {
                await base44.entities.Role.create(roleForm);
                toast.success('Role created successfully');
            }
            await loadRoles();
            setShowRoleDialog(false);
        } catch (error) {
            console.error('Failed to save role:', error);
            toast.error('Failed to save role');
        }
    };

    const handleDeleteRole = async (role) => {
        if (role.is_system_role) {
            toast.error('Cannot delete system roles');
            return;
        }

        if (!confirm(`Delete role "${role.name}"?`)) return;

        try {
            await base44.entities.Role.delete(role.id);
            toast.success('Role deleted successfully');
            await loadRoles();
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error('Failed to delete role');
        }
    };

    const initializePermissions = () => {
        const perms = {};
        PERMISSION_CATEGORIES.forEach(cat => {
            perms[cat.id] = {};
            cat.permissions.forEach(perm => {
                perms[cat.id][perm.key] = false;
            });
        });
        return perms;
    };

    const togglePermission = (category, permission) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [category]: {
                    ...prev.permissions[category],
                    [permission]: !prev.permissions[category]?.[permission]
                }
            }
        }));
    };

    const toggleCategoryAll = (category, value) => {
        const cat = PERMISSION_CATEGORIES.find(c => c.id === category);
        const newPerms = {};
        cat.permissions.forEach(perm => {
            newPerms[perm.key] = value;
        });
        setRoleForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [category]: newPerms
            }
        }));
    };

    const getPermissionCount = (role) => {
        let count = 0;
        Object.values(role.permissions || {}).forEach(cat => {
            Object.values(cat).forEach(val => {
                if (val === true) count++;
            });
        });
        return count;
    };

    return (
        <ProtectedRoute resource="admin">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Role Management
                            </h1>
                            <p className="text-slate-600 mt-1">Define custom roles and permissions</p>
                        </div>
                        {hasPermission('admin', 'manage_roles') && (
                            <Button 
                                onClick={handleCreateRole}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Role
                            </Button>
                        )}
                    </div>

                    {/* Roles Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4 animate-pulse" />
                            <p className="text-slate-600">Loading roles...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role) => (
                                <Card key={role.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                    <Shield className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{role.name}</CardTitle>
                                                    {role.is_system_role && (
                                                        <Badge variant="outline" className="mt-1 text-xs">
                                                            System
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <CardDescription className="mt-2">
                                            {role.description || 'No description'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Permissions</span>
                                                <Badge className="bg-blue-100 text-blue-700">
                                                    {getPermissionCount(role)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Users</span>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-slate-500" />
                                                    <span>{role.user_count || 0}</span>
                                                </div>
                                            </div>
                                            {hasPermission('admin', 'manage_roles') && (
                                                <div className="flex gap-2 pt-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleEditRole(role)}
                                                        className="flex-1"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                    {!role.is_system_role && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleDeleteRole(role)}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Role Dialog */}
                <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    placeholder="e.g., Content Manager"
                                    disabled={editingRole?.is_system_role}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    placeholder="Describe what this role can do"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base">Permissions</Label>
                                {PERMISSION_CATEGORIES.map(category => (
                                    <Card key={category.id}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">{category.label}</CardTitle>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleCategoryAll(category.id, true)}
                                                        className="h-7 text-xs"
                                                    >
                                                        All
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleCategoryAll(category.id, false)}
                                                        className="h-7 text-xs"
                                                    >
                                                        None
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-3">
                                                {category.permissions.map(perm => (
                                                    <div key={perm.key} className="flex items-center justify-between">
                                                        <Label htmlFor={`${category.id}-${perm.key}`} className="text-sm cursor-pointer">
                                                            {perm.label}
                                                        </Label>
                                                        <Switch
                                                            id={`${category.id}-${perm.key}`}
                                                            checked={roleForm.permissions[category.id]?.[perm.key] || false}
                                                            onCheckedChange={() => togglePermission(category.id, perm.key)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveRole} className="bg-gradient-to-r from-blue-600 to-purple-600">
                                {editingRole ? 'Update Role' : 'Create Role'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}