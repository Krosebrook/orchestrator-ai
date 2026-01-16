import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Save } from 'lucide-react';

export default function PerformanceThresholdSettings({ thresholds, onSave }) {
    const [settings, setSettings] = useState(thresholds || {
        responseTime: 5,
        successRate: 80,
        errorRate: 20,
        handoffTime: 3
    });

    const handleSave = () => {
        onSave(settings);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    Performance Thresholds
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-xs">Max Response Time (seconds)</Label>
                    <div className="flex items-center gap-3 mt-2">
                        <Slider
                            value={[settings.responseTime]}
                            onValueChange={([val]) => setSettings({...settings, responseTime: val})}
                            min={1}
                            max={30}
                            step={1}
                            className="flex-1"
                        />
                        <span className="text-sm font-semibold w-12 text-right">{settings.responseTime}s</span>
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Min Success Rate (%)</Label>
                    <div className="flex items-center gap-3 mt-2">
                        <Slider
                            value={[settings.successRate]}
                            onValueChange={([val]) => setSettings({...settings, successRate: val})}
                            min={50}
                            max={100}
                            step={5}
                            className="flex-1"
                        />
                        <span className="text-sm font-semibold w-12 text-right">{settings.successRate}%</span>
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Max Error Rate (%)</Label>
                    <div className="flex items-center gap-3 mt-2">
                        <Slider
                            value={[settings.errorRate]}
                            onValueChange={([val]) => setSettings({...settings, errorRate: val})}
                            min={0}
                            max={50}
                            step={5}
                            className="flex-1"
                        />
                        <span className="text-sm font-semibold w-12 text-right">{settings.errorRate}%</span>
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Max Handoff Time (seconds)</Label>
                    <div className="flex items-center gap-3 mt-2">
                        <Slider
                            value={[settings.handoffTime]}
                            onValueChange={([val]) => setSettings({...settings, handoffTime: val})}
                            min={1}
                            max={10}
                            step={0.5}
                            className="flex-1"
                        />
                        <span className="text-sm font-semibold w-12 text-right">{settings.handoffTime}s</span>
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full" size="sm">
                    <Save className="h-3 w-3 mr-2" />
                    Save Thresholds
                </Button>
            </CardContent>
        </Card>
    );
}