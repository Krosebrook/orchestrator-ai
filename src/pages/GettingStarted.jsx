import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    BookOpen, Video, FileText, Sparkles, Bot, Workflow, 
    Database, Zap, CheckCircle, PlayCircle, Clock, ArrowRight 
} from 'lucide-react';
import { cn } from "@/lib/utils";
import OnboardingTutorial from '../components/onboarding/OnboardingTutorial';

const DOCUMENTATION_SECTIONS = [
    {
        id: 'basics',
        title: 'Getting Started Basics',
        icon: BookOpen,
        articles: [
            { title: 'Platform Overview', time: '5 min', description: 'Learn what the AI Agent Platform can do' },
            { title: 'Understanding Agents', time: '8 min', description: 'How agents work and what they can accomplish' },
            { title: 'Your First Workflow', time: '10 min', description: 'Create and run your first multi-agent workflow' },
            { title: 'Dashboard Navigation', time: '5 min', description: 'Navigating the platform interface' }
        ]
    },
    {
        id: 'agents',
        title: 'Working with Agents',
        icon: Bot,
        articles: [
            { title: 'Agent Capabilities', time: '7 min', description: 'Understanding what each agent can do' },
            { title: 'Chatting with Agents', time: '6 min', description: 'Direct conversation with AI agents' },
            { title: 'Agent Tools & Permissions', time: '8 min', description: 'Entity operations and function tools' },
            { title: 'Agent Version Management', time: '5 min', description: 'Managing agent configurations over time' }
        ]
    },
    {
        id: 'workflows',
        title: 'Building Workflows',
        icon: Workflow,
        articles: [
            { title: 'Workflow Templates', time: '6 min', description: 'Using pre-built workflow templates' },
            { title: 'Visual Workflow Builder', time: '12 min', description: 'Creating custom workflows visually' },
            { title: 'Conditional Logic', time: '10 min', description: 'Adding branching and conditions' },
            { title: 'Error Handling', time: '8 min', description: 'Managing failures and retries' }
        ]
    },
    {
        id: 'advanced',
        title: 'Advanced Features',
        icon: Zap,
        articles: [
            { title: 'Entity CRUD Operations', time: '10 min', description: 'Creating, reading, updating, and deleting data' },
            { title: 'API Integrations', time: '12 min', description: 'Connecting external services' },
            { title: 'Deployment & Environments', time: '9 min', description: 'Managing dev, staging, and production' },
            { title: 'Monitoring & Analytics', time: '7 min', description: 'Tracking workflow performance' }
        ]
    }
];

const VIDEO_GUIDES = [
    {
        title: 'Platform Introduction',
        duration: '3:45',
        thumbnail: 'from-blue-500 to-purple-600',
        description: 'A quick tour of the AI Agent Platform',
        url: '#'
    },
    {
        title: 'Creating Your First Workflow',
        duration: '8:20',
        thumbnail: 'from-purple-500 to-pink-600',
        description: 'Step-by-step workflow creation tutorial',
        url: '#'
    },
    {
        title: 'Agent Capabilities Deep Dive',
        duration: '6:15',
        thumbnail: 'from-green-500 to-teal-600',
        description: 'Understanding agent tools and permissions',
        url: '#'
    },
    {
        title: 'Template Library Overview',
        duration: '5:30',
        thumbnail: 'from-orange-500 to-red-600',
        description: 'Exploring pre-built workflow templates',
        url: '#'
    }
];

const QUICK_START_GUIDES = [
    {
        title: 'Talk to an Agent',
        description: 'Have a conversation with an AI agent',
        icon: Bot,
        steps: ['Go to Agents page', 'Select an agent', 'Start chatting'],
        action: { label: 'Try Now', url: '/Agents' }
    },
    {
        title: 'Run a Template',
        description: 'Execute a pre-built workflow',
        icon: Workflow,
        steps: ['Go to Workflows', 'Browse templates', 'Configure & run'],
        action: { label: 'Browse Templates', url: '/Workflows' }
    },
    {
        title: 'Query Your Data',
        description: 'Ask questions in natural language',
        icon: Database,
        steps: ['Go to Dashboard', 'Use query interface', 'Ask anything'],
        action: { label: 'Go to Dashboard', url: '/Dashboard' }
    }
];

export default function GettingStartedPage() {
    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Getting Started
                        </h1>
                        <p className="text-slate-600 mt-1">Everything you need to master the AI Agent Platform</p>
                    </div>
                    <Button 
                        onClick={() => setShowTutorial(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Interactive Tutorial
                    </Button>
                </div>

                {/* Quick Start Guides */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Start Guides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {QUICK_START_GUIDES.map((guide, index) => {
                            const Icon = guide.icon;
                            return (
                                <Card key={index} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <Icon className="h-5 w-5 text-white" />
                                            </div>
                                            <Badge className="bg-green-100 text-green-700">
                                                <Clock className="h-3 w-3 mr-1" />
                                                5 min
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg mt-3">{guide.title}</CardTitle>
                                        <CardDescription>{guide.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 mb-4">
                                            {guide.steps.map((step, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="w-full"
                                            onClick={() => window.location.href = guide.action.url}
                                        >
                                            {guide.action.label}
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Tabbed Content */}
                <Tabs defaultValue="docs" className="space-y-6">
                    <TabsList className="bg-white">
                        <TabsTrigger value="docs">
                            <FileText className="h-4 w-4 mr-2" />
                            Documentation
                        </TabsTrigger>
                        <TabsTrigger value="videos">
                            <Video className="h-4 w-4 mr-2" />
                            Video Guides
                        </TabsTrigger>
                    </TabsList>

                    {/* Documentation Tab */}
                    <TabsContent value="docs" className="space-y-6">
                        {DOCUMENTATION_SECTIONS.map((section) => {
                            const Icon = section.icon;
                            return (
                                <Card key={section.id}>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-5 w-5 text-blue-600" />
                                            <CardTitle>{section.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {section.articles.map((article, idx) => (
                                                <button
                                                    key={idx}
                                                    className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all text-left group"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-400 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="h-4 w-4 text-slate-600 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-semibold text-sm text-slate-800">{article.title}</p>
                                                            <Badge variant="outline" className="text-xs">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {article.time}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-slate-600">{article.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    {/* Video Guides Tab */}
                    <TabsContent value="videos" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {VIDEO_GUIDES.map((video, index) => (
                                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardContent className="pt-6">
                                        <div className={cn(
                                            "aspect-video rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
                                            video.thumbnail
                                        )}>
                                            <PlayCircle className="h-16 w-16 text-white" />
                                        </div>
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-slate-800">{video.title}</h3>
                                            <Badge className="bg-slate-100 text-slate-700">{video.duration}</Badge>
                                        </div>
                                        <p className="text-sm text-slate-600">{video.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Help Resources */}
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">Need More Help?</h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    Our support team is here to help you succeed with the platform.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        Contact Support
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        Join Community
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Onboarding Tutorial */}
            <OnboardingTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
        </div>
    );
}