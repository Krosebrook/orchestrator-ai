import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
    Settings, 
    LayoutGrid, 
    BarChart3, 
    TrendingUp, 
    Users, 
    Clock,
    Target,
    Activity,
    DollarSign,
    CheckCircle,
    Save,
    RotateCcw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function DashboardCustomizer({ open, onClose, onSave, currentLayout }) {
    const availableWidgets = [
        { id: 'kpi_cards', name: 'KPI Cards', icon: BarChart3, category: 'metrics' },
        { id: 'trend_chart', name: 'Trend Chart', icon: TrendingUp, category: 'charts' },
        { id: 'user_stats', name: 'User Statistics', icon: Users, category: 'metrics' },
        { id: 'activity_feed', name: 'Activity Feed', icon: Activity, category: 'updates' },
        { id: 'revenue_chart', name: 'Revenue Chart', icon: DollarSign, category: 'charts' },
        { id: 'task_list', name: 'Task List', icon: CheckCircle, category: 'tasks' },
        { id: 'time_tracking', name: 'Time Tracking', icon: Clock, category: 'metrics' },
        { id: 'goals_progress', name: 'Goals Progress', icon: Target, category: 'metrics' }
    ];

    const [enabledWidgets, setEnabledWidgets] = useState(
        currentLayout?.widgets || availableWidgets.map(w => w.id)
    );

    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All' },
        { id: 'metrics', name: 'Metrics' },
        { id: 'charts', name: 'Charts' },
        { id: 'tasks', name: 'Tasks' },
        { id: 'updates', name: 'Updates' }
    ];

    const toggleWidget = (widgetId) => {
        setEnabledWidgets(prev => 
            prev.includes(widgetId) 
                ? prev.filter(id => id !== widgetId)
                : [...prev, widgetId]
        );
    };

    const handleSave = () => {
        onSave({ widgets: enabledWidgets });
        toast.success('Dashboard layout saved');
        onClose();
    };

    const handleReset = () => {
        setEnabledWidgets(availableWidgets.map(w => w.id));
        toast.info('Dashboard reset to default');
    };

    const filteredWidgets = availableWidgets.filter(widget => 
        selectedCategory === 'all' || widget.category === selectedCategory
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Customize Dashboard
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <LayoutGrid className="h-4 w-4 inline mr-2" />
                            Toggle widgets on/off to customize your dashboard view. Changes are saved per user.
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(category => (
                            <Button
                                key={category.id}
                                variant={selectedCategory === category.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>

                    {/* Widget Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredWidgets.map((widget) => {
                            const Icon = widget.icon;
                            const isEnabled = enabledWidgets.includes(widget.id);
                            
                            return (
                                <Card 
                                    key={widget.id}
                                    className={cn(
                                        "border-2 transition-all cursor-pointer",
                                        isEnabled ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                                    )}
                                    onClick={() => toggleWidget(widget.id)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-lg flex items-center justify-center",
                                                    isEnabled ? "bg-blue-600" : "bg-slate-200"
                                                )}>
                                                    <Icon className={cn(
                                                        "h-5 w-5",
                                                        isEnabled ? "text-white" : "text-slate-600"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{widget.name}</p>
                                                    <Badge variant="outline" className="mt-1 capitalize">
                                                        {widget.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isEnabled}
                                                onCheckedChange={() => toggleWidget(widget.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                                {enabledWidgets.length} of {availableWidgets.length} widgets enabled
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                            >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset to Default
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600">
                            <Save className="h-4 w-4 mr-2" />
                            Save Layout
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}