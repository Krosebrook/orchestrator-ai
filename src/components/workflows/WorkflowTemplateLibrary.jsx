import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Star, TrendingUp, Sparkles } from 'lucide-react';

export default function WorkflowTemplateLibrary({ onSelectTemplate }) {
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const templatesList = await base44.entities.WorkflowTemplate.list('-use_count');
            setTemplates(templatesList || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const featuredTemplates = filteredTemplates.filter(t => t.is_featured);
    const regularTemplates = filteredTemplates.filter(t => !t.is_featured);

    const getCategoryColor = (category) => {
        const colors = {
            research: 'bg-purple-100 text-purple-700',
            content_creation: 'bg-pink-100 text-pink-700',
            customer_support: 'bg-green-100 text-green-700',
            sales: 'bg-blue-100 text-blue-700',
            marketing: 'bg-orange-100 text-orange-700',
            data_analysis: 'bg-cyan-100 text-cyan-700',
            automation: 'bg-indigo-100 text-indigo-700',
            reporting: 'bg-slate-100 text-slate-700'
        };
        return colors[category] || 'bg-slate-100 text-slate-700';
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            beginner: 'bg-green-50 text-green-700 border-green-200',
            intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            advanced: 'bg-red-50 text-red-700 border-red-200'
        };
        return colors[difficulty] || 'bg-slate-50 text-slate-700';
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-400">Loading templates...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-10"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="content_creation">Content Creation</SelectItem>
                        <SelectItem value="customer_support">Customer Support</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="data_analysis">Data Analysis</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Featured Templates */}
            {featuredTemplates.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 uppercase tracking-wide text-xs flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                        Featured Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featuredTemplates.map((template) => (
                            <Card key={template.id} className="border-2 border-blue-200 bg-blue-50/30">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        <Badge className={getCategoryColor(template.category)}>
                                            {template.category.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-slate-600">{template.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {template.estimated_time}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            {template.use_count} uses
                                        </div>
                                        {template.rating > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {template.rating.toFixed(1)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge className={getDifficultyColor(template.difficulty)}>
                                            {template.difficulty}
                                        </Badge>
                                        {template.industry !== 'general' && (
                                            <Badge variant="outline" className="text-xs">
                                                {template.industry}
                                            </Badge>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={() => onSelectTemplate(template)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        Use Template
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Templates */}
            <div>
                {featuredTemplates.length > 0 && (
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 uppercase tracking-wide text-xs">
                        All Templates
                    </h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    <Badge className={getCategoryColor(template.category)} className="text-xs">
                                        {template.category.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-slate-600 line-clamp-2">{template.description}</p>
                                
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {template.estimated_time}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {template.use_count}
                                    </div>
                                </div>

                                <Badge className={getDifficultyColor(template.difficulty)} className="text-xs">
                                    {template.difficulty}
                                </Badge>

                                <Button 
                                    onClick={() => onSelectTemplate(template)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Use Template
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No templates found matching your criteria</p>
                </div>
            )}
        </div>
    );
}