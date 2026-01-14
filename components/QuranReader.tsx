
import React, { useState, useEffect, useRef } from 'react';
import { Surah, Verse, AppSettings, QuranPage, TafseerId } from '../types';
import { ChevronRight, ChevronLeft, BookOpen, RotateCw, X, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { fetchSurahVerses, fetchQuranPage, fetchTafseer } from '../services/quranApi';
import { getAudioUrl, getReciterName } from '../services/audioService';

interface QuranReaderProps {
  settings: AppSettings;
  goBack: () => void;
  surah: Surah;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

const QuranReader: React.FC<QuranReaderProps> = ({ settings, goBack, surah, initialPage, onPageChange }) => {
  const [activeVerseId, setActiveVerseId] = useState<number | null>(null);
  const [tafseerData, setTafseerData] = useState<{ [key: number]: string }>({});
  const [loadingTafseer, setLoadingTafseer] = useState<number | null>(null);
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVerse, setPlayingVerse] = useState<Verse | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Page-based State (Mushaf Mode)
  const [currentPage, setCurrentPage] = useState<number>(initialPage || surah.startPage);
  const [pageMetadata, setPageMetadata] = useState<QuranPage | null>(null);
  
  // Animation State
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  
  // Touch State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // List-based State (List Mode)
  const [verses, setVerses] = useState<Verse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Audio Logic ---
  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio();
    
    // Cleanup on unmount
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
    if (!playingVerse || !audioRef.current) return;

    // Construct URL for playingVerse
    // Note: playingVerse needs valid surah data. 
    // In Mushaf mode, playingVerse might come from pageMetadata without full surah context sometimes,
    // but our fetchQuranPage maps surahs correctly.
    const sId = playingVerse.surah?.id || surah.id;
    const url = getAudioUrl(settings.selectedReciter, sId, playingVerse.number);
    
    // Only update src if it's different to avoid reloading
    if (audioRef.current.src !== url) {
        audioRef.current.src = url;
        audioRef.current.load();
    }
    
    if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Audio play failed", error);
                setIsPlaying(false);
            });
        }
    } else {
        audioRef.current.pause();
    }

    // Scroll to verse logic
    const element = document.getElementById(`verse-${playingVerse.id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Handle Ended Event -> Next Verse
    audioRef.current.onended = () => {
        playNextVerse();
    };

  }, [playingVerse, isPlaying, settings.selectedReciter]);

  const togglePlay = () => {
      if (!playingVerse) {
          // If nothing is playing, start from the first visible verse
          const firstVerse = settings.readingMode === 'mushaf' 
            ? pageMetadata?.ayahs[0] 
            : verses[0];
          
          if (firstVerse) {
              setPlayingVerse(firstVerse);
              setIsPlaying(true);
          }
      } else {
          setIsPlaying(!isPlaying);
      }
  };

  const playNextVerse = () => {
      if (!playingVerse) return;

      let nextVerse: Verse | undefined;

      if (settings.readingMode === 'mushaf' && pageMetadata) {
          const currentIndex = pageMetadata.ayahs.findIndex(v => v.id === playingVerse.id);
          if (currentIndex !== -1 && currentIndex < pageMetadata.ayahs.length - 1) {
              nextVerse = pageMetadata.ayahs[currentIndex + 1];
          } else {
              // End of page in Mushaf mode
              // Ideally, we auto-flip page here. For now, stop or pause.
              setIsPlaying(false);
          }
      } else {
          const currentIndex = verses.findIndex(v => v.id === playingVerse.id);
          if (currentIndex !== -1 && currentIndex < verses.length - 1) {
              nextVerse = verses[currentIndex + 1];
          }
      }

      if (nextVerse) {
          setPlayingVerse(nextVerse);
      } else {
          setIsPlaying(false);
      }
  };

  const playPrevVerse = () => {
      if (!playingVerse) return;
      
      let prevVerse: Verse | undefined;

      if (settings.readingMode === 'mushaf' && pageMetadata) {
          const currentIndex = pageMetadata.ayahs.findIndex(v => v.id === playingVerse.id);
          if (currentIndex > 0) {
              prevVerse = pageMetadata.ayahs[currentIndex - 1];
          }
      } else {
          const currentIndex = verses.findIndex(v => v.id === playingVerse.id);
          if (currentIndex > 0) {
              prevVerse = verses[currentIndex - 1];
          }
      }

      if (prevVerse) setPlayingVerse(prevVerse);
  };
  // --- End Audio Logic ---


  // Preload Next/Prev Pages Data
  useEffect(() => {
    if (settings.readingMode === 'mushaf') {
        const preload = async (p: number) => {
            if (p >= 1 && p <= 604) {
                await fetchQuranPage(p);
            }
        };
        preload(currentPage + 1);
        preload(currentPage - 1);
    }
  }, [currentPage, settings.readingMode]);

  // Lock Body Scroll when Tafseer is open
  useEffect(() => {
    if (activeVerseId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeVerseId]);

  // Notify parent of page change for persistence
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  useEffect(() => {
    let mounted = true;
    
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      // Stop audio if changing heavy context like Surah (page change is handled differently usually)
      if (settings.readingMode === 'list') {
         setIsPlaying(false);
         setPlayingVerse(null);
      }

      try {
        if (settings.readingMode === 'mushaf') {
           // Fetch Page Text Data
           const validPage = Math.max(1, Math.min(604, currentPage));
           const data = await fetchQuranPage(validPage);
           
           if (mounted) {
             if (data) setPageMetadata(data);
             setLoading(false);
           }
        } else {
           const data = await fetchSurahVerses(surah.id);
           if (mounted && data.length > 0) setVerses(data);
           else if (mounted) setError("تعذر تحميل الآيات.");
           setLoading(false);
        }
      } catch (err) {
        if (mounted) setError("حدث خطأ غير متوقع.");
        setLoading(false);
      }
    };

    loadContent();
    return () => { mounted = false; };
  }, [surah.id, currentPage, settings.readingMode]);

  // Handle external surah change or initialPage prop update
  useEffect(() => {
      setCurrentPage(initialPage || surah.startPage);
  }, [initialPage, surah.id, surah.startPage]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (settings.readingMode !== 'mushaf') return;
        if (e.key === 'ArrowRight') nextPage(); 
        if (e.key === 'ArrowLeft') prevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, settings.readingMode]);

  const getTafseerName = (id: TafseerId) => {
      const names = {
          'ar.muyassar': 'التفسير الميسر',
          'ar.jalalayn': 'تفسير الجلالين',
          'ar.ibnkathir': 'تفسير ابن كثير',
          'ar.qurtubi': 'تفسير القرطبي',
          'ar.tabari': 'تفسير الطبري'
      };
      return names[id] || 'التفسير';
  };

  const handleExplain = async (verse: Verse) => {
    setLoadingTafseer(verse.id);
    setActiveVerseId(verse.id); 
    
    // Pause audio when reading tafseer
    if (isPlaying) setIsPlaying(false);

    const sId = verse.surah?.id || surah.id;
    const explanation = await fetchTafseer(sId, verse.number, settings.selectedTafseer);
    
    setTafseerData(prev => ({ ...prev, [verse.id]: explanation }));
    setLoadingTafseer(null);
  };

  const changePage = (newPage: number) => {
      if (newPage >= 1 && newPage <= 604 && newPage !== currentPage) {
          // Stop audio when changing page manually
          setIsPlaying(false);
          setPlayingVerse(null);

          const direction = newPage > currentPage ? 'next' : 'prev';
          setFlipDirection(direction);
          setIsFlipping(true);
          
          const container = document.getElementById('quran-container');
          if(container) container.scrollTop = 0;

          setCurrentPage(newPage);
          setTimeout(() => setIsFlipping(false), 500); 
      }
  };

  const nextPage = () => changePage(currentPage + 1);
  const prevPage = () => changePage(currentPage - 1);

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
         if (currentPage < 604) nextPage();
    }
    if (isRightSwipe) {
         if (currentPage > 1) prevPage();
    }
  };

  const fontStyle = { 
    fontSize: `${18 + settings.fontSize * 4}px`,
    fontFamily: settings.fontFamily
  };

  const renderVerseNumber = (num: number, isPlaying: boolean) => {
      const style = settings.verseNumberStyle;
      
      const activeColorClass = isPlaying ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-300";
      const activeBgClass = isPlaying ? "bg-amber-100 dark:bg-amber-900" : "bg-emerald-50 dark:bg-emerald-900";
      const activeBorderClass = isPlaying ? "border-amber-400" : "border-emerald-200 dark:border-emerald-800";

      if (style === 'flower') {
           return (
            <span className={`inline-flex items-center justify-center w-[1.2em] h-[1.2em] relative ${activeColorClass} mx-1 align-middle`}>
                <svg viewBox="0 0 24 24" className={`w-full h-full absolute inset-0 ${isPlaying ? 'text-amber-200' : 'text-emerald-100 dark:text-emerald-900'}`} fill="currentColor">
                    <path d="M12 2l2.5 6h6.5l-5 4 2 6-6-4-6 4 2-6-5-4h6.5z" /> 
                </svg>
                <span className="relative z-10 text-[0.6em] font-bold font-quran">{num.toLocaleString('ar-EG')}</span>
            </span>
           );
      }
      
      const shapeClass = style === 'square' ? 'rounded-md' : 'rounded-full';

      return (
        <span className={`inline-flex items-center justify-center w-[1.2em] h-[1.2em] mx-1 ${activeBgClass} ${activeColorClass} text-[0.6em] font-bold font-quran border ${activeBorderClass} align-middle ${shapeClass}`}>
          {num.toLocaleString('ar-EG')}
        </span>
      );
  };

  const formatSurahName = (name: string) => {
      if (!name) return "";
      const normalized = name.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").trim();
      if (normalized.startsWith('سورة')) {
          return name;
      }
      return `سورة ${name}`;
  };

  const getSurahName = () => {
      if (pageMetadata) {
          const surahsList = Object.values(pageMetadata.surahs) as Surah[];
          const name = surahsList[0]?.name;
          return formatSurahName(name || surah.name);
      }
      return formatSurahName(surah.name);
  };

  // Helper to remove duplicate Basmalah from API text if header is present
  const processVerseText = (text: string, isFirst: boolean, surahId?: number) => {
      if (isFirst && surahId !== 1 && surahId !== 9) {
          // Remove Basmalah with various potential tashkeel configurations
          // Note: The sequence of tashkeel can vary (Shadda+Fatha vs Fatha+Shadda)
          const patterns = [
              /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s?/,
              /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s?/,
              /^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s?/ 
          ];
          
          let processed = text;
          for (const pattern of patterns) {
              if (pattern.test(processed)) {
                  return processed.replace(pattern, '').trim();
              }
          }
          return processed;
      }
      return text;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between shadow-sm px-4 h-16">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ChevronRight size={24} className="transform rotate-180 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="text-center">
            {settings.readingMode === 'mushaf' ? (
                <div className="flex flex-col items-center">
                     <h2 className="font-bold text-lg font-quran text-emerald-800 dark:text-emerald-400">
                        {getSurahName()}
                     </h2>
                     <span className="text-xs text-gray-500">الجزء {pageMetadata?.ayahs[0]?.juz || '-'} • صفحة {currentPage}</span>
                </div>
            ) : (
                <>
                    <h2 className="font-bold text-xl font-quran">{surah.name}</h2>
                    <p className="text-xs text-gray-500">{surah.revelation_place} • {surah.verses_count} آيات</p>
                </>
            )}
        </div>
        <div className="w-8"></div>
      </div>

      {/* Tafseer Panel */}
      {activeVerseId && (
         <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveVerseId(null)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-t-3xl p-6 relative shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[75vh]">
               {/* Handle Bar */}
               <div className="w-16 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 shrink-0"></div>
               
               {/* Header */}
               <div className="flex items-center gap-3 mb-6 shrink-0 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-700 dark:text-emerald-400">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white">{getTafseerName(settings.selectedTafseer)}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          الآية {activeVerseId && verses.find(v => v.id === activeVerseId)?.number}
                      </p>
                  </div>
                  <button onClick={() => setActiveVerseId(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <X size={20}/>
                  </button>
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
                   {loadingTafseer === activeVerseId ? (
                      <div className="flex flex-col items-center justify-center py-12">
                         <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                         <p className="text-gray-500 font-medium">جاري جلب التفسير...</p>
                      </div>
                   ) : (
                      <div 
                        className="leading-[2.2] text-gray-700 dark:text-gray-300 text-justify pl-2"
                        style={{ 
                            fontSize: `${16 + settings.tafseerFontSize * 2}px`,
                            fontFamily: settings.tafseerFontFamily
                        }}
                      >
                        {tafseerData[activeVerseId]}
                      </div>
                   )}
               </div>
            </div>
         </div>
      )}

      {/* Content Area */}
      <div 
        id="quran-container" 
        className="flex-1 overflow-y-auto overflow-x-hidden p-0 md:p-6 scroll-smooth flex justify-center items-start bg-[#f3f2ea] dark:bg-[#0f1115] perspective-container touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
           <div className="flex flex-col items-center justify-center py-40">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 animate-pulse">جاري تحميل...</p>
           </div>
        ) : error ? (
           <div className="text-center py-40 w-full">
             <p className="text-red-500 mb-4">{error}</p>
             <button onClick={() => window.location.reload()} className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-200 rounded-lg text-sm">
                <RotateCw size={16} /> إعادة المحاولة
             </button>
           </div>
        ) : (
          <>
            {/* --- MUSHAF MODE (TEXT PAGES) --- */}
            {settings.readingMode === 'mushaf' && pageMetadata && (
              <div className={`w-full max-w-3xl transition-all duration-300 ${isFlipping ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                  <div className="bg-[#fffbf2] dark:bg-[#151515] shadow-xl relative min-h-[calc(100vh-10rem)] flex flex-col items-center rounded-lg border-2 border-[#d4b981] p-6 md:p-10 mx-auto mt-2 mb-20">
                       
                       {/* Decorative Borders */}
                       <div className="absolute top-2 left-2 right-2 bottom-2 border border-[#d4b981] pointer-events-none opacity-50 rounded"></div>

                       {/* Page Content */}
                       <div className="text-center space-y-6 w-full" dir="rtl">
                           {pageMetadata.ayahs.map((ayah) => {
                               const isFirstAyahInSurah = ayah.number === 1;
                               const showBasmala = isFirstAyahInSurah && ayah.surah?.id !== 1 && ayah.surah?.id !== 9;
                               const showSurahHeader = isFirstAyahInSurah;
                               const isActiveAudio = playingVerse?.id === ayah.id;
                               const displayText = processVerseText(ayah.text, isFirstAyahInSurah, ayah.surah?.id);
                               
                               return (
                                   <React.Fragment key={ayah.id}>
                                       {showSurahHeader && ayah.surah && (
                                           <div className="mt-8 mb-6 border-y-2 border-[#d4b981] py-3 bg-[#fdfcf5] dark:bg-[#252525] mx-auto max-w-md rounded-lg">
                                               <h2 className="font-quran text-2xl text-emerald-800 dark:text-emerald-400 text-center">
                                                   {formatSurahName(ayah.surah.name)}
                                               </h2>
                                           </div>
                                       )}
                                       {showBasmala && (
                                           <div className="font-quran text-2xl mb-4 text-gray-600 dark:text-gray-400 text-center">
                                               بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                           </div>
                                       )}
                                       <span 
                                          id={`verse-${ayah.id}`}
                                          onClick={() => {
                                              if (isPlaying) {
                                                  // If playing, clicking changes the playing verse
                                                  setPlayingVerse(ayah);
                                              } else {
                                                  // If not playing, open tafseer
                                                  handleExplain(ayah);
                                              }
                                          }}
                                          className={`inline leading-[2.5] text-justify cursor-pointer rounded px-0.5 transition-colors duration-300 
                                            ${isActiveAudio ? 'text-amber-700 bg-amber-100/50 dark:text-amber-400 dark:bg-amber-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}
                                          `}
                                          style={fontStyle}
                                       >
                                          {displayText} 
                                          {renderVerseNumber(ayah.number, isActiveAudio)}
                                       </span>
                                   </React.Fragment>
                               )
                           })}
                       </div>
                       
                       {/* Page Number Overlay */}
                       <div className="mt-8 text-xs font-bold text-gray-400 font-mono">
                            {currentPage}
                       </div>
                  </div>
              </div>
            )}

            {/* --- LIST MODE (VERTICAL SCROLL) --- */}
            {settings.readingMode === 'list' && (
              <div className="space-y-6 pb-24 w-full px-4 pt-4 max-w-3xl">
                {surah.id !== 1 && surah.id !== 9 && (
                    <div className="text-center py-4 text-2xl text-emerald-800 dark:text-emerald-400" style={{ fontFamily: settings.fontFamily }}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                )}
                {verses.map((verse) => {
                  const isActiveAudio = playingVerse?.id === verse.id;
                  const isFirstAyah = verse.number === 1;
                  const displayText = processVerseText(verse.text, isFirstAyah, surah.id);

                  return (
                    <div id={`verse-${verse.id}`} key={verse.id} className="relative group animate-fade-in">
                        <div className={`rounded-2xl p-6 shadow-sm border transition-all 
                            ${isActiveAudio 
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 ring-1 ring-amber-200' 
                                : 'bg-white dark:bg-gray-800 border-transparent hover:border-emerald-100 dark:hover:border-emerald-900'
                            }`}>
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-gray-700 pb-2">
                            {renderVerseNumber(verse.number, isActiveAudio)}
                            <div className="flex-1"></div>
                            <button 
                                onClick={() => { setPlayingVerse(verse); setIsPlaying(true); }}
                                className={`p-1.5 transition-colors ${isActiveAudio ? 'text-amber-600' : 'text-gray-400 hover:text-emerald-600'}`}
                            >
                                <Play size={18} fill={isActiveAudio ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => handleExplain(verse)} className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="تفسير">
                                <BookOpen size={18} />
                            </button>
                        </div>
                        <p className={`text-right leading-[2.5] mb-4 ${isActiveAudio ? 'text-amber-900 dark:text-amber-100' : 'text-gray-800 dark:text-gray-100'}`} style={fontStyle}>
                            {displayText}
                        </p>
                        </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Audio Player Footer */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 relative">
         <div className="max-w-2xl mx-auto flex items-center justify-between">
             
             {/* Info */}
             <div className="flex-1 min-w-0">
                 <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-0.5">{getReciterName(settings.selectedReciter)}</p>
                 <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 truncate font-quran">
                     {playingVerse ? (
                         <>الآية {playingVerse.number} {playingVerse.surah?.name && `• ${playingVerse.surah.name}`}</>
                     ) : (
                         "اختر آية للبدء"
                     )}
                 </p>
             </div>

             {/* Controls */}
             <div className="flex items-center gap-4 ltr">
                 <button onClick={playPrevVerse} disabled={!playingVerse} className="p-2 text-gray-500 hover:text-emerald-600 disabled:opacity-30">
                     <SkipBack size={20} className="transform rotate-180" /> {/* RTL adjustment */}
                 </button>

                 <button 
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"
                 >
                     {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                 </button>

                 <button onClick={playNextVerse} disabled={!playingVerse} className="p-2 text-gray-500 hover:text-emerald-600 disabled:opacity-30">
                     <SkipForward size={20} className="transform rotate-180" /> {/* RTL adjustment */}
                 </button>
             </div>

             {/* Page Control (only in Mushaf mode) */}
             <div className="hidden sm:flex items-center gap-2 mr-4 border-r border-gray-200 dark:border-gray-700 pr-4">
                 {settings.readingMode === 'mushaf' && (
                     <>
                        <button onClick={nextPage} disabled={currentPage >= 604} className="text-gray-500 hover:text-emerald-600 disabled:opacity-30"><ChevronLeft/></button>
                        <span className="text-xs font-bold w-12 text-center">{currentPage}</span>
                        <button onClick={prevPage} disabled={currentPage <= 1} className="text-gray-500 hover:text-emerald-600 disabled:opacity-30"><ChevronRight/></button>
                     </>
                 )}
             </div>
         </div>
      </div>
    </div>
  );
};

export default QuranReader;
