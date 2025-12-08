import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Film, RefreshCw, ChevronLeft, Sparkles, Send, X, 
  MessageSquareQuote, BrainCircuit, Play, Ticket, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { movieDatabase, genres } from './data';
import { Movie, ViewState, ExtraContent } from './types';
import { getAIMovieRecommendation, getMovieExtra } from './services/gemini';

// --- SUB-COMPONENTS ---

const AuroraBackground = React.memo(() => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020617]">
    {/* Animated Blobs */}
    <motion.div 
      animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], x: [0, 50, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px]" 
    />
    <motion.div 
      animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.3, 1], y: [0, -50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute top-1/3 right-0 w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[140px]" 
    />
    <motion.div 
      animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1], x: [0, -30, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute -bottom-20 left-1/4 w-[35rem] h-[35rem] bg-pink-600/10 rounded-full blur-[130px]" 
    />
  </div>
));

const GlassCard = React.memo(({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl shadow-2xl ${className}`}
  >
    {children}
  </div>
));

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // AI State
  const [showAIInput, setShowAIInput] = useState(false);
  const [userMood, setUserMood] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiExtraContent, setAiExtraContent] = useState<ExtraContent | null>(null);
  const [loadingExtra, setLoadingExtra] = useState<'quote' | 'trivia' | null>(null);
  
  // Ref to store interval ID for cleanup
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  const pickMovie = useCallback((genreName: string) => {
    // Clear any existing animation
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    
    setIsAnimating(true);
    setView('result');
    setAiExtraContent(null);
    
    const list = movieDatabase[genreName];
    if (!list || list.length === 0) {
      setIsAnimating(false);
      return;
    }
    
    // Pick final movie immediately to avoid duplicate random selection
    const finalPick = list[Math.floor(Math.random() * list.length)];
    
    let count = 0;
    const maxCount = 12;
    animationIntervalRef.current = setInterval(() => {
      count++;
      
      // Show random movies during animation
      if (count <= maxCount) {
        const randomTemp = list[Math.floor(Math.random() * list.length)];
        setMovie(randomTemp);
      }
      
      // Set final pick and stop animation
      if (count > maxCount) { 
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
        setMovie(finalPick);
        setIsAnimating(false);
      }
    }, 80);
  }, []);

  const handleGenreClick = useCallback((genreName: string) => {
    setSelectedGenre(genreName);
    pickMovie(genreName);
  }, [pickMovie]);

  const handleAIMatch = useCallback(async () => {
    if (!userMood.trim() || isAILoading) return; // Prevent duplicate calls
    setIsAILoading(true);
    try {
      const recommendation = await getAIMovieRecommendation(userMood);
      setMovie(recommendation);
      setSelectedGenre("AI Pick");
      setView('result');
      setShowAIInput(false);
      setUserMood(""); 
      setAiExtraContent(null);
    } catch (error) {
      alert("Network issue. Let's watch something 'Feel Good' instead!");
    } finally {
      setIsAILoading(false);
    }
  }, [userMood, isAILoading]);

  const fetchExtra = useCallback(async (type: 'quote' | 'trivia') => {
    if (!movie || loadingExtra) return; // Prevent duplicate calls
    setLoadingExtra(type);
    setAiExtraContent(null);
    try {
      const text = await getMovieExtra(movie.title, movie.year, type);
      setAiExtraContent({ type, text });
    } catch (error) {
      console.error('Error fetching extra content:', error);
    } finally {
      setLoadingExtra(null);
    }
  }, [movie, loadingExtra]);

  const handleBack = useCallback(() => {
    setView('home');
    setSelectedGenre(null);
    setMovie(null);
    setShowAIInput(false);
    setAiExtraContent(null);
  }, []);

  // Memoize trailer URL to avoid recalculating on every render
  const trailerUrl = useMemo(() => {
    if (!movie) return '';
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " " + movie.year + " trailer")}`;
  }, [movie]);

  return (
    <div className="relative min-h-screen text-slate-100 font-sans overflow-x-hidden selection:bg-pink-500/30">
      <AuroraBackground />
      
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 container mx-auto min-h-screen flex flex-col p-4 sm:p-6 lg:p-12">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-10 md:mb-16"
        >
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
              Desi Cinephile
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium mt-2 tracking-widest uppercase opacity-80">
              Curated Indian Cinema
            </p>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]">
            <Film className="w-6 h-6 md:w-8 md:h-8 text-rose-300" />
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              className="flex-1 flex flex-col max-w-7xl mx-auto w-full"
            >
              {/* AI Mood Input Section */}
              <motion.div 
                layout
                className="mb-10 w-full mx-auto"
              >
                 {!showAIInput ? (
                  <button 
                    onClick={() => setShowAIInput(true)}
                    className="w-full relative group overflow-hidden rounded-3xl p-[1px] shadow-2xl transition-all hover:scale-[1.01]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-[#0f172a] rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                          <Sparkles className="w-8 h-8 text-indigo-300" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-2xl md:text-3xl text-white mb-2">Match My Mood</h3>
                          <p className="text-slate-400 text-lg">Not sure what to watch? Let AI find the perfect film.</p>
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-full border border-white/10 group-hover:bg-white/10 transition-colors">
                         <ChevronLeft className="rotate-180 text-white w-6 h-6" />
                      </div>
                    </div>
                  </button>
                 ) : (
                  <GlassCard className="p-6 md:p-10 border-indigo-500/30">
                     <div className="flex justify-between items-center mb-6">
                      <label className="text-xl font-semibold text-indigo-200 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-indigo-400" /> How are you feeling right now?
                      </label>
                      <button onClick={() => setShowAIInput(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="relative">
                        <textarea
                        value={userMood}
                        onChange={(e) => setUserMood(e.target.value)}
                        placeholder="e.g., I just had a breakup and need something inspiring, or I want a mind-bending thriller that keeps me guessing..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none h-40 mb-6 text-white placeholder:text-slate-600 leading-relaxed"
                        />
                        <div className="absolute bottom-8 right-4 text-xs text-slate-600 pointer-events-none">
                            Powered by Gemini 2.5 Flash
                        </div>
                    </div>
                    
                    <button 
                      onClick={handleAIMatch}
                      disabled={isAILoading || !userMood.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3"
                    >
                      {isAILoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {isAILoading ? "Analyzing Mood..." : "Find My Movie"}
                    </button>
                  </GlassCard>
                 )}
              </motion.div>

              {/* Genre Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {genres.map((genre, index) => (
                  <motion.button
                    key={genre.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleGenreClick(genre.name)}
                    className="group relative overflow-hidden rounded-[2rem] text-left border border-white/5 bg-white/[0.02] hover:border-white/20 transition-all duration-500 hover:-translate-y-1"
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <div className="relative z-10 p-8 flex flex-col h-full justify-between min-h-[200px]">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 ${genre.color}`}>
                          <genre.icon className="w-8 h-8" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                             <div className="p-2 bg-white/10 rounded-full"><Play className="w-4 h-4 fill-white text-white" /></div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-3xl mb-2 text-white/90 group-hover:text-white transition-colors">{genre.name}</h3>
                        <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">{genre.desc}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="flex-1 flex flex-col w-full max-w-5xl mx-auto"
            >
              {/* Back Button */}
               <button 
                onClick={handleBack}
                className="self-start flex items-center gap-3 text-slate-400 hover:text-white mb-6 transition-colors group py-2"
              >
                <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:border-white/20 transition-all">
                  <ChevronLeft className="w-5 h-5" /> 
                </div>
                <span className="text-sm font-medium uppercase tracking-widest">Back to Library</span>
              </button>

              <div className="flex-1 w-full">
                {movie && (
                  <div className="relative group">
                    {/* Glow Effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${selectedGenre === 'AI Pick' ? 'from-indigo-600 to-purple-600' : 'from-orange-600 to-rose-600'} rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000`}></div>
                    
                    <GlassCard className="overflow-hidden relative flex flex-col md:flex-row min-h-[500px]">
                      
                      {/* Left: Visual Representation */}
                      <div className="w-full md:w-2/5 bg-black/20 relative flex flex-col items-center justify-center p-10 border-b md:border-b-0 md:border-r border-white/5">
                         {/* Background abstract shape */}
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 z-0" />
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px] z-0 ${isAnimating ? 'animate-pulse' : ''}`} />
                         
                         <motion.div 
                          key={isAnimating ? 'animating' : movie.title}
                          animate={isAnimating ? { 
                            scale: [0.9, 1.1, 0.9], 
                            filter: ["blur(2px)", "blur(0px)", "blur(2px)"],
                            rotate: [-5, 5, -5]
                          } : { scale: 1, rotate: 0, filter: "blur(0px)" }}
                          transition={{ duration: 0.15, repeat: isAnimating ? Infinity : 0 }}
                          className="text-[8rem] md:text-[10rem] drop-shadow-2xl relative z-10 transform hover:scale-110 transition-transform duration-500 cursor-default select-none"
                        >
                          {movie.emoji}
                        </motion.div>
                         
                         <div className="flex flex-wrap justify-center gap-3 relative z-10 mt-8">
                            <span className="px-4 py-1.5 rounded-full bg-white/5 text-xs font-bold border border-white/10 text-slate-300 backdrop-blur-md uppercase tracking-wider flex items-center gap-2">
                              <Ticket className="w-3 h-3" /> {movie.year}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-xs font-bold border border-indigo-500/20 text-indigo-200 backdrop-blur-md uppercase tracking-wider">
                              {selectedGenre}
                            </span>
                         </div>
                      </div>

                      {/* Right: Content */}
                      <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center relative z-10 bg-gradient-to-br from-white/[0.01] to-transparent">
                        <div className={isAnimating ? 'opacity-40 blur-[2px] transition-all duration-300' : 'opacity-100 blur-0 transition-all duration-300'}>
                          <h2 className="font-serif text-4xl md:text-6xl font-medium mb-6 text-white leading-[1.1]">
                            {movie.title}
                          </h2>

                          <p className="text-slate-300 text-lg leading-relaxed mb-8 font-light border-l-2 border-white/20 pl-6">
                            {movie.reason ? (
                              <span>
                                <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest block mb-2">Why you'll love it</span>
                                {movie.reason}
                              </span>
                            ) : (
                                movie.desc
                            )}
                          </p>
                        </div>

                        {/* Interactive Extras */}
                        {!isAnimating && (
                          <div className="grid grid-cols-2 gap-4 mb-8">
                            <button 
                                onClick={() => fetchExtra('quote')} 
                                disabled={!!loadingExtra} 
                                className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-colors flex items-center gap-3 group text-left"
                            >
                               <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                   {loadingExtra === 'quote' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <MessageSquareQuote className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                               </div>
                               <div>
                                   <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unlock</div>
                                   <div className="text-sm font-medium text-slate-200">Iconic Quote</div>
                               </div>
                            </button>
                            <button 
                                onClick={() => fetchExtra('trivia')} 
                                disabled={!!loadingExtra} 
                                className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-colors flex items-center gap-3 group text-left"
                            >
                               <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                   {loadingExtra === 'trivia' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                               </div>
                               <div>
                                   <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unlock</div>
                                   <div className="text-sm font-medium text-slate-200">Fun Fact</div>
                               </div>
                            </button>
                          </div>
                        )}
                        
                        {/* AI Content Display */}
                        <AnimatePresence>
                            {aiExtraContent && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }} 
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-indigo-950/30 p-6 rounded-2xl border border-indigo-500/20 text-indigo-100 italic relative">
                                    <span className="absolute top-4 left-4 text-4xl text-indigo-500/20 font-serif">"</span>
                                    <p className="relative z-10 pl-4">{aiExtraContent.text}</p>
                                </div>
                            </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                           <button 
                            onClick={() => window.open(trailerUrl, '_blank')}
                            disabled={isAnimating}
                            className="flex-1 py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-bold shadow-lg shadow-white/10 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 text-base"
                          >
                            <Play className="w-4 h-4 fill-black" /> Watch Trailer
                          </button>
                          
                          {selectedGenre !== "AI Pick" ? (
                            <button 
                              onClick={() => pickMovie(selectedGenre!)}
                              disabled={isAnimating}
                              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 flex items-center justify-center gap-2 transition-all text-base"
                            >
                              <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} /> 
                              {isAnimating ? 'Shuffling...' : 'Shuffle Again'}
                            </button>
                          ) : (
                             <button 
                             onClick={() => { setView('home'); setShowAIInput(true); }}
                             className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 flex items-center justify-center gap-2 transition-all text-base"
                           >
                             <Sparkles className="w-4 h-4" /> Try New Mood
                           </button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
