import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Sparkles, 
    Workflow, 
    Zap, 
    Brain, 
    CheckCircle, 
    ArrowRight, 
    Users, 
    TrendingUp,
    Shield,
    Clock,
    Target,
    BarChart3,
    MessageSquare,
    Play
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const [email, setEmail] = useState('');

    const features = [
        {
            icon: Workflow,
            title: "Multi-Agent Workflows",
            description: "Chain multiple AI agents together for complex task automation with seamless handoffs and parallel processing."
        },
        {
            icon: Brain,
            title: "10+ Specialized Agents",
            description: "Pre-built agents for research, writing, analysis, task management, sales, marketing, and more."
        },
        {
            icon: Users,
            title: "Persona-Based Dashboards",
            description: "Role-specific views for executives, managers, developers, analysts, and all team members."
        },
        {
            icon: Zap,
            title: "Instant Workflow Templates",
            description: "Start fast with 10+ ready-to-use workflow templates for common business processes."
        },
        {
            icon: Shield,
            title: "Enterprise-Grade Security",
            description: "Advanced authentication, role-based access control, and comprehensive audit trails."
        },
        {
            icon: BarChart3,
            title: "Real-Time Analytics",
            description: "Monitor workflow performance, track KPIs, and get actionable insights across your organization."
        }
    ];

    const useCases = [
        {
            title: "Market Research Reports",
            description: "Automated research, data analysis, and professional report generation in minutes.",
            steps: ["Research → Analyze → Report"],
            color: "from-blue-500 to-cyan-500"
        },
        {
            title: "Content Creation Pipeline",
            description: "Generate, optimize, and schedule content across multiple platforms effortlessly.",
            steps: ["Research → Create → Distribute"],
            color: "from-purple-500 to-pink-500"
        },
        {
            title: "Customer Support Automation",
            description: "Intelligent ticket triage, response generation, and resolution tracking.",
            steps: ["Analyze → Respond → Track"],
            color: "from-green-500 to-emerald-500"
        },
        {
            title: "Lead Qualification",
            description: "Score leads, create nurture campaigns, and automate follow-ups.",
            steps: ["Qualify → Nurture → Convert"],
            color: "from-orange-500 to-red-500"
        }
    ];

    const stats = [
        { value: "10+", label: "AI Agents", icon: Brain },
        { value: "50+", label: "Workflow Templates", icon: Workflow },
        { value: "10", label: "Persona Dashboards", icon: Users },
        { value: "99.9%", label: "Uptime", icon: TrendingUp }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                
                <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
                    <div className="text-center space-y-8">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
                            <Sparkles className="h-4 w-4 mr-2 inline" />
                            AI Agent Orchestration Platform
                        </Badge>
                        
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-purple-900 bg-clip-text text-transparent">
                                Automate Complex Tasks
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                with Multi-Agent AI
                            </span>
                        </h1>
                        
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            Chain specialized AI agents into powerful workflows. Automate research, content creation, 
                            data analysis, and business processes with enterprise-grade reliability.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to={createPageUrl('Agents')}>
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                                    <Play className="h-5 w-5 mr-2" />
                                    Get Started Free
                                </Button>
                            </Link>
                            <Link to={createPageUrl('Workflows')}>
                                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                                    <Workflow className="h-5 w-5 mr-2" />
                                    Explore Workflows
                                </Button>
                            </Link>
                        </div>
                        
                        <div className="flex items-center justify-center gap-8 pt-8 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Setup in 5 minutes
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Cancel anytime
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="border-2 hover:shadow-lg transition-all">
                                <CardContent className="pt-6 text-center">
                                    <Icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {stat.value}
                                    </p>
                                    <p className="text-slate-600 mt-2">{stat.label}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Everything You Need to Orchestrate AI Agents
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Built for teams that want to leverage AI without the complexity
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={index} className="border-2 hover:shadow-xl hover:scale-105 transition-all">
                                <CardContent className="pt-6">
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Proven Workflow Templates
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Start with battle-tested workflows used by leading teams
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {useCases.map((useCase, index) => (
                            <Card key={index} className="border-2 hover:shadow-xl transition-all overflow-hidden">
                                <div className={`h-2 bg-gradient-to-r ${useCase.color}`} />
                                <CardContent className="pt-6">
                                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-slate-600 mb-4">
                                        {useCase.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm">
                                        {useCase.steps.map((step, idx) => (
                                            <Badge key={idx} variant="outline" className="font-normal">
                                                {step}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        How It Works
                    </h2>
                    <p className="text-xl text-slate-600">
                        Get started in three simple steps
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            step: "1",
                            title: "Choose Your Agents",
                            description: "Select from 10+ specialized AI agents or create custom ones for your needs",
                            icon: Brain
                        },
                        {
                            step: "2",
                            title: "Build Workflows",
                            description: "Chain agents together with simple drag-and-drop or use ready-made templates",
                            icon: Workflow
                        },
                        {
                            step: "3",
                            title: "Automate & Scale",
                            description: "Run workflows on-demand or schedule them. Monitor results in real-time dashboards",
                            icon: TrendingUp
                        }
                    ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="relative">
                                <div className="text-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-600">
                                        {item.description}
                                    </p>
                                </div>
                                {index < 2 && (
                                    <ArrowRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-blue-300" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Ready to Transform Your Workflows?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join teams already automating complex tasks with AI agents
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to={createPageUrl('Agents')}>
                            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6">
                                Start Free Today
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Dashboard')}>
                            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                                View Demo Dashboard
                            </Button>
                        </Link>
                    </div>
                    <p className="text-blue-100 mt-6 text-sm">
                        No credit card required • Setup in 5 minutes • Cancel anytime
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Frequently Asked Questions
                    </h2>
                </div>
                
                <div className="space-y-6">
                    {[
                        {
                            q: "What are AI agents and workflows?",
                            a: "AI agents are specialized AI assistants that excel at specific tasks (research, writing, analysis, etc.). Workflows chain multiple agents together to automate complex multi-step processes."
                        },
                        {
                            q: "How quickly can I get started?",
                            a: "Most users are up and running in under 5 minutes. Choose a pre-built workflow template, customize it to your needs, and start automating immediately."
                        },
                        {
                            q: "What integrations are supported?",
                            a: "We support integrations with Google Workspace, Slack, Notion, Salesforce, HubSpot, and many more. You can also create custom integrations using our API connector."
                        },
                        {
                            q: "Is my data secure?",
                            a: "Yes. We use enterprise-grade encryption, role-based access control, and maintain comprehensive audit trails. All data is isolated and protected."
                        },
                        {
                            q: "Can I customize the agents and workflows?",
                            a: "Absolutely. You can customize existing agents, create new ones, and build completely custom workflows to match your specific business processes."
                        }
                    ].map((faq, index) => (
                        <Card key={index} className="border-2">
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-slate-600">
                                    {faq.a}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}