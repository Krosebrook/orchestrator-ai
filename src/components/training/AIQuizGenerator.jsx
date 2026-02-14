import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIQuizGenerator({ skills }) {
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    const generateQuiz = async () => {
        if (!selectedSkill) return;

        setGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a comprehensive quiz for the skill: ${selectedSkill.skill_name}

Skill Details:
- Category: ${selectedSkill.skill_category}
- Current Proficiency: ${selectedSkill.proficiency_level}%
- Certification: ${selectedSkill.certification_level}

Create 10 challenging questions that:
1. Test practical understanding (not just theory)
2. Range from ${selectedSkill.certification_level} to the next level
3. Include scenario-based questions
4. Cover different aspects of the skill

For each question provide:
- Clear question text
- 4 multiple choice options
- Correct answer (letter A-D)
- Brief explanation of why it's correct`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        quiz_title: { type: "string" },
                        difficulty: { type: "string" },
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question: { type: "string" },
                                    options: {
                                        type: "object",
                                        properties: {
                                            A: { type: "string" },
                                            B: { type: "string" },
                                            C: { type: "string" },
                                            D: { type: "string" }
                                        }
                                    },
                                    correct_answer: { type: "string" },
                                    explanation: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setQuiz(result);
            setAnswers({});
            setShowResults(false);
            toast.success('Quiz generated!');
        } catch (error) {
            console.error('Failed to generate quiz:', error);
            toast.error('Failed to generate quiz');
        } finally {
            setGenerating(false);
        }
    };

    const submitQuiz = () => {
        setShowResults(true);
        const correct = Object.entries(answers).filter(([idx, ans]) => 
            ans === quiz.questions[parseInt(idx)].correct_answer
        ).length;
        
        toast.success(`Score: ${correct}/${quiz.questions.length}`);
    };

    const uniqueSkills = Array.from(
        new Map(skills.map(s => [`${s.skill_name}-${s.skill_category}`, s])).values()
    );

    return (
        <div className="space-y-6">
            <Card className="border-2 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        AI Quiz Generator
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={selectedSkill?.id} onValueChange={(id) => {
                        const skill = skills.find(s => s.id === id);
                        setSelectedSkill(skill);
                        setQuiz(null);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select skill to quiz" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueSkills.map(skill => (
                                <SelectItem key={skill.id} value={skill.id}>
                                    {skill.skill_name} ({skill.skill_category})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button 
                        onClick={generateQuiz}
                        disabled={!selectedSkill || generating}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Quiz...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Quiz
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {quiz && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{quiz.quiz_title}</CardTitle>
                            <Badge>{quiz.difficulty}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {quiz.questions.map((q, idx) => (
                            <div key={idx} className="border-b pb-4 last:border-b-0">
                                <p className="font-semibold mb-3">
                                    {idx + 1}. {q.question}
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(q.options).map(([letter, text]) => (
                                        <button
                                            key={letter}
                                            onClick={() => !showResults && setAnswers({...answers, [idx]: letter})}
                                            disabled={showResults}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                showResults
                                                    ? letter === q.correct_answer
                                                        ? 'border-green-500 bg-green-50'
                                                        : answers[idx] === letter
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-slate-200'
                                                    : answers[idx] === letter
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{letter}.</span>
                                                <span>{text}</span>
                                                {showResults && letter === q.correct_answer && (
                                                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                                )}
                                                {showResults && answers[idx] === letter && letter !== q.correct_answer && (
                                                    <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {showResults && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-slate-700">
                                            <span className="font-semibold">Explanation:</span> {q.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {!showResults && (
                            <Button 
                                onClick={submitQuiz}
                                disabled={Object.keys(answers).length !== quiz.questions.length}
                                className="w-full"
                            >
                                Submit Quiz
                            </Button>
                        )}

                        {showResults && (
                            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                <p className="text-3xl font-bold text-blue-600 mb-2">
                                    {Object.entries(answers).filter(([idx, ans]) => 
                                        ans === quiz.questions[parseInt(idx)].correct_answer
                                    ).length} / {quiz.questions.length}
                                </p>
                                <p className="text-slate-600">Correct Answers</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}