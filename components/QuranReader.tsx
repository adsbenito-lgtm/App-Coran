import React, { useState, useEffect, useRef } from 'react';
import { Surah, Verse, AppSettings, QuranPage } from '../types';
import { ChevronRight, ChevronLeft, BookOpen, RotateCw, X, Search } from 'lucide-react';
import { getTafseer } from '../services/geminiService';
import { fetchSurahVerses, fetchQuranPage } from '../services/quranApi';

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
  // Use initialPage if provided, otherwise default to surah start
  const [currentPage, setCurrentPage] = useState<number>(initialPage || surah.startPage);
  const [pageMetadata, setPageMetadata] = useState<QuranPage | null>(null);
  
  // Animation State
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  
  // Touch State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // List-based State (List Mode)
  const [verses, setVerses] = useState<Verse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPageImage = (pageNum: number) => {
      const padded = String(pageNum).padStart(3, '0');
      return `https://www.mp3quran.net/api/quran_pages_svg/${padded}.svg`;
  };

  // Preload Next/Prev Images
  useEffect(() => {
    if (settings.readingMode === 'mushaf') {
        const preload = (p: number) => {
            if (p >= 1 && p <= 604) {
                const img = new Image();
                img.src = getPageImage(p);
            }
        };
        preload(currentPage + 1);
        preload(currentPage - 1);
    }
  }, [currentPage, settings.readingMode]);

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
           setImageLoaded(false);
           // Fetch Metadata without blocking UI severely
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
  // This ensures if the user clicks a different Surah from the dashboard resume button, it updates
  useEffect(() => {
      setCurrentPage(initialPage || surah.startPage);
  }, [initialPage, surah.id, surah.startPage]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (settings.readingMode !== 'mushaf') return;
        if (e.key === 'ArrowRight') nextPage(); // Right Arrow -> Next Page (Logic depends on RTL expectation, but typically Next)
        if (e.key === 'ArrowLeft') prevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, settings.readingMode]);

  const handleExplain = async (verse: Verse) => {
    if (tafseerData[verse.id]) {
      setActiveVerseId(activeVerseId === verse.id ? null : verse.id);
      return;
    }

    setLoadingTafseer(verse.id);
    setActiveVerseId(verse.id); 
    
    const sName = verse.surah?.name || surah.name;
    const explanation = await getTafseer(sName, verse.number, verse.text);
    
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

          // Immediate update for responsiveness
          setCurrentPage(newPage);
          
          // Animation cleanup
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

    // In RTL/Carousel logic:
    // Swipe Left (drag finger left) -> Content moves left -> Next Page comes from right
    if (isLeftSwipe) {
         if (currentPage < 604) nextPage();
    }
    // Swipe Right (drag finger right) -> Prev Page
    if (isRightSwipe) {
         if (currentPage > 1) prevPage();
    }
  };

  const fontStyle = { 
    fontSize: `${18 + settings.fontSize * 4}px`,
    fontFamily: settings.fontFamily
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
                        {pageMetadata ? `سورة ${Object.values(pageMetadata.surahs)[0]?.name || surah.name}` : surah.name}
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
         <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={() => setActiveVerseId(null)}></div>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl p-6 pointer-events-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
               <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
               <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full text-emerald-700 dark:text-emerald-300">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="font-bold text-lg">التفسير الميسر</h3>
                  <button onClick={() => setActiveVerseId(null)} className="mr-auto p-1 text-gray-400 hover:text-red-500"><X size={20}/></button>
               </div>
               {loadingTafseer === activeVerseId ? (
                  <div className="flex flex-col items-center py-8">
                     <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-gray-500">جاري استدعاء التفسير بالذكاء الاصطناعي...</p>
                  </div>
               ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-[50vh] overflow-y-auto p-2">
                    <p className="whitespace-pre-line leading-loose text-lg text-gray-700 dark:text-gray-200">
                      {tafseerData[activeVerseId]}
                    </p>
                  </div>
               )}
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
        {loading && settings.readingMode === 'list' ? (
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
            {/* --- MUSHAF MODE (IMAGES) --- */}
            {settings.readingMode === 'mushaf' && (
              <div className={`w-full max-w-2xl transition-all duration-300 ${isFlipping ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                  <div className="bg-[#fffbf2] dark:bg-[#1a1a1a] shadow-2xl relative min-h-[calc(100vh-8rem)] flex items-center justify-center book-page">
                       
                       {/* Binding/Spine Effect */}
                       <div className="absolute top-0 right-0 bottom-0 w-6 md:w-10 book-spine-shadow z-20 pointer-events-none mix-blend-multiply dark:mix-blend-normal dark:bg-black/40"></div>
                       <div className="absolute top-0 left-0 bottom-0 w-1 bg-black/5 z-10"></div>

                       {/* The Quran Page Image */}
                       <div className="w-full h-full p-0 md:p-1 relative flex items-center justify-center">
                           {!imageLoaded && (
                               <div className="absolute inset-0 flex items-center justify-center bg-[#fffbf2] dark:bg-[#1a1a1a] z-0">
                                   <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                               </div>
                           )}
                           <img 
                               src={getPageImage(currentPage)} 
                               alt={`Quran Page ${currentPage}`}
                               className={`max-w-full max-h-[82vh] object-contain z-10 transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                               onLoad={() => setImageLoaded(true)}
                               onError={(e) => {
                                   // Fallback if SVG fails
                                   (e.target as HTMLImageElement).src = `https://surahquran.com/img/pages/page_${String(currentPage).padStart(3, '0')}.png`;
                                   setImageLoaded(true);
                               }}
                           />
                       </div>
                       
                       {/* Page Number Overlay (if image doesn't cover) */}
                       <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-mono opacity-50">
                            {currentPage}
                       </div>
                  </div>
              </div>
            )}

            {/* --- LIST MODE (TEXT) --- */}
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
                        <span className="w-8 h-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-bold font-quran">
                          {verse.number.toLocaleString('ar-EG')}
                        </span>
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
      
      {/* Footer Navigation Controls */}
      {settings.readingMode === 'mushaf' && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-6 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 relative">
              {/* Previous Button (Right Side in RTL context usually means going back, but visually we want Next on Left and Prev on Right for progress?) 
                  In Arabic: Next (التالية) usually pushes content, Prev (السابقة) returns. 
                  Let's use logical ordering:
                  Right Button: Previous Page (Backwards)
                  Left Button: Next Page (Forwards)
              */}
              
              <button 
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 pl-4 pr-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
              >
                   <ChevronRight size={20} />
                   <span className="font-bold text-sm">السابقة</span>
              </button>

              {/* Page Jumper */}
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