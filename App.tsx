import React, { useState, useEffect } from 'react';
import { AppState, TranscriptResult, ChannelName } from './types';
import { extractVideoId, copyToClipboard, downloadAsText, formatTranscriptForExport, isRTL } from './utils';
import getTranscript from './channels';
import { runAllTests } from './test';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    loading: false,
    error: null,
    result: null,
    activeChannel: null,
    showTimestamps: true,
  });

  const [urlInput, setUrlInput] = useState('');
  const [language, setLanguage] = useState('ar');
  const [loadingStatus, setLoadingStatus] = useState('');
  
  // UI States
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [testResults, setTestResults] = useState<{name: string, passed: boolean, message?: string}[] | null>(null);

  useEffect(() => {
    // Check for ?test=true param
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true') {
      setShowTestRunner(true);
    }
  }, []);

  // Close modal on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsHelpOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
      setState(prev => ({ ...prev, error: 'Invalid YouTube URL' }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    setLoadingStatus('Initializing...');
    
    try {
      const result = await getTranscript(
        videoId, 
        language, 
        undefined, 
        (status) => setLoadingStatus(status)
      );
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        result, 
        activeChannel: result.source as ChannelName 
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || 'Failed to fetch transcript' 
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setState(prev => ({ ...prev, loading: true, error: null, result: null }));
      setLoadingStatus('Parsing file...');
      try {
        const result = await getTranscript(
          '', 
          'auto', 
          e.target.files[0],
          (status) => setLoadingStatus(status)
        );
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          result, 
          activeChannel: result.source as ChannelName 
        }));
      } catch (err: any) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: err.message || 'Failed to parse file' 
        }));
      }
    }
  };

  const handleCopy = () => {
    if (!state.result) return;
    const text = formatTranscriptForExport(state.result, state.showTimestamps);
    copyToClipboard(text).catch(console.error);
  };

  const handleDownload = () => {
    if (!state.result) return;
    const text = formatTranscriptForExport(state.result, state.showTimestamps);
    downloadAsText(text, 'transcript.txt');
  };

  const handleTimestampToggle = () => {
    setState(prev => ({ ...prev, showTimestamps: !prev.showTimestamps }));
  };

  const runTests = () => {
    const results = runAllTests();
    setTestResults(results);
  };

  // Determine text direction for transcript container
  const isResultRTL = state.result && state.result.lines.length > 0 
    ? isRTL(state.result.lines[0].text) 
    : false;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 max-w-3xl mx-auto font-sans relative">
      <header className="w-full flex justify-center items-center mb-8 relative">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">TranscriptGrab</h1>
          <p className="text-slate-500 mt-2">Extract video transcripts instantly</p>
        </div>
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="absolute right-0 top-1 p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100"
          aria-label="Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>
      </header>

      {/* Help Modal */}
      {isHelpOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsHelpOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">المساعدة / Help</h2>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100" dir="rtl">
                <h3 className="font-bold text-blue-600 mb-1">ما هذا التطبيق؟</h3>
                <p>أداة لاستخراج النصوص من فيديوهات يوتيوب.</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h3 className="font-bold text-blue-600 mb-1">What is this?</h3>
                <p>Tool to extract text transcripts from YouTube videos.</p>
              </div>

              <div dir="rtl">
                <h3 className="font-bold mb-1">كيف تستخدمه؟</h3>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>الصق رابط يوتيوب</li>
                  <li>اختر اللغة</li>
                  <li>اضغط "Grab"</li>
                  <li>انسخ أو حمّل النتيجة</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-bold mb-1">How to use</h3>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Paste YouTube link</li>
                  <li>Choose language</li>
                  <li>Tap Grab</li>
                  <li>Copy or download</li>
                </ol>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h3 className="font-bold text-sm mb-1">Alternative: Upload subtitles</h3>
                <p className="text-slate-500 text-xs">يمكنك رفع ملف .srt أو .vtt مباشرة</p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h3 className="font-bold text-sm mb-1">Privacy</h3>
                <p className="text-slate-500 text-xs">
                  لا نخزن أي بيانات. كل شيء يعمل في متصفحك.
                  <br />
                  No data stored. Runs in your browser + Gemini API.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="w-full bg-white shadow-lg rounded-2xl p-6 border border-slate-100">
        {/* Input Form */}
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Paste YouTube URL here..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />

          <div className="flex gap-3">
            {/* Language Selector */}
            <div className="relative flex-1 min-w-[140px]">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
                <option value="auto">Original Language</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Grab Button */}
            <button
              type="submit"
              disabled={state.loading || !urlInput}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors min-w-[100px] whitespace-nowrap"
            >
              {state.loading ? (loadingStatus || 'Loading...') : 'Grab'}
            </button>
          </div>
          
          <div className="flex justify-between items-center text-xs text-slate-400 px-1 pt-2">
             <span>or upload .srt / .vtt</span>
             <label className="cursor-pointer text-blue-600 hover:text-blue-700 hover:underline">
               Browse files
               <input type="file" accept=".srt,.vtt" className="hidden" onChange={handleFileUpload} />
             </label>
          </div>

          {state.error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
              {state.error}
            </div>
          )}
        </form>

        {/* Results Area */}
        {state.result && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                        via {state.result.source}
                    </span>
                    <div className="flex space-x-2">
                        <button 
                           onClick={handleTimestampToggle}
                           className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                        >
                           {state.showTimestamps ? 'Hide Time' : 'Show Time'}
                        </button>
                        <button 
                           onClick={handleCopy}
                           className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                           Copy
                        </button>
                        <button 
                           onClick={handleDownload}
                           className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                           Download
                        </button>
                    </div>
                </div>

                <div 
                  className={`p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-[60vh] overflow-y-auto ${isResultRTL ? 'text-right' : 'text-left'}`}
                  dir={isResultRTL ? 'rtl' : 'ltr'}
                >
                    {state.result.lines.map((line, idx) => (
                        <div key={idx} className="mb-3 leading-relaxed">
                            {state.showTimestamps && (
                                <span className="inline-block text-blue-500 text-xs font-mono select-none opacity-70 mx-2">
                                    {line.timestamp}
                                </span>
                            )}
                            <span className="text-slate-800 font-medium">
                                {line.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {!state.result && !state.loading && (
             <div className="mt-8 text-center text-slate-400 text-sm">
                <p>Paste a link above to get started.</p>
             </div>
        )}
      </main>

      {/* Test Runner UI (Visible only if ?test=true) */}
      {showTestRunner && (
        <div className="w-full max-w-3xl mt-8 bg-slate-900 text-slate-200 p-4 rounded-xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono font-bold">Test Runner</h3>
            <button 
              onClick={runTests} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-mono"
            >
              Run Tests
            </button>
          </div>
          {testResults && (
            <ul className="space-y-1 font-mono text-xs">
              {testResults.map((t, i) => (
                <li key={i} className={`flex items-start ${t.passed ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="mr-2">{t.passed ? '✅' : '❌'}</span>
                  <span>{t.name} {t.message && !t.passed && ` - ${t.message}`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <footer className="mt-12 text-slate-400 text-xs text-center">
        <p>Powered by Gemini API &bull; Privacy Focused &bull; No Data Stored</p>
      </footer>
    </div>
  );
};

export default App;
