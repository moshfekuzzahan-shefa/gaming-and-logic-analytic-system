import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, ArrowRight, Home } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Which of the following is the correct syntax to print a message in C++?",
    options: ["System.out.println()", "console.log()", "cout <<", "print()"],
    correct_answer: "cout <<"
  },
  {
    id: 2,
    text: "What symbol is used to denote a single-line comment in C++?",
    options: ["//", "/*", "#", "--"],
    correct_answer: "//"
  },
  {
    id: 3,
    text: "Which data type is used to store text?",
    options: ["int", "String", "string", "float"],
    correct_answer: "string"
  },
  {
    id: 4,
    text: "How do you create a variable with the numeric value 5?",
    options: ["num x = 5;", "int x = 5;", "x = 5;", "val x = 5;"],
    correct_answer: "int x = 5;"
  },
  {
    id: 5,
    text: "Which operator is used to compare two values for equality in C++?",
    options: ["=", "==", "===", "!="],
    correct_answer: "=="
  }
];

export default function Quiz() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/categories/${categoryId}/questions`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setQuestions(data);
          } else {
            setQuestions(MOCK_QUESTIONS);
          }
        } else {
          setQuestions(MOCK_QUESTIONS);
        }
      } catch (err) {
        console.warn('Backend not reachable. Using mock data.');
        setQuestions(MOCK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [categoryId]);

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-primary-400">Loading Quiz...</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center py-20 text-gray-400">No questions available for this category.</div>;
  }

  const currentQuestion = questions[currentIndex];

  const handleOptionClick = (option: string) => {
    if (isAnswering) return;
    
    setSelectedOption(option);
    setIsAnswering(true);

    if (option === currentQuestion.correct_answer) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswering(false);
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGoodScore = percentage >= 60;
    
    return (
      <div className="max-w-2xl mx-auto py-12 animate-fade-in">
        <div className="glass-card p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl ${isGoodScore ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <Trophy size={48} />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-gray-300 text-lg mb-8">You scored <span className="text-primary-400 font-bold text-2xl">{score}</span> out of {questions.length}</p>
            
            <div className="w-full bg-dark-900 rounded-full h-4 mb-10 overflow-hidden border border-white/5">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${isGoodScore ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg"
            >
              <Home size={20} />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2 border border-white/5">
          <div 
            className="bg-accent-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card p-8 md:p-10 shadow-[0_0_30px_rgba(106,13,173,0.15)] relative">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 leading-relaxed">
          {currentQuestion.text}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = "bg-dark-800 border-white/10 hover:border-primary-400/50 hover:bg-dark-700 text-gray-200";
            let icon = null;

            if (selectedOption !== null) {
              // Reveal correct and incorrect answers after clicking
              if (option === currentQuestion.correct_answer) {
                buttonClass = "bg-green-500/20 border-green-500/50 text-green-300";
                icon = <CheckCircle size={20} />;
              } else if (option === selectedOption) {
                buttonClass = "bg-red-500/20 border-red-500/50 text-red-300";
                icon = <XCircle size={20} />;
              } else {
                buttonClass = "bg-dark-900 border-white/5 text-gray-600 opacity-50"; // Dim others
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswering}
                className={`relative overflow-hidden text-left p-5 rounded-xl border-2 transition-all duration-300 flex justify-between items-center ${buttonClass}`}
              >
                <span className="font-medium text-lg">{option}</span>
                {icon}
              </button>
            );
          })}
        </div>
        
        {/* Next Indication */}
        {selectedOption !== null && (
           <div className="absolute bottom-4 right-8 flex items-center gap-2 text-accent-400 animate-pulse">
              <span className="text-sm font-medium">Next</span>
              <ArrowRight size={16} />
           </div>
        )}
      </div>
    </div>
  );
}
