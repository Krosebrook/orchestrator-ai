import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, Eye, Edit, Plus, TrendingUp, RefreshCw } from 'lucide-react';

export default function KnowledgeAccessDashboard({ agents, knowledgeAccess, knowledgeArticles, skills, onRefresh }) {
    const getArticleTitle = (articleId) => {
        const article = knowledgeArticles.find(a => a.id === articleId);
        return article?.title || 'Unknown Article';
    };

    const getAccessTypeIcon = (type) => {
        switch (type) {
            case 'read': return <Eye className="h-3 w-3" />;
            case 'applied': return <TrendingUp className="h-3 w-3" />;
            case 'updated': return <Edit className="h-3 w-3" />;
            case 'created': return <Plus className="h-3 w-3" />;
            default: return <Book className="h-3 w-3" />;
        }
    };

    const getAccessStats = () => {
        return agents.map(agent => {
            const agentAccess = knowledgeAccess.filter(a => a.agent_name === agent.name);
            const agentSkills = skills.filter(s => s.agent_name === agent.name);
            
            return {
                agent: agent.name,
                total_access: agentAccess.length,
                reads: agentAccess.filter(a => a.access_type === 'read').length,
                applied: agentAccess.filter(a => a.access_type === 'applied').length,
                updates: agentAccess.filter(a => a.access_type === 'updated').length,
                created: agentAccess.filter(a => a.access_type === 'created').length,
                avg_effectiveness: agentAccess.filter(a => a.effectiveness_rating).length > 0
                    ? agentAccess.filter(a => a.effectiveness_rating).reduce((sum, a) => sum + a.effectiveness_rating, 0) / agentAccess.filter(a => a.effectiveness_rating).length
                    : 0,
                skills_count: agentSkills.length
            };
        });
    };

    const stats = getAccessStats();
    const recentAccess = knowledgeAccess.slice(0, 20);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                    Track how agents access and utilize shared knowledge
                </p>
                <Button variant="outline" onClick={onRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{knowledgeAccess.length}</p>
                            <p className="text-sm text-slate-600 mt-1">Total Accesses</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{knowledgeArticles.length}</p>
                            <p className="text-sm text-slate-600 mt-1">Knowledge Articles</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{agents.length}</p>
                            <p className="text-sm text-slate-600 mt-1">Active Agents</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600">{skills.length}</p>
                            <p className="text-sm text-slate-600 mt-1">Total Skills</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Access Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Agent Knowledge Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats.map((stat) => (
                            <div key={stat.agent} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold">{stat.agent}</span>
                                        <Badge variant="outline">{stat.skills_count} skills</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            {stat.reads} reads
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            {stat.applied} applied
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Edit className="h-3 w-3" />
                                            {stat.updates} updates
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Plus className="h-3 w-3" />
                                            {stat.created} created
                                        </span>
                                    </div>
                                </div>
                                {stat.avg_effectiveness > 0 && (
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">
                                            {stat.avg_effectiveness.toFixed(1)}/5
                                        </p>
                                        <p className="text-xs text-slate-500">effectiveness</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Access Log */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Knowledge Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recentAccess.map((access) => (
                            <div key={access.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`p-2 rounded ${
                                        access.access_type === 'created' ? 'bg-green-100' :
                                        access.access_type === 'updated' ? 'bg-blue-100' :
                                        access.access_type === 'applied' ? 'bg-purple-100' :
                                        'bg-slate-100'
                                    }`}>
                                        {getAccessTypeIcon(access.access_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {access.agent_name}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {getArticleTitle(access.knowledge_article_id)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {access.access_type}
                                    </Badge>
                                    {access.effectiveness_rating && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                            {access.effectiveness_rating}/5
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}