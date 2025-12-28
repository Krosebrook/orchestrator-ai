import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Users, Shield, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions, ProtectedRoute } from '../components/rbac/PermissionCheck';

export default function UserManagementPage() {
    const { hasPermission } = usePermissions();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [roleAssignments, setRoleAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersList, rolesList, assignmentsList] = await Promise.all([
                base44.entities.User.list(),
                base44.entities.Role.list(),
                base44.entities.RoleAssignment.list()
            ]);

            setUsers(usersList || []);
            setRoles(rolesList || []);
            setRoleAssignments(assignmentsList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const getUserRole = (userEmail) => {
        const assignment = roleAssignments.find(a => a.user_email === userEmail);
        if (!assignment) return null;
        return roles.find(r => r.id === assignment.role_id);
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRoleId) {
            toast.error('Please select a role');
            return;
        }

        try {
            const currentUser = await base44.auth.me();

            // Check if user already has an assignment
            const existing = roleAssignments.find(a => a.user_email === selectedUser.email);
            const selectedRole = roles.find(r => r.id === selectedRoleId);

            if (existing) {
                await base44.entities.RoleAssignment.update(existing.id, {
                    role_id: selectedRoleId,
                    role_name: selectedRole.name,
                    assigned_by: currentUser.email
                });
                toast.success('Role updated successfully');
            } else {
                await base44.entities.RoleAssignment.create({
                    user_email: selectedUser.email,
                    role_id: selectedRoleId,
                    role_name: selectedRole.name,
                    assigned_by: currentUser.email
                });
                toast.success('Role assigned successfully');
            }

            // Update role user count
            const currentCount = selectedRole.user_count || 0;
            await base44.entities.Role.update(selectedRoleId, {
                user_count: currentCount + 1
            });

            await loadData();
            setShowAssignDialog(false);
            setSelectedUser(null);
            setSelectedRoleId('');
        } catch (error) {
            console.error('Failed to assign role:', error);
            toast.error('Failed to assign role');
        }
    };

    const handleRemoveRole = async (userEmail) => {
        if (!confirm('Remove role from this user?')) return;

        try {
            const assignment = roleAssignments.find(a => a.user_email === userEmail);
            if (assignment) {
                await base44.entities.RoleAssignment.delete(assignment.id);
                
                // Update role user count
                const role = roles.find(r => r.id === assignment.role_id);
                if (role && role.user_count > 0) {
                    await base44.entities.Role.update(role.id, {
                        user_count: role.user_count - 1
                    });
                }

                toast.success('Role removed successfully');
                await loadData();
            }
        } catch (error) {
            console.error('Failed to remove role:', error);
            toast.error('Failed to remove role');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ProtectedRoute resource="admin">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            User Management
                        </h1>
                        <p className="text-slate-600 mt-1">Manage user roles and permissions</p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="pl-10 bg-white"
                        />
                    </div>

                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Users ({filteredUsers.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-12">
                                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4 animate-pulse" />
                                    <p className="text-slate-600">Loading users...</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredUsers.map((user) => {
                                        const userRole = getUserRole(user.email);
                                        const isSuperAdmin = user.role === 'admin';

                                        return (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{user.full_name || 'Unnamed User'}</p>
                                                        <p className="text-sm text-slate-600 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {isSuperAdmin ? (
                                                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                                            Super Admin
                                                        </Badge>
                                                    ) : userRole ? (
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                                                                <Shield className="h-3 w-3" />
                                                                {userRole.name}
                                                            </Badge>
                                                            {hasPermission('admin', 'manage_users') && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedUser(user);
                                                                            setSelectedRoleId(userRole.id);
                                                                            setShowAssignDialog(true);
                                                                        }}
                                                                    >
                                                                        Change
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveRole(user.email)}
                                                                        className="text-red-600"
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Badge variant="outline">No Role</Badge>
                                                            {hasPermission('admin', 'manage_users') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setSelectedRoleId('');
                                                                        setShowAssignDialog(true);
                                                                    }}
                                                                >
                                                                    Assign Role
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Assign Role Dialog */}
                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Role</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <Label>User</Label>
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold">{selectedUser?.full_name}</p>
                                    <p className="text-sm text-slate-600">{selectedUser?.email}</p>
                                </div>
                            </div>

                            <div>
                                <Label>Role</Label>
                                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssignRole} className="bg-gradient-to-r from-blue-600 to-purple-600">
                                Assign Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}