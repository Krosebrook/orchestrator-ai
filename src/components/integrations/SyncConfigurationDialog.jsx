import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, ArrowLeftRight } from 'lucide-react';
import FieldMappingEditor from './FieldMappingEditor';

const SYNC_DIRECTIONS = [
    { value: 'push', label: 'Push to External', icon: ArrowRight },
    { value: 'pull', label: 'Pull from External', icon: ArrowRight },
    { value: 'bidirectional', label: 'Bidirectional Sync', icon: ArrowLeftRight }
];

const SYNC_FREQUENCIES = [
    { value: 'realtime', label: 'Real-time' },
    { value: 'hourly', label: 'Every Hour' },
    { value: 'daily', label: 'Daily' },
    { value: 'manual', label: 'Manual Only' }
];

export default function SyncConfigurationDialog({ open, onClose, integration, entities, onSave }) {
    const [config, setConfig] = useState({
        name: '',
        integration_id: integration?.id || '',
        integration_name: integration?.integration_name || '',
        entity_name: '',
        external_resource: '',
        sync_direction: 'push',
        sync_frequency: 'manual',
        field_mappings: [],
        filters: {}
    });

    const [showFieldMapping, setShowFieldMapping] = useState(false);

    useEffect(() => {
        if (integration) {
            setConfig(prev => ({
                ...prev,
                integration_id: integration.id,
                integration_name: integration.integration_name
            }));
        }
    }, [integration]);

    const handleSave = () => {
        onSave(config);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure Data Synchronization</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <Label>Sync Configuration Name</Label>
                            <Input
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                placeholder="e.g., Salesforce Leads Sync"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Internal Entity</Label>
                                <Select value={config.entity_name} onValueChange={(value) => setConfig({ ...config, entity_name: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select entity..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {entities.map((entity) => (
                                            <SelectItem key={entity} value={entity}>
                                                {entity}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>External Resource</Label>
                                <Input
                                    value={config.external_resource}
                                    onChange={(e) => setConfig({ ...config, external_resource: e.target.value })}
                                    placeholder="e.g., Contacts, Leads"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sync Direction */}
                    <div>
                        <Label>Sync Direction</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                            {SYNC_DIRECTIONS.map((dir) => {
                                const Icon = dir.icon;
                                return (
                                    <button
                                        key={dir.value}
                                        onClick={() => setConfig({ ...config, sync_direction: dir.value })}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            config.sync_direction === dir.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <Icon className={`h-6 w-6 mx-auto mb-2 ${
                                            config.sync_direction === dir.value ? 'text-blue-600' : 'text-slate-400'
                                        }`} />
                                        <p className="text-sm font-medium">{dir.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sync Frequency */}
                    <div>
                        <Label>Sync Frequency</Label>
                        <Select value={config.sync_frequency} onValueChange={(value) => setConfig({ ...config, sync_frequency: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SYNC_FREQUENCIES.map((freq) => (
                                    <SelectItem key={freq.value} value={freq.value}>
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-3 w-3" />
                                            {freq.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Field Mapping */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Field Mapping</Label>
                            <Badge variant="outline">
                                {config.field_mappings.length} mappings
                            </Badge>
                        </div>
                        {showFieldMapping ? (
                            <FieldMappingEditor
                                mappings={config.field_mappings}
                                onUpdate={(mappings) => setConfig({ ...config, field_mappings: mappings })}
                                entityName={config.entity_name}
                            />
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowFieldMapping(true)}
                                className="w-full"
                            >
                                Configure Field Mappings
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={!config.name || !config.entity_name || !config.external_resource}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        Create Sync Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}