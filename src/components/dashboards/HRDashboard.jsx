import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, TrendingUp, Award, Plus } from 'lucide-react';

export default function HRDashboard({ user }) {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const employeesData = await base44.entities.Employee.list('-updated_date', 50);
            setEmployees(employeesData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const activeEmployees = employees.filter(e => e.employment_status === 'active');
    const onboarding = employees.filter(e => e.employment_status === 'onboarding');
    const avgPerformance = employees.filter(e => e.performance_rating).reduce((sum, e) => sum + e.performance_rating, 0) / employees.filter(e => e.performance_rating).length || 0;

    const departments = [...new Set(employees.map(e => e.department))];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">HR Dashboard</h2>
                    <p className="text-slate-600">Employee management and analytics</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Employees</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{employees.length}</p>
                            </div>
                            <Users className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{activeEmployees.length}</p>
                            </div>
                            <UserCheck className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Onboarding</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{onboarding.length}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Avg Performance</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{avgPerformance.toFixed(1)}/5</p>
                            </div>
                            <Award className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Department Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Department Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {departments.map((dept) => {
                            const deptCount = employees.filter(e => e.department === dept).length;
                            return (
                                <div key={dept} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                    <p className="text-sm text-slate-600 mb-1">{dept}</p>
                                    <p className="text-2xl font-bold text-slate-800">{deptCount}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Employees</CardTitle>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No employees yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {employees.slice(0, 10).map((employee) => (
                                <div key={employee.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-slate-800">{employee.full_name}</h3>
                                                <Badge>{employee.employment_status}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                <span>{employee.position}</span>
                                                <span>{employee.department}</span>
                                                {employee.performance_rating && (
                                                    <span>⭐ {employee.performance_rating}/5</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">View Profile</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}