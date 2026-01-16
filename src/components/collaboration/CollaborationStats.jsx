// Extracted stats cards for better modularity and reusability
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Zap } from 'lucide-react';

export default function CollaborationStats({ sessions, agentsCount }) {
    // Memoize computed values to avoid recalculation on every render
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                label="Active Sessions"
                value={activeSessions}
                icon={Activity}
                iconColor="text-blue-600"
            />
            <StatCard
                label="Total Agents"
                value={agentsCount}
                icon={Users}
                iconColor="text-purple-600"
            />
            <StatCard
                label="Completed"
                value={completedSessions}
                icon={Zap}
                iconColor="text-green-600"
            />
        </div>
    );
}

// Internal component for consistent stat card rendering
function StatCard({ label, value, icon: Icon, iconColor }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600">{label}</p>
                        <p className="text-3xl font-bold text-slate-800">{value}</p>
                    </div>
                    <Icon className={`h-10 w-10 ${iconColor}`} />
                </div>
            </CardContent>
        </Card>
    );
}