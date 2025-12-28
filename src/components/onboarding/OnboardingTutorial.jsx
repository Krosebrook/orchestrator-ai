import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Sparkles, Bot, Workflow, Rocket, ArrowRight, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to AI Agent Platform',
        description: 'Let\'s get you started with a quick tour',
        icon: Sparkles,
        content: (
            <div className="space-y-4">
                <p className="text-slate-600">
                    This platform helps you orchestrate AI agents to automate complex workflows. 
                    In this tutorial, you'll learn how to:
                </p>
                <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Explore and interact with pre-configured agents</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Create your first workflow using templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Execute and monitor workflow results</span>
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'agents',
        title: 'Meet Your AI Agents',
        description: 'Agents are specialized AI assistants that can perform specific tasks',
        icon: Bot,
        content: (
            <div className="space-y-4">
                <p className="text-slate-600">
                    Each agent has unique capabilities and can access different tools:
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <Card className="border-2 border-blue-200">
                        <CardContent className="pt-4">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-semibold text-sm">Researcher</p>
                            <p className="text-xs text-slate-600 mt-1">Web search & data gathering</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-purple-200">
                        <CardContent className="pt-4">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-2">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-semibold text-sm">Writer</p>
                            <p className="text-xs text-slate-600 mt-1">Content creation & editing</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-green-200">
                        <CardContent className="pt-4">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mb-2">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-semibold text-sm">Analyst</p>
                            <p className="text-xs text-slate-600 mt-1">Data analysis & insights</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-orange-200">
                        <CardContent className="pt-4">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-2">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-semibold text-sm">Task Manager</p>
                            <p className="text-xs text-slate-600 mt-1">Task automation</p>
                        </CardContent>
                    </Card>
                </div>
                <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                    💡 <strong>Tip:</strong> Visit the Agents page to chat with any agent directly and see what they can do!
                </p>
            </div>
        ),
        action: {
            label: 'Go to Agents',
            url: '/Agents'
        }
    },
    {
        id: 'workflows',
        title: 'Create Multi-Agent Workflows',
        description: 'Chain agents together to solve complex problems',
        icon: Workflow,
        content: (
            <div className="space-y-4">
                <p className="text-slate-600">
                    Workflows let you orchestrate multiple agents in sequence or parallel to accomplish complex tasks.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                    <p className="font-semibold text-sm mb-3">Example: Market Research Workflow</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">Researcher gathers market data</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">Analyst processes findings</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">Writer creates final report</span>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-slate-600 bg-purple-50 p-3 rounded-lg">
                    💡 <strong>Tip:</strong> Start with a template to see how workflows are structured, then customize!
                </p>
            </div>
        ),
        action: {
            label: 'Browse Templates',
            url: '/Workflows'
        }
    },
    {
        id: 'complete',
        title: 'You\'re All Set!',
        description: 'Start building amazing AI-powered workflows',
        icon: Rocket,
        content: (
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200 text-center">
                    <Rocket className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-800 mb-2">Ready to Launch!</p>
                    <p className="text-slate-600">
                        You now know the basics. Explore the platform and create your first workflow.
                    </p>
                </div>
                <div className="space-y-2">
                    <p className="font-semibold text-sm text-slate-700">Quick Links:</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/Agents'}>
                            <Bot className="h-4 w-4 mr-2" />
                            Agents
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/Workflows'}>
                            <Workflow className="h-4 w-4 mr-2" />
                            Workflows
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
];

export default function OnboardingTutorial({ open, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Set());

    const step = ONBOARDING_STEPS[currentStep];
    const Icon = step.icon;
    const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

    const handleNext = async () => {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Mark onboarding as complete
            try {
                const user = await base44.auth.me();
                await base44.auth.updateMe({ onboarding_completed: true });
                toast.success('Tutorial completed! 🎉');
            } catch (error) {
                console.error('Failed to update onboarding status:', error);
            }
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = async () => {
        try {
            const user = await base44.auth.me();
            await base44.auth.updateMe({ onboarding_completed: true });
        } catch (error) {
            console.error('Failed to update onboarding status:', error);
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                "from-blue-500 to-purple-600"
                            )}>
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle>{step.title}</DialogTitle>
                                <p className="text-sm text-slate-600">{step.description}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleSkip}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                        <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Content */}
                <div className="py-4">
                    {step.content}
                </div>

                {/* Footer */}
                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleSkip}>
                            Skip Tutorial
                        </Button>
                        {step.action ? (
                            <Button 
                                onClick={() => {
                                    window.location.href = step.action.url;
                                    handleNext();
                                }}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                {step.action.label}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleNext}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}