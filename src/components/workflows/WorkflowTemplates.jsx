import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Bug, Users, Rocket, Target, RefreshCw, UserCheck, Code, TrendingUp, ArrowRight, Zap, Search, Database, Mail, ShoppingCart, MessageSquare, FileSpreadsheet, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TEMPLATES = [
    {
        id: 'market-research',
        name: 'Market Research Report',
        description: 'Comprehensive market analysis with research, data analysis, and professional reporting',
        category: 'research',
        icon: FileText,
        iconColor: 'from-blue-500 to-cyan-500',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'Market Research',
                instructions: 'Conduct thorough market research on the given topic. Include market size, key players, trends, opportunities, and challenges. Use web search for current data.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Data Analysis',
                instructions: 'Analyze the research findings. Identify patterns, trends, competitive landscape, and provide strategic insights. Include SWOT analysis if applicable.'
            },
            {
                agent_role: 'writer',
                step_name: 'Report Generation',
                instructions: 'Create a professional market research report. Include executive summary, methodology, findings, analysis, and recommendations. Format with clear sections and headings.'
            }
        ]
    },
    {
        id: 'social-media-calendar',
        name: 'Social Media Content Calendar',
        description: 'Research-backed content strategy with optimized posts for social media platforms',
        category: 'content_creation',
        icon: Calendar,
        iconColor: 'from-purple-500 to-pink-500',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'Trend Research',
                instructions: 'Research current trends, popular topics, and best-performing content types for the target audience. Identify trending hashtags and optimal posting times.'
            },
            {
                agent_role: 'writer',
                step_name: 'Content Creation',
                instructions: 'Create engaging social media posts based on the research. Include captions, hashtag suggestions, and content variations for different platforms (Instagram, Twitter, LinkedIn, etc.).'
            },
            {
                agent_role: 'analyst',
                step_name: 'Calendar Planning',
                instructions: 'Organize the content into a structured calendar. Suggest optimal posting schedule, content mix strategy, and engagement tactics. Format as a weekly/monthly calendar.'
            }
        ]
    },
    {
        id: 'bug-triage',
        name: 'Bug Triage Analysis',
        description: 'Systematic bug analysis with prioritization, root cause investigation, and action plan',
        category: 'task_automation',
        icon: Bug,
        iconColor: 'from-red-500 to-orange-500',
        steps: [
            {
                agent_role: 'analyst',
                step_name: 'Bug Analysis',
                instructions: 'Analyze the bug report. Assess severity, impact, affected users, and potential business implications. Categorize by type (UI, Backend, Security, etc.).'
            },
            {
                agent_role: 'researcher',
                step_name: 'Investigation',
                instructions: 'Research similar issues, potential root causes, and known solutions. Check documentation, stack traces, and related bug reports.'
            },
            {
                agent_role: 'task_manager',
                step_name: 'Action Plan',
                instructions: 'Create actionable tasks for fixing the bug. Include priority level, estimated effort, required resources, and step-by-step resolution plan. Create tasks in the system.'
            }
        ]
    },
    {
        id: 'customer-onboarding',
        name: 'Customer Onboarding Process',
        description: 'Comprehensive customer onboarding with welcome materials, training, and success tracking',
        category: 'task_automation',
        icon: UserCheck,
        iconColor: 'from-green-500 to-emerald-500',
        steps: [
            {
                agent_role: 'writer',
                step_name: 'Welcome Materials',
                instructions: 'Create personalized welcome email and onboarding guide. Include product overview, quick start guide, and key resources.'
            },
            {
                agent_role: 'task_manager',
                step_name: 'Onboarding Tasks',
                instructions: 'Create a structured onboarding task list with milestones. Include setup steps, training modules, and check-in points.'
            },
            {
                agent_role: 'support_agent',
                step_name: 'Success Tracking',
                instructions: 'Set up success metrics and follow-up schedule. Create check-in tickets and identify potential issues early.'
            }
        ]
    },
    {
        id: 'product-launch',
        name: 'Product Launch Plan',
        description: 'End-to-end product launch planning from strategy to execution and monitoring',
        category: 'content_creation',
        icon: Rocket,
        iconColor: 'from-indigo-500 to-purple-500',
        steps: [
            {
                agent_role: 'product_agent',
                step_name: 'Launch Strategy',
                instructions: 'Define launch objectives, target audience, key features, and success metrics. Create product positioning and messaging.'
            },
            {
                agent_role: 'marketing_agent',
                step_name: 'Marketing Plan',
                instructions: 'Develop comprehensive marketing campaign. Include channels, content calendar, promotional materials, and launch timeline.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Performance Tracking',
                instructions: 'Set up tracking dashboards, KPIs, and monitoring systems. Define success criteria and create reporting structure.'
            }
        ]
    },
    {
        id: 'competitive-analysis',
        name: 'Competitive Analysis',
        description: 'In-depth competitor research with SWOT analysis and strategic recommendations',
        category: 'research',
        icon: Target,
        iconColor: 'from-yellow-500 to-orange-500',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'Competitor Research',
                instructions: 'Research key competitors. Gather data on their products, pricing, market position, strengths, and weaknesses. Use web search for current information.'
            },
            {
                agent_role: 'analyst',
                step_name: 'SWOT Analysis',
                instructions: 'Conduct detailed SWOT analysis for each competitor. Identify opportunities and threats. Compare against our position.'
            },
            {
                agent_role: 'writer',
                step_name: 'Strategic Report',
                instructions: 'Create actionable competitive intelligence report. Include recommendations for differentiation, positioning, and competitive advantages.'
            }
        ]
    },
    {
        id: 'content-repurposing',
        name: 'Content Repurposing Pipeline',
        description: 'Transform existing content across multiple formats and platforms for maximum reach',
        category: 'content_creation',
        icon: RefreshCw,
        iconColor: 'from-teal-500 to-cyan-500',
        steps: [
            {
                agent_role: 'analyst',
                step_name: 'Content Analysis',
                instructions: 'Analyze existing content performance. Identify top-performing pieces suitable for repurposing. Suggest target formats and platforms.'
            },
            {
                agent_role: 'writer',
                step_name: 'Content Adaptation',
                instructions: 'Repurpose content into multiple formats (blog to social posts, video scripts, infographics, email newsletters). Adapt tone and length for each platform.'
            },
            {
                agent_role: 'marketing_agent',
                step_name: 'Distribution Plan',
                instructions: 'Create distribution strategy for repurposed content. Schedule posts across platforms, optimize timing, and plan promotion.'
            }
        ]
    },
    {
        id: 'lead-qualification',
        name: 'Lead Qualification & Nurturing',
        description: 'Automated lead scoring, qualification, and nurturing sequence creation',
        category: 'task_automation',
        icon: Users,
        iconColor: 'from-pink-500 to-rose-500',
        steps: [
            {
                agent_role: 'sales_agent',
                step_name: 'Lead Qualification',
                instructions: 'Score and qualify the lead based on fit, interest, and buying signals. Assess budget, authority, need, and timeline (BANT). Categorize as hot, warm, or cold.'
            },
            {
                agent_role: 'marketing_agent',
                step_name: 'Nurture Campaign',
                instructions: 'Create personalized nurture campaign based on lead qualification. Design email sequence, content offers, and touchpoints.'
            },
            {
                agent_role: 'task_manager',
                step_name: 'Follow-up Tasks',
                instructions: 'Create follow-up task schedule for sales team. Include optimal contact times, talking points, and next steps for each lead stage.'
            }
        ]
    },
    {
        id: 'code-review-deployment',
        name: 'Code Review & Deployment',
        description: 'Systematic code review process with quality checks and deployment planning',
        category: 'task_automation',
        icon: Code,
        iconColor: 'from-slate-500 to-gray-600',
        steps: [
            {
                agent_role: 'analyst',
                step_name: 'Code Analysis',
                instructions: 'Review code for quality, security issues, performance concerns, and best practices. Identify potential bugs and improvement areas.'
            },
            {
                agent_role: 'task_manager',
                step_name: 'Review Checklist',
                instructions: 'Create comprehensive review checklist. Include testing requirements, documentation needs, and deployment steps.'
            },
            {
                agent_role: 'writer',
                step_name: 'Release Notes',
                instructions: 'Generate release notes and deployment documentation. Include changes, fixes, known issues, and rollback procedures.'
            }
        ]
    },
    {
        id: 'employee-onboarding',
        name: 'Employee Onboarding',
        description: 'Complete employee onboarding workflow with training, setup, and integration',
        category: 'task_automation',
        icon: UserCheck,
        iconColor: 'from-blue-500 to-indigo-500',
        steps: [
            {
                agent_role: 'task_manager',
                step_name: 'Onboarding Setup',
                instructions: 'Create onboarding task checklist. Include IT setup, access provisioning, equipment, and administrative tasks. Set up 30-60-90 day milestones.'
            },
            {
                agent_role: 'writer',
                step_name: 'Training Materials',
                instructions: 'Prepare personalized training materials and welcome documentation. Include company culture, role expectations, team introductions, and learning resources.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Integration Plan',
                instructions: 'Create integration and success tracking plan. Define check-in schedule, performance goals, and support resources. Identify potential challenges early.'
            }
        ]
    },
    {
        id: 'data-analysis-pipeline',
        name: 'Data Analysis Pipeline',
        description: 'Comprehensive data collection, cleaning, analysis, and visualization workflow',
        category: 'data_analysis',
        icon: Database,
        iconColor: 'from-violet-500 to-purple-600',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'Data Collection',
                instructions: 'Gather and compile data from specified sources. Document data sources, collection methodology, and initial observations. Ensure data completeness.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Data Processing',
                instructions: 'Clean, normalize, and transform data. Handle missing values, outliers, and inconsistencies. Prepare data for analysis with proper formatting.'
            },
            {
                agent_role: 'data_visualization_agent',
                step_name: 'Analysis & Visualization',
                instructions: 'Perform statistical analysis and create visualizations. Generate insights, identify patterns, correlations, and trends. Create charts and dashboards.'
            },
            {
                agent_role: 'writer',
                step_name: 'Insights Report',
                instructions: 'Compile findings into comprehensive report. Include methodology, visualizations, key insights, and actionable recommendations.'
            }
        ]
    },
    {
        id: 'customer-support-automation',
        name: 'Customer Support Automation',
        description: 'Automated ticket triage, response generation, and escalation workflow',
        category: 'task_automation',
        icon: MessageSquare,
        iconColor: 'from-cyan-500 to-blue-600',
        steps: [
            {
                agent_role: 'support_agent',
                step_name: 'Ticket Triage',
                instructions: 'Analyze incoming support ticket. Categorize issue type, assess urgency, and identify required expertise. Extract key information and context.'
            },
            {
                agent_role: 'researcher',
                step_name: 'Solution Research',
                instructions: 'Search knowledge base, documentation, and previous tickets for relevant solutions. Identify applicable troubleshooting steps and workarounds.'
            },
            {
                agent_role: 'writer',
                step_name: 'Response Generation',
                instructions: 'Draft personalized support response. Include clear explanation, step-by-step solution, relevant links, and follow-up guidance. Maintain professional and empathetic tone.'
            },
            {
                agent_role: 'task_manager',
                step_name: 'Escalation Check',
                instructions: 'Determine if escalation needed. Create escalation ticket if required with detailed context. Otherwise, mark as resolved and schedule follow-up.'
            }
        ]
    },
    {
        id: 'email-campaign',
        name: 'Email Marketing Campaign',
        description: 'Research-driven email campaign creation from strategy to execution',
        category: 'content_creation',
        icon: Mail,
        iconColor: 'from-rose-500 to-pink-600',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'Audience Research',
                instructions: 'Research target audience demographics, preferences, pain points, and email engagement patterns. Analyze competitor campaigns and industry best practices.'
            },
            {
                agent_role: 'marketing_agent',
                step_name: 'Campaign Strategy',
                instructions: 'Define campaign goals, messaging strategy, and call-to-action. Plan email sequence, timing, and segmentation approach.'
            },
            {
                agent_role: 'writer',
                step_name: 'Content Creation',
                instructions: 'Write compelling email copy for each sequence. Include subject lines, preview text, body content, and CTAs. Ensure mobile-friendly formatting.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Performance Planning',
                instructions: 'Set up tracking metrics, A/B test variations, and success criteria. Define monitoring dashboard and optimization strategy.'
            }
        ]
    },
    {
        id: 'ecommerce-product-launch',
        name: 'E-commerce Product Launch',
        description: 'Complete product listing optimization, marketing, and launch coordination',
        category: 'content_creation',
        icon: ShoppingCart,
        iconColor: 'from-amber-500 to-orange-600',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'Market Analysis',
                instructions: 'Research product category, competitors, pricing strategies, and customer reviews. Identify market gaps and positioning opportunities.'
            },
            {
                agent_role: 'writer',
                step_name: 'Product Content',
                instructions: 'Create compelling product descriptions, bullet points, and SEO-optimized content. Write engaging title and highlight key features and benefits.'
            },
            {
                agent_role: 'marketing_agent',
                step_name: 'Launch Campaign',
                instructions: 'Develop multi-channel launch campaign. Plan promotional strategy, social media announcements, email campaigns, and influencer outreach.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Performance Tracking',
                instructions: 'Set up analytics tracking, conversion monitoring, and KPI dashboards. Define success metrics and optimization triggers.'
            }
        ]
    },
    {
        id: 'seo-content-optimization',
        name: 'SEO Content Optimization',
        description: 'Keyword research, content audit, optimization, and performance tracking',
        category: 'content_creation',
        icon: TrendingUp,
        iconColor: 'from-green-500 to-teal-600',
        steps: [
            {
                agent_role: 'researcher',
                step_name: 'SEO Research',
                instructions: 'Conduct keyword research, analyze search intent, and identify ranking opportunities. Review competitor content and backlink strategies.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Content Audit',
                instructions: 'Audit existing content for SEO performance. Identify gaps, outdated information, and optimization opportunities. Prioritize pages for improvement.'
            },
            {
                agent_role: 'writer',
                step_name: 'Content Optimization',
                instructions: 'Optimize content with target keywords, improve readability, add internal links, and enhance meta descriptions. Ensure proper heading structure.'
            },
            {
                agent_role: 'data_visualization_agent',
                step_name: 'Performance Monitoring',
                instructions: 'Track rankings, organic traffic, and engagement metrics. Create dashboards showing progress and ROI. Identify next optimization targets.'
            }
        ]
    },
    {
        id: 'financial-report-analysis',
        name: 'Financial Report Analysis',
        description: 'Automated financial data analysis, trend identification, and reporting',
        category: 'data_analysis',
        icon: FileSpreadsheet,
        iconColor: 'from-emerald-500 to-green-600',
        steps: [
            {
                agent_role: 'analyst',
                step_name: 'Data Extraction',
                instructions: 'Extract financial data from reports, statements, and databases. Verify data accuracy and completeness. Organize into structured format.'
            },
            {
                agent_role: 'analyst',
                step_name: 'Financial Analysis',
                instructions: 'Calculate key financial ratios, metrics, and trends. Perform variance analysis, identify anomalies, and assess financial health.'
            },
            {
                agent_role: 'data_visualization_agent',
                step_name: 'Visualization',
                instructions: 'Create financial dashboards, charts, and trend graphs. Visualize revenue, expenses, profitability, and cash flow patterns.'
            },
            {
                agent_role: 'writer',
                step_name: 'Executive Summary',
                instructions: 'Prepare executive summary with key findings, insights, and recommendations. Highlight critical trends and action items for stakeholders.'
            }
        ]
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Templates', count: TEMPLATES.length },
    { id: 'research', label: 'Research', count: TEMPLATES.filter(t => t.category === 'research').length },
    { id: 'content_creation', label: 'Content Creation', count: TEMPLATES.filter(t => t.category === 'content_creation').length },
    { id: 'task_automation', label: 'Automation', count: TEMPLATES.filter(t => t.category === 'task_automation').length },
    { id: 'data_analysis', label: 'Data Analysis', count: TEMPLATES.filter(t => t.category === 'data_analysis').length }
];

export default function WorkflowTemplates({ agents, onUseTemplate }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const getAgentOptions = (role) => {
        const roleMap = {
            researcher: ['researcher'],
            analyst: ['analyst'],
            writer: ['writer'],
            task_manager: ['task_manager'],
            support_agent: ['support_agent'],
            sales_agent: ['sales_agent'],
            marketing_agent: ['marketing_agent'],
            product_agent: ['product_agent'],
            data_visualization_agent: ['data_visualization', 'visualization']
        };
        
        const suggestedTypes = roleMap[role] || [];
        return agents.filter(a => 
            suggestedTypes.some(type => a.name.toLowerCase().includes(type))
        );
    };

    const canUseTemplate = (template) => {
        return template.steps.every(step => 
            getAgentOptions(step.agent_role).length > 0
        );
    };

    const filteredTemplates = TEMPLATES.filter(template => {
        const matchesSearch = 
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = 
            selectedCategory === 'all' || 
            template.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Workflow Template Library</h2>
                <p className="text-slate-600">Browse pre-built workflows for common use cases and import them instantly</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-10 bg-white"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="bg-white">
                    {CATEGORIES.map(category => (
                        <TabsTrigger key={category.id} value={category.id} className="gap-2">
                            {category.label}
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                {category.count}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Results Count */}
            <div className="text-sm text-slate-600">
                Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </div>

            {/* Template Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No templates found matching your criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => {
                        const Icon = template.icon;
                        const available = canUseTemplate(template);
                        
                        return (
                            <Card 
                                key={template.id}
                                className={cn(
                                    "hover:shadow-lg transition-all",
                                    !available && "opacity-60"
                                )}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn(
                                            "h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                            template.iconColor
                                        )}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                                                {template.steps.length} steps
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription className="text-sm">
                                        {template.description}
                                    </CardDescription>
                                </CardHeader>
                                
                                <CardContent>
                                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                            Pipeline
                                        </p>
                                        <div className="space-y-2">
                                            {template.steps.map((step, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs">
                                                    <div className="h-6 w-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-slate-600 font-medium flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-slate-700 flex-1 truncate">
                                                        {step.step_name}
                                                    </span>
                                                    {index < template.steps.length - 1 && (
                                                        <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setPreviewTemplate(template)}
                                            className="flex-1"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview
                                        </Button>
                                        <Button
                                            onClick={() => onUseTemplate(template)}
                                            disabled={!available}
                                            className={cn(
                                                "flex-1",
                                                available 
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                    : "bg-slate-300"
                                            )}
                                        >
                                            <Zap className="h-4 w-4 mr-2" />
                                            Use
                                        </Button>
                                    </div>
                                    
                                    {!available && (
                                        <p className="text-xs text-slate-500 mt-2 text-center">
                                            Missing required agents
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {previewTemplate && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "h-14 w-14 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                                        previewTemplate.iconColor
                                    )}>
                                        <previewTemplate.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl">{previewTemplate.name}</DialogTitle>
                                        <p className="text-slate-600 mt-1">{previewTemplate.description}</p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-3">Workflow Steps</h3>
                                    <div className="space-y-4">
                                        {previewTemplate.steps.map((step, index) => (
                                            <div key={index}>
                                                <Card className="p-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-800">{step.step_name}</p>
                                                            <p className="text-sm text-slate-600 mt-1">{step.instructions}</p>
                                                            <p className="text-xs text-slate-500 mt-2">
                                                                Suggested agent role: <span className="font-medium">{step.agent_role}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                                {index < previewTemplate.steps.length - 1 && (
                                                    <div className="flex justify-center py-2">
                                                        <ArrowRight className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            onUseTemplate(previewTemplate);
                                            setPreviewTemplate(null);
                                        }}
                                        disabled={!canUseTemplate(previewTemplate)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        <Zap className="h-4 w-4 mr-2" />
                                        Use This Template
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export { TEMPLATES };