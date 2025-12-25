import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Bug, Users, Rocket, Target, RefreshCw, UserCheck, Code, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

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
    }
];

export default function WorkflowTemplates({ agents, onUseTemplate }) {
    const getAgentOptions = (role) => {
        const roleMap = {
            researcher: ['researcher'],
            analyst: ['analyst'],
            writer: ['writer'],
            task_manager: ['task_manager'],
            support_agent: ['support_agent'],
            sales_agent: ['sales_agent'],
            marketing_agent: ['marketing_agent'],
            product_agent: ['product_agent']
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Workflow Templates</h2>
                <p className="text-slate-600">Get started quickly with pre-built workflows for common use cases</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEMPLATES.map((template) => {
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
                                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                                        {template.steps.length} steps
                                    </Badge>
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
                                                <span className="text-slate-700 flex-1">
                                                    {step.step_name}
                                                </span>
                                                {index < template.steps.length - 1 && (
                                                    <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => onUseTemplate(template)}
                                    disabled={!available}
                                    className={cn(
                                        "w-full",
                                        available 
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                            : "bg-slate-300"
                                    )}
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    {available ? 'Use Template' : 'Missing Required Agents'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export { TEMPLATES };