import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Target, TrendingUp } from 'lucide-react';

export default function TrainingModuleCard({ module, onStart, sessions }) {
    const moduleSessions = sessions || [];
    const completedSessions = moduleSessions.filter(s => s.status === 'completed');
    const avgScore = completedSessions.length > 0
        ? (completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length).toFixed(1)
        : 'N/A';

    const difficultyColors = {
        beginner: 'bg-green-100 text-green-700',
        intermediate: 'bg-yellow-100 text-yellow-700',
        advanced: 'bg-red-100 text-red-700'
    };

    return (
        <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
                <CardTitle className="flex items-start justify-between">
                    <span className="text-base">{module.title}</span>
                    <Badge className={difficultyColors[module.difficulty]}>
                        {module.difficulty}
                    </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600 mt-2">{module.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>{module.scenarios?.length || 0} scenarios</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span>{completedSessions.length} completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span>{avgScore}</span>
                    </div>
                </div>

                {module.learning_objectives && module.learning_objectives.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-slate-700 mb-1">Learning Objectives:</p>
                        <ul className="text-xs text-slate-600 space-y-0.5">
                            {module.learning_objectives.slice(0, 3).map((obj, idx) => (
                                <li key={idx}>• {obj}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-wrap gap-1">
                    {module.target_agents?.slice(0, 3).map((agent, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                            {agent}
                        </Badge>
                    ))}
                </div>

                {module.scenarios && module.scenarios.length > 0 && (
                    <div className="pt-2 space-y-2">
                        {module.scenarios.slice(0, 2).map((scenario) => (
                            <Button
                                key={scenario.id}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => onStart(module, scenario)}
                            >
                                Start: {scenario.name}
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}