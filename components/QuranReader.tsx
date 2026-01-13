import React, { useState, useEffect, useRef } from 'react';
import { Surah, Verse, AppSettings, QuranPage, TafseerId } from '../types';
import { ChevronRight, ChevronLeft, BookOpen, RotateCw, X, Search } from 'lucide-react';
import { fetchSurahVerses, fetchQuranPage, fetchTafseer } from '../services/quranApi';

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
    
    const sId = verse.surah?.id || surah.id;
    const explanation = await fetchTafseer(sId, verse.number, settings.selectedTafseer);
    
    setTafseerData(prev => ({ ...prev, [verse.id]: explanation }));
    setLoadingTafseer(null);
  };

  const changePage = (newPage: number) => {
      if (newPage >= 1 && newPage <= 604 && newPage !== currentPage) {
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

  const renderVerseNumber = (num: number) => {
      const style = settings.verseNumberStyle;
      
      if (style === 'flower') {
           return (
            <span className="inline-flex items-center justify-center w-[1.2em] h-[1.2em] relative text-emerald-700 dark:text-emerald-300 mx-1 align-middle">
                <svg viewBox="0 0 24 24" className="w-full h-full absolute inset-0 text-emerald-100 dark:text-emerald-900" fill="currentColor">
                    <path d="M12 2l2.5 6h6.5l-5 4 2 6-6-4-6 4 2-6-5-4h6.5z" /> 
                </svg>
                <span className="relative z-10 text-[0.6em] font-bold font-quran">{num.toLocaleString('ar-EG')}</span>
            </span>
           );
      }
      
      const shapeClass = style === 'square' ? 'rounded-md' : 'rounded-full';

      return (
        <span className={`inline-flex items-center justify-center w-[1.2em] h-[1.2em] mx-1 bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[0.6em] font-bold font-quran border border-emerald-200 dark:border-emerald-800 align-middle ${shapeClass}`}>
          {num.toLocaleString('ar-EG')}
        </span>
      );
  };

  const formatSurahName = (name: string) => {
      if (!name) return "";
      // Enhanced normalization to remove all diacritics and extra spaces
      const normalized = name.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").trim();
      if (normalized.startsWith('سورة')) {
          return name;
      }
      return `سورة ${name}`;
  };

  const getSurahName = () => {
      if (pageMetadata) {
          const name = Object.values(pageMetadata.surahs)[0]?.name;
          return formatSurahName(name || surah.name);
      }
      return formatSurahName(surah.name);
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
                        className="font-quran leading-[2.2] text-gray-700 dark:text-gray-300 text-justify pl-2"
                        style={{ fontSize: `${16 + settings.tafseerFontSize * 2}px` }}
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
                                          onClick={() => handleExplain(ayah)}
                                          className="inline leading-[2.5] text-justify text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded px-0.5 transition-colors"
                                          style={fontStyle}
                                       >
                                          {ayah.text} 
                                          {renderVerseNumber(ayah.number)}
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
              <div className="space-y-6 pb-20 w-full px-4 pt-4 max-w-3xl">
                {surah.id !== 1 && surah.id !== 9 && (
                    <div className="text-center py-4 text-2xl text-emerald-800 dark:text-emerald-400" style={{ fontFamily: settings.fontFamily }}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                )}
                {verses.map((verse) => (
                  <div key={verse.id} className="relative group animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900 transition-all">
                      <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-gray-700 pb-2">
                        {renderVerseNumber(verse.number)}
                        <div className="flex-1"></div>
                        <button onClick={() => handleExplain(verse)} className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="تفسير">
                          <BookOpen size={18} />
                        </button>
                      </div>
                      <p className="text-right leading-[2.5] text-gray-800 dark:text-gray-100 mb-4" style={fontStyle}>
                        {verse.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer Navigation Controls (Visible in Mushaf Mode) */}
      {settings.readingMode === 'mushaf' && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-6 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 relative">
              <button 
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 pl-4 pr-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
              >
                   <ChevronRight size={20} />
                   <span className="font-bold text-sm">السابقة</span>
              </button>

              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                   <span className="text-xs font-bold text-gray-500 dark:text-gray-400 hidden xs:inline">صفحة</span>
                   <input 
                      type="number" 
                      min="1" 
                      max="604"
                      value={currentPage}
                      onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if(!isNaN(val) && val >= 1 && val <= 604) changePage(val);
                      }}
                      className="w-10 text-center bg-transparent font-bold text-emerald-800 dark:text-emerald-300 outline-none"
                   />
                   <span className="text-xs text-gray-400">/ 604</span>
              </div>

              <button 
                  onClick={nextPage}
                  disabled={currentPage >= 604}
                  className="flex items-center gap-1 pr-4 pl-2 py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg disabled:opacity-50 hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
              >
                  <span className="font-bold text-sm">التالية</span>
                  <ChevronLeft size={20} />
              </button>
          </div>
      )}
    </div>
  );
};

export default QuranReader;