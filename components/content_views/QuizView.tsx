import React, { useState, useEffect, useMemo } from 'react';
import { User, QuizQuestion, AnswerOption, Content } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { QuizIcon } from '../icons/ResourceTypeIcons';
import { ChevronRightIcon } from '../icons/AdminIcons';
import { Fireworks } from './Fireworks';
import { processContentForHTML } from '../../utils/htmlUtils';

interface QuizViewProps {
    lessonId: string;
    user: User;
}

// --- Components for the Result Screen ---

const StatCard: React.FC<{ label: string; value: number; colorClass: string; bgClass: string }> = ({ label, value, colorClass, bgClass }) => (
    <div className={`${bgClass} p-4 rounded-xl flex flex-col items-center justify-center shadow-sm border border-opacity-10 transition-transform hover:scale-105`}>
        <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
        <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mt-1 tracking-wider">{label}</span>
    </div>
);

const CircularProgress: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32 flex items-center justify-center group">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700 opacity-30" />
                <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out drop-shadow-md" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-white group-hover:scale-110 transition-transform">{Math.round(percentage)}%</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase">Accuracy</span>
            </div>
        </div>
    );
};

const PieChart: React.FC<{ correct: number; wrong: number; skipped: number }> = ({ correct, wrong, skipped }) => {
    const total = correct + wrong + skipped;
    if (total === 0) return null;
    const correctDeg = (correct / total) * 360;
    const wrongDeg = (wrong / total) * 360;
    const gradient = `conic-gradient(#22c55e 0deg ${correctDeg}deg, #ef4444 ${correctDeg}deg ${correctDeg + wrongDeg}deg, #9ca3af ${correctDeg + wrongDeg}deg 360deg)`;

    return (
        <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full shadow-inner border-4 border-white dark:border-gray-800 transition-transform hover:scale-105" style={{ background: gradient }}></div>
            <div className="mt-4 flex gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Correct</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Wrong</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded-full"></div> Skipped</div>
            </div>
        </div>
    );
};

// --- Single Question Card Component (Reused for Quiz and Review) ---

interface QuestionCardProps {
    question: QuizQuestion;
    index: number;
    totalQuestions: number;
    userAnswerIndex: number | null;
    onAnswerSelect: (optionIndex: number) => void;
    readOnly: boolean;
    showRationale: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, totalQuestions, userAnswerIndex, onAnswerSelect, readOnly, showRationale }) => {
    const [showHint, setShowHint] = useState(false);

    const getOptionClass = (optIndex: number, isCorrect: boolean) => {
        const baseClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 relative group ";

        // Logic:
        // 1. If answer selected (userAnswerIndex !== null):
        //    - If this option IS the correct answer -> Green
        //    - If this option IS the user's WRONG selection -> Red
        //    - Otherwise -> Dimmed
        // 2. If no answer selected:
        //    - Standard Hover effects

        if (userAnswerIndex !== null) {
            if (isCorrect) {
                return baseClass + "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-100";
            }
            if (userAnswerIndex === optIndex && !isCorrect) {
                return baseClass + "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-100 opacity-90";
            }
            return baseClass + "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50";
        } else {
            return baseClass + "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700";
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Question {index + 1} <span className="text-gray-300 dark:text-gray-600">/</span> {totalQuestions}
                </span>
                {userAnswerIndex !== null && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${question.answerOptions[userAnswerIndex].isCorrect
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}>
                        {question.answerOptions[userAnswerIndex].isCorrect ? "Correct" : "Incorrect"}
                    </span>
                )}
            </div>

            {/* Question */}
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: processContentForHTML(question.question) }} />

            {/* Options */}
            <div className="space-y-4 mb-6">
                {question.answerOptions.map((option, optIndex) => (
                    <div key={optIndex}>
                        <button
                            onClick={() => !readOnly && userAnswerIndex === null && onAnswerSelect(optIndex)}
                            disabled={readOnly || userAnswerIndex !== null}
                            className={getOptionClass(optIndex, option.isCorrect)}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${userAnswerIndex !== null
                                        ? (option.isCorrect ? "border-green-500 text-green-500" : (userAnswerIndex === optIndex ? "border-red-500 text-red-500" : "border-gray-300 dark:border-gray-600"))
                                        : "border-gray-300 dark:border-gray-600 group-hover:border-blue-500"
                                    }`}>
                                    {userAnswerIndex !== null && option.isCorrect && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                                    {userAnswerIndex === optIndex && !option.isCorrect && <div className="w-3 h-3 rounded-full bg-red-500"></div>}
                                </div>
                                <div className="flex-1" dangerouslySetInnerHTML={{ __html: processContentForHTML(option.text) }} />
                            </div>
                        </button>
                    </div>
                ))}
            </div>

            {/* Rationale (Immediate Feedback) */}
            {showRationale && userAnswerIndex !== null && (
                <div className={`mt-4 p-4 rounded-lg text-sm animate-fade-in ${question.answerOptions[userAnswerIndex].isCorrect
                        ? 'bg-green-50 border border-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300'
                        : 'bg-red-50 border border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300'
                    }`}>
                    <strong className="block mb-2">{question.answerOptions[userAnswerIndex].isCorrect ? "✅ Good job!" : "❌ Not quite right."}</strong>
                    {/* Show explanation from the correct answer, or the selected answer if it has specific feedback */}
                    <div dangerouslySetInnerHTML={{ __html: processContentForHTML(question.answerOptions.find(o => o.isCorrect)?.rationale || "No explanation provided.") }} />
                </div>
            )}

            {/* Hint */}
            <div className="min-h-[2rem]">
                {(userAnswerIndex === null && question.hint) && (
                    <>
                        <button onClick={() => setShowHint(!showHint)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors">
                            <span className="text-lg">💡</span> {showHint ? 'Hide Hint' : 'Show Hint'}
                        </button>
                        {showHint && (
                            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg animate-fade-in">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200" dangerouslySetInnerHTML={{ __html: processContentForHTML(question.hint) }} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// --- Main View ---

export const QuizView: React.FC<QuizViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);
    const { data: groupedContent, isLoading } = useApi(() => api.getContentsByLessonId(lessonId, ['quiz']), [lessonId, version]);

    const [quizzes, setQuizzes] = useState<Content[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Content | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'question' | 'result' | 'review'>('list');

    useEffect(() => {
        const quizList = groupedContent?.[0]?.docs || [];
        setQuizzes(quizList);

        if (quizList.length === 1) {
            selectQuiz(quizList[0]);
        } else {
            setViewMode('list');
            setSelectedQuiz(null);
        }
    }, [groupedContent]);

    const selectQuiz = (quiz: Content) => {
        setSelectedQuiz(quiz);
        if (quiz.body) {
            try {
                const parsedQuestions = JSON.parse(quiz.body.replace(/&quot;/g, '"'));
                setQuestions(parsedQuestions);
                setUserAnswers(new Array(parsedQuestions.length).fill(null));
                setCurrentQuestionIndex(0);
                setViewMode('question');
            } catch (e) {
                console.error("Failed to parse quiz JSON:", e);
                setQuestions([]);
            }
        } else {
            setQuestions([]);
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (userAnswers[currentQuestionIndex] !== null) return; // Prevent changing answer if strict mode is desired

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            setViewMode('result');
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(i => i - 1);
        }
    };

    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(questions.length).fill(null));
        setViewMode('question');
    };

    const handleReview = () => {
        setViewMode('review');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedQuiz(null);
    };

    const stats = useMemo(() => {
        let correct = 0, wrong = 0, skipped = 0;
        userAnswers.forEach((ansIndex, qIndex) => {
            if (ansIndex === null) skipped++;
            else if (questions[qIndex].answerOptions[ansIndex].isCorrect) correct++;
            else wrong++;
        });
        const total = questions.length;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;
        return { correct, wrong, skipped, total, accuracy };
    }, [userAnswers, questions]);

    if (isLoading) return <div className="text-center p-8 text-gray-500">Loading Quiz...</div>;

    if (quizzes.length === 0) {
        return (
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <QuizIcon className="w-8 h-8 mr-3 text-blue-500" />
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Quiz</h1>
                    </div>
                </div>
                <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg shadow-inner">
                    <QuizIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="mt-4 text-gray-500">No quiz available for this chapter.</p>
                </div>
            </div>
        );
    }

    // --- Quiz Selection List ---
    if (viewMode === 'list') {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <QuizIcon className="w-8 h-8 mr-3 text-blue-500" />
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Select a Quiz</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <button
                            key={quiz._id}
                            onClick={() => selectQuiz(quiz)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 text-left group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <QuizIcon className="w-8 h-8" />
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{quiz.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Click to start this quiz.</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Result View ---
    if (viewMode === 'result') {
        const isPassed = stats.accuracy >= 80;
        const accuracyColor = isPassed ? '#22c55e' : (stats.accuracy >= 50 ? '#eab308' : '#ef4444');

        return (
            <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center h-full overflow-y-auto">
                <div className="max-w-4xl w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden animate-fade-in">
                    {isPassed && <Fireworks />}
                    <h2 className="text-3xl font-extrabold mb-2 text-gray-800 dark:text-white">{isPassed ? "🎉 Outstanding Performance!" : "Quiz Completed!"}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Here is the summary of your results.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="flex flex-col items-center justify-center space-y-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                            <div className="flex justify-around w-full items-center">
                                <CircularProgress percentage={stats.accuracy} color={accuracyColor} />
                                <PieChart correct={stats.correct} wrong={stats.wrong} skipped={stats.skipped} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 content-center">
                            <StatCard label="Total" value={stats.total} bgClass="bg-blue-50 dark:bg-blue-900/20" colorClass="text-blue-600 dark:text-blue-400" />
                            <StatCard label="Correct" value={stats.correct} bgClass="bg-green-50 dark:bg-green-900/20" colorClass="text-green-600 dark:text-green-400" />
                            <StatCard label="Wrong" value={stats.wrong} bgClass="bg-red-50 dark:bg-red-900/20" colorClass="text-red-600 dark:text-red-400" />
                            <StatCard label="Skipped" value={stats.skipped} bgClass="bg-gray-100 dark:bg-gray-700/40" colorClass="text-gray-600 dark:text-gray-400" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={handleReview} className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Review Answers</button>
                        <button onClick={handleRetry} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">Try Again</button>
                        {quizzes.length > 1 && (
                            <button onClick={handleBackToList} className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Other Quizzes
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- Review Mode (Scrollable List) ---
    if (viewMode === 'review') {
        return (
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
                <div className="flex justify-between items-center mb-1 shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Review Answers</h1>
                    <button onClick={() => setViewMode('result')} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                        Back to Results
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full pb-10">
                    {questions.map((question, index) => (
                        <QuestionCard
                            key={index}
                            question={question}
                            index={index}
                            totalQuestions={questions.length}
                            userAnswerIndex={userAnswers[index]}
                            onAnswerSelect={() => { }}
                            readOnly={true}
                            showRationale={true}
                        />
                    ))}
                    <div className="flex justify-center mt-8">
                        <button onClick={() => setViewMode('result')} className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600">
                            Back to Summary
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Active Quiz Mode ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-1 shrink-0">
                <div className="flex items-center">
                    {quizzes.length > 1 && (
                        <button onClick={handleBackToList} className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" title="Back to Quiz List">
                            <ChevronRightIcon className="w-5 h-5 transform rotate-180 text-gray-500" />
                        </button>
                    )}
                    <QuizIcon className="w-8 h-8 mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{selectedQuiz?.title || 'Quiz'}</h1>
                </div>
            </div>

            {/* Question Card Container */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <QuestionCard
                        question={questions[currentQuestionIndex]}
                        index={currentQuestionIndex}
                        totalQuestions={questions.length}
                        userAnswerIndex={userAnswers[currentQuestionIndex]}
                        onAnswerSelect={handleAnswerSelect}
                        readOnly={false}
                        showRationale={true} // Always show rationale after answering in strict mode
                    />

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-2 pb-10">
                        <button
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
                        >
                            Previous
                        </button>

                        <button
                            onClick={handleNext}
                            // Allow Next only if answered? Or allow skip? 
                            // If we want immediate feedback loop, usually we force answer. 
                            // But for user friendliness let's allow skip, but visually emphasize 'Next' after answer.
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white font-semibold transition-all shadow-md hover:shadow-lg transform active:scale-95 ${userAnswers[currentQuestionIndex] !== null
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-500 hover:bg-gray-600"
                                }`}
                        >
                            <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};