import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Edit, Trash2, ThumbsUp, Eye } from 'lucide-react';
import moment from 'moment';

export default function KnowledgeArticleCard({ article, onEdit, onDelete }) {
    const categoryColors = {
        agent_best_practices: 'bg-blue-100 text-blue-700',
        workflow_patterns: 'bg-purple-100 text-purple-700',
        integration_guides: 'bg-green-100 text-green-700',
        troubleshooting: 'bg-red-100 text-red-700',
        api_documentation: 'bg-yellow-100 text-yellow-700',
        business_rules: 'bg-orange-100 text-orange-700'
    };

    return (
        <Card className="hover:shadow-lg transition-all">
            <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {article.verified && (
                        <Badge className="bg-green-600">Verified</Badge>
                    )}
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-3">{article.content}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                    <Badge className={categoryColors[article.category]} variant="outline">
                        {article.category.replace('_', ' ')}
                    </Badge>
                    {article.tags?.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.access_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful_count || 0}
                        </span>
                    </div>
                    <span>{moment(article.created_date).fromNow()}</span>
                </div>

                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(article)} className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(article.id)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}