import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, ThumbsUp, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartMappingSuggestions({ 
    integrationId, 
    endpointPath, 
    sourceFields,
    onApplySuggestion 
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generateSuggestions();
    }, [integrationId, endpointPath, sourceFields]);

    const generateSuggestions = async () => {
        setLoading(true);
        try {
            // Load historical patterns
            const patterns = await base44.entities.ApiMappingPattern.filter({
                integration_id: integrationId,
                endpoint_path: endpointPath
            });

            // Load all patterns to find common mappings
            const allPatterns = await base44.entities.ApiMappingPattern.list('-usage_count', 100);

            // Generate AI-powered suggestions
            const aiSuggestions = await generateAISuggestions(
                sourceFields, 
                patterns,
                allPatterns
            );

            setSuggestions(aiSuggestions);
        } catch (error) {
            console.error('Failed to generate suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAISuggestions = async (fields, patterns, allPatterns) => {
        const suggestions = [];

        // Strategy 1: Use historical patterns for this endpoint
        patterns.forEach(pattern => {
            if (fields.includes(pattern.source_field)) {
                suggestions.push({
                    source: pattern.source_field,
                    target: pattern.target_field,
                    type: pattern.mapping_type,
                    confidence: 0.95,
                    reason: 'Previously used mapping',
                    usageCount: pattern.usage_count
                });
            }
        });

        // Strategy 2: Find similar field names using fuzzy matching
        fields.forEach(field => {
            const fieldLower = field.toLowerCase();
            
            // Common mapping patterns
            if (fieldLower.includes('email')) {
                suggestions.push({
                    source: field,
                    target: 'email',
                    type: 'direct',
                    confidence: 0.9,
                    reason: 'Common field pattern'
                });
            }
            if (fieldLower.includes('name')) {
                suggestions.push({
                    source: field,
                    target: 'name',
                    type: 'direct',
                    confidence: 0.9,
                    reason: 'Common field pattern'
                });
            }
            if (fieldLower.includes('phone')) {
                suggestions.push({
                    source: field,
                    target: 'phone',
                    type: 'transform',
                    confidence: 0.85,
                    reason: 'Phone formatting recommended',
                    transform: 'formatPhoneNumber'
                });
            }
            if (fieldLower.includes('date')) {
                suggestions.push({
                    source: field,
                    target: field,
                    type: 'transform',
                    confidence: 0.85,
                    reason: 'Date formatting recommended',
                    transform: 'formatDate'
                });
            }
        });

        // Strategy 3: Learn from cross-integration patterns
        const popularMappings = allPatterns
            .filter(p => p.usage_count > 5)
            .slice(0, 10);

        popularMappings.forEach(popular => {
            if (fields.includes(popular.source_field)) {
                suggestions.push({
                    source: popular.source_field,
                    target: popular.target_field,
                    type: popular.mapping_type,
                    confidence: 0.75,
                    reason: `Popular mapping (used ${popular.usage_count}x)`,
                    usageCount: popular.usage_count
                });
            }
        });

        // Remove duplicates and sort by confidence
        const uniqueSuggestions = suggestions.reduce((acc, curr) => {
            const key = `${curr.source}-${curr.target}`;
            if (!acc[key] || acc[key].confidence < curr.confidence) {
                acc[key] = curr;
            }
            return acc;
        }, {});

        return Object.values(uniqueSuggestions)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10);
    };

    const handleApplySuggestion = async (suggestion) => {
        try {
            const user = await base44.auth.me();
            
            // Save the pattern for learning
            const existingPatterns = await base44.entities.ApiMappingPattern.filter({
                integration_id: integrationId,
                endpoint_path: endpointPath,
                source_field: suggestion.source,
                target_field: suggestion.target
            });

            if (existingPatterns && existingPatterns.length > 0) {
                // Increment usage count
                const pattern = existingPatterns[0];
                await base44.entities.ApiMappingPattern.update(pattern.id, {
                    usage_count: (pattern.usage_count || 0) + 1
                });
            } else {
                // Create new pattern
                await base44.entities.ApiMappingPattern.create({
                    integration_id: integrationId,
                    endpoint_path: endpointPath,
                    source_field: suggestion.source,
                    target_field: suggestion.target,
                    mapping_type: suggestion.type,
                    transform_function: suggestion.transform,
                    confidence_score: suggestion.confidence,
                    usage_count: 1,
                    user_email: user.email
                });
            }

            onApplySuggestion(suggestion);
            toast.success('Mapping applied and learned');
        } catch (error) {
            console.error('Failed to apply suggestion:', error);
            toast.error('Failed to apply suggestion');
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-slate-600">Generating AI suggestions...</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI-Powered Mapping Suggestions
                </CardTitle>
            </CardHeader>
            <CardContent>
                {suggestions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No suggestions available for current fields
                    </p>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {suggestions.map((suggestion, idx) => (
                                <Card key={idx} className="border-2 hover:border-purple-300 transition-all">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <code className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                        {suggestion.source}
                                                    </code>
                                                    <span className="text-slate-400">→</span>
                                                    <code className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                        {suggestion.target}
                                                    </code>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {suggestion.type}
                                                    </Badge>
                                                    {suggestion.transform && (
                                                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                                                            <Zap className="h-2 w-2 mr-1" />
                                                            {suggestion.transform}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600">{suggestion.reason}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={
                                                    suggestion.confidence >= 0.9 ? 'bg-green-600' :
                                                    suggestion.confidence >= 0.8 ? 'bg-blue-600' :
                                                    'bg-yellow-600'
                                                }>
                                                    {(suggestion.confidence * 100).toFixed(0)}%
                                                </Badge>
                                                {suggestion.usageCount && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {suggestion.usageCount}x used
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApplySuggestion(suggestion)}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                            <ThumbsUp className="h-3 w-3 mr-2" />
                                            Apply Mapping
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}