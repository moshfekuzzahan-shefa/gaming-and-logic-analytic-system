import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Terminal, Award, CheckCircle } from 'lucide-react';

const BOILERPLATE = `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}
`;

export default function LevelExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(BOILERPLATE);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput('Compiling and executing...');
    
    try {
      // Mocked fetch request to backend execute route
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          expectedOutput: 'Hello World' // Dummy expected output
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
              user_id: 1, // Dummy user ID
              level_id: Number(id),
              time_taken: data.timeTakenMs,
              is_success: true,
              score: 50 // Dummy score
            })
          }).catch(console.error);

          setEarnedXP(50);
          setShowModal(true);
        }
      } else {
        // Fallback behavior if backend isn't running
        setTimeout(() => {
          if (code.includes('cout')) {
             setOutput('Hello World');
             setEarnedXP(50);
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
           setOutput('Hello World');
           setEarnedXP(50);
           setShowModal(true);
        } else {
           setOutput('Error: Output did not match expected.');
        }
      }, 1000);
    } finally {
      setIsExecuting(false);
    }
  };

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
            <h2 className="text-2xl font-bold text-accent-400 mb-4">Level {id}: Hello World</h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p>Welcome to your first challenge! Let's get familiar with the syntax.</p>
              <h3 className="text-white mt-6 mb-2">Task:</h3>
              <p>Print exactly <code className="bg-dark-900 px-2 py-1 rounded text-primary-400">Hello World</code> to the standard output.</p>
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
