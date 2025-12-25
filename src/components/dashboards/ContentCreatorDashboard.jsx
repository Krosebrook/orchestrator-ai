import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, Video, TrendingUp, Plus } from 'lucide-react';

export default function ContentCreatorDashboard({ user }) {
    const [contentPieces, setContentPieces] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const contentData = await base44.entities.ContentPiece.filter({ author: user?.email }, '-updated_date', 50);
            setContentPieces(contentData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            idea: 'bg-slate-100 text-slate-700',
            draft: 'bg-yellow-100 text-yellow-700',
            review: 'bg-blue-100 text-blue-700',
            approved: 'bg-green-100 text-green-700',
            published: 'bg-green-500 text-white',
            archived: 'bg-slate-300 text-slate-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const inDraft = contentPieces.filter(c => c.status === 'draft');
    const published = contentPieces.filter(c => c.status === 'published');
    const inReview = contentPieces.filter(c => c.status === 'review');

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Content Creator Dashboard</h2>
                    <p className="text-slate-600">Content pipeline and performance</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Content
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Content</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{contentPieces.length}</p>
                            </div>
                            <FileText className="h-10 w-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Draft</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{inDraft.length}</p>
                            </div>
                            <Image className="h-10 w-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Published</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{published.length}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Review</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{inReview.length}</p>
                            </div>
                            <Video className="h-10 w-10 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Content</CardTitle>
                </CardHeader>
                <CardContent>
                    {contentPieces.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No content yet. Create your first piece!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contentPieces.map((content) => (
                                <div key={content.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge className={getStatusColor(content.status)}>{content.status}</Badge>
                                        <Badge variant="outline">{content.type}</Badge>
                                    </div>
                                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{content.title}</h3>
                                    {content.platform && (
                                        <p className="text-sm text-slate-600 mb-2">Platform: {content.platform}</p>
                                    )}
                                    {content.publish_date && (
                                        <p className="text-xs text-slate-500">Publish: {content.publish_date}</p>
                                    )}
                                    {content.tags && content.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {content.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-xs px-2 py-1 bg-white rounded-full border border-slate-200">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}