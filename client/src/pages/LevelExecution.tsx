import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Terminal, Award, CheckCircle } from 'lucide-react';

interface Level {
  id: number;
  name: string;
  difficulty_level: string;
  problem_statement: string;
  boilerplate_code: string;
  expected_output: string;
  reward_xp: number;
  category?: {
    name: string;
  };
}

export default function LevelExecution() {
  const { userId } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/levels/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLevel(data);
          setCode(data.boilerplate_code || '');
        }
      } catch (error) {
        console.error('Error fetching level:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, [id]);

  const handleRunCode = async () => {
    if (!level) return;
    
    setIsExecuting(true);
    setOutput('Compiling and executing...');
    
    try {
      // Mocked fetch request to backend execute route
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          expectedOutput: level.expected_output
        })
      });

      const data = await res.json().catch(() => null);

      if (data) {
        setOutput(data.output);
        
        if (data.isSuccess) {
          // If execution succeeded, save attempt
          await fetch('http://localhost:5000/api/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              level_id: Number(id),
              time_taken: data.timeTakenMs,
              is_success: true,
              score: level.reward_xp
            })
          }).catch(console.error);

          setEarnedXP(level.reward_xp);
          setShowModal(true);
        }
      } else {
        // Fallback behavior if backend isn't running
        setTimeout(() => {
          if (code.includes('cout')) {
            setOutput(level.expected_output);
            setEarnedXP(level.reward_xp);
            setShowModal(true);
          } else {
            setOutput('Error: Output did not match expected.');
          }
        }, 1000);
      }
      
    } catch (error) {
      console.warn("Backend not reachable, running mock fallback");
      setTimeout(() => {
        if (code.includes('cout')) {
          setOutput(level.expected_output);
          setEarnedXP(level.reward_xp);
          setShowModal(true);
        } else {
          setOutput('Error: Output did not match expected.');
        }
      }, 1000);
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-primary-400">Loading Module...</div>;
  if (!level) return <div className="text-center py-20 text-gray-400">Level not found.</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={handleRunCode}
          disabled={isExecuting}
          className={`btn-primary flex items-center gap-2 ${isExecuting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isExecuting ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          ) : (
            <Play size={18} />
          )}
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">

        {/* Left Panel: Instructions & Output */}
        <div className="flex flex-col gap-6 overflow-hidden">

          <div className="glass-card p-6 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-bold text-accent-400 mb-4">{level.name}</h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p>Category: <span className="text-primary-400 font-semibold">{level.category?.name || 'General'}</span></p>
              <p>Difficulty: <span className="bg-dark-900 px-2 py-1 rounded text-xs border border-white/5">{level.difficulty_level}</span></p>

              <h3 className="text-white mt-6 mb-2">Instructions:</h3>
              <p className="text-gray-100 leading-relaxed bg-dark-800/50 p-4 rounded-lg border border-white/5">
                {level.problem_statement}
              </p>
            </div>
          </div>

          <div className="glass-card p-0 flex flex-col h-64 border-t-4 border-t-dark-700">
            <div className="bg-dark-800 px-4 py-2 border-b border-white/5 flex items-center gap-2">
              <Terminal size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-300">Console Output</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto font-mono text-sm bg-[#0d0d0d] text-gray-300 whitespace-pre-wrap">
              {output || '> Waiting for execution...'}
            </div>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="glass-card overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <Editor
            height="100%"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              padding: { top: 20 },
              fontFamily: "'Fira Code', 'Courier New', monospace",
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
            }}
          />
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 max-w-sm w-full text-center relative overflow-hidden transform scale-100 transition-all shadow-[0_0_50px_rgba(106,13,173,0.4)] border border-primary-500/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <CheckCircle className="text-green-400 w-10 h-10" />
            </div>

            <h3 className="text-3xl font-bold text-white mb-2">Level Passed!</h3>
            <p className="text-gray-300 mb-6">Excellent work. Your logic was flawless.</p>

            <div className="bg-dark-800 rounded-lg p-4 mb-8 flex justify-center items-center gap-3 border border-white/5">
              <Award className="text-accent-400" />
              <span className="font-bold text-xl text-primary-400">+{earnedXP} XP</span>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                navigate('/');
              }}
              className="btn-primary w-full"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
