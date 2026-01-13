import React, { useState, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { fetchQuranPage } from '../services/quranApi';
import { QuranPage, AppSettings } from '../types';

interface BookItem {
  id: string;
  title: string;
  author: string;
  type: 'pdf' | 'interactive';
  coverColor: string;
  pageCount?: number;
}

interface BooksViewProps {
    settings?: AppSettings;
}

const SAMPLE_BOOKS: BookItem[] = [
  {
    id: 'quran-kareem',
    title: 'القرآن الكريم (المصحف)',
    author: 'كلام الله',
    type: 'interactive',
    coverColor: 'bg-emerald-700',
    pageCount: 604
  }
];

const BooksView: React.FC<BooksViewProps> = ({ settings }) => {
  // Library State
  const [books, setBooks] = useState<BookItem[]>(SAMPLE_BOOKS);
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  
  // Reader State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageData, setPageData] = useState<QuranPage | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // PDF Upload State (kept for custom files)
  const [customPdf, setCustomPdf] = useState<string | null>(null);

  useEffect(() => {
    if (activeBook?.type === 'interactive') {
      loadPage(currentPage);
    }
  }, [currentPage, activeBook]);

  const loadPage = async (num: number) => {
    setLoading(true);
    try {
        const data = await fetchQuranPage(num);
        setPageData(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      setCustomPdf(fileUrl);
      setActiveBook({
        id: 'custom',
        title: file.name,
        author: 'ملف محلي',
        type: 'pdf',
        coverColor: 'bg-gray-600'
      });
    } else if (file) {
      alert("يرجى اختيار ملف PDF صالح");
    }
  };

  const closeReader = () => {
    setActiveBook(null);
    setCustomPdf(null);
    setCurrentPage(1);
    setPageData(null);
  };

  const nextPage = () => {
    if (currentPage < 604) setCurrentPage(p => p + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  // Helper to render verse number based on settings
  const renderVerseNumber = (num: number) => {
      const style = settings?.verseNumberStyle || 'circle';

      if (style === 'flower') {
          return (
            <span className="inline-grid place-items-center w-8 h-8 mx-1 align-middle relative">
                <svg viewBox="0 0 24 24" className="w-full h-full text-emerald-200 dark:text-emerald-900 absolute inset-0" fill="currentColor">
                    {/* 8-pointed star-like shape / octagram */}
                    <path d="M12 2l2.5 6h6.5l-5 4 2 6-6-4-6 4 2-6-5-4h6.5z" /> 
                </svg>
                <span className="relative z-10 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">{num.toLocaleString('ar-EG')}</span>
            </span>
          );
      }
      
      const shapeClass = style === 'square' ? 'rounded-md' : 'rounded-full';
      
      return (
        <span className={`inline-flex items-center justify-center w-8 h-8 mx-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 ${shapeClass}`}>
            {num.toLocaleString('ar-EG')}
        </span>
      );
  };

  // Helper to intelligently format Surah name
  const formatSurahName = (name: string) => {
      if (!name) return "";
      // Remove diacritics (tashkeel) to check prefix properly
      const normalized = name.replace(/[\u064B-\u065F\u0670]/g, "").trim();
      if (normalized.startsWith('سورة')) {
          return name;
      }
      return `سورة ${name}`;
  };

  // --- RENDER: READER VIEW ---
  if (activeBook) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900 flex flex-col h-screen">
        {/* Reader Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-3 flex justify-between items-center px-4">
           <button onClick={closeReader} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
             <X size={24} className="text-gray-600 dark:text-gray-300"/>
           </button>
           <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-400">{activeBook.title}</h3>
           <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Reader Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            {activeBook.type === 'pdf' && customPdf ? (
                 <iframe src={customPdf} className="w-full h-full border-none" title="PDF Viewer" />
            ) : (
                // Interactive Quran Reader
                <div className="flex-1 overflow-y-auto p-2 md:p-6 flex justify-center items-start bg-[#fdfcf5] dark:bg-[#1a1a1a]">
                    {loading ? (
                        <div className="mt-20 flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>جاري تحميل الصفحة {currentPage}...</p>
                        </div>
                    ) : pageData ? (
                        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 border-2 border-[#d4b981] p-4 md:p-8 min-h-[80vh] shadow-2xl relative rounded-sm">
                             {/* Page Decorative Borders */}
                             <div className="absolute top-2 left-2 right-2 bottom-2 border border-[#d4b981] pointer-events-none opacity-50"></div>
                             
                             {/* Page Content */}
                             <div className="text-center space-y-6" dir="rtl">
                                 {/* Check for Surah Headings */}
                                 {pageData.ayahs.map((ayah, idx) => {
                                     const isFirstAyahInSurah = ayah.number === 1;
                                     const showBasmala = isFirstAyahInSurah && ayah.surah?.id !== 1 && ayah.surah?.id !== 9;
                                     const showSurahHeader = isFirstAyahInSurah;
                                     
                                     return (
                                         <React.Fragment key={ayah.id}>
                                             {showSurahHeader && ayah.surah && (
                                                 <div className="mt-6 mb-4 border-y-2 border-[#d4b981] py-2 bg-[#fdfcf5] dark:bg-[#252525]">
                                                     <h2 className="font-quran text-2xl text-emerald-800 dark:text-emerald-400">
                                                         {formatSurahName(ayah.surah.name)}
                                                     </h2>
                                                 </div>
                                             )}
                                             {showBasmala && (
                                                 <div className="font-quran text-xl mb-2 text-gray-600 dark:text-gray-400">
                                                     بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                                 </div>
                                             )}
                                             <span 
                                                className="inline leading-[2.5] text-xl font-quran text-justify text-gray-900 dark:text-gray-100"
                                             >
                                                {ayah.text} 
                                                {renderVerseNumber(ayah.number)}
                                             </span>
                                         </React.Fragment>
                                     )
                                 })}
                             </div>
                             
                             {/* Page Number Footer */}
                             <div className="absolute bottom-1 left-0 right-0 text-center">
                                 <span className="text-xs font-bold text-gray-400">{currentPage}</span>
                             </div>
                        </div>
                    ) : (
                        <div className="mt-20 text-red-500">حدث خطأ في تحميل الصفحة</div>
                    )}
                </div>
            )}
        </div>

        {/* Reader Controls */}
        {activeBook.type === 'interactive' && (
            <div className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex justify-between items-center shadow-lg">
                <button 
                    onClick={nextPage}
                    disabled={currentPage >= 604}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg disabled:opacity-50 hover:bg-emerald-200 transition-colors"
                >
                    <ChevronRight size={20} />
                    <span>التالية</span>
                </button>

                <div className="text-sm font-bold">
                    صفحة <input 
                        type="number" 
                        min="1" 
                        max="604" 
                        value={currentPage} 
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if(val >= 1 && val <= 604) setCurrentPage(val);
                        }}
                        className="w-12 text-center border rounded mx-1 dark:bg-gray-700 dark:text-white"
                    /> / 604
                </div>

                <button 
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg disabled:opacity-50 hover:bg-emerald-200 transition-colors"
                >
                    <span>السابقة</span>
                    <ChevronLeft size={20} />
                </button>
            </div>
        )}
      </div>
    );
  }

  // --- RENDER: LIBRARY VIEW ---
  return (
    <div className="p-4 pb-24 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-lg">
            <FileText size={24} />
            </span>
            المكتبة الإسلامية
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
        {/* Pre-loaded Books */}
        {books.map(book => (
            <button 
                key={book.id}
                onClick={() => { setActiveBook(book); setCurrentPage(1); }}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
                <div className={`absolute inset-0 ${book.coverColor} p-4 flex flex-col justify-between`}>
                    <div className="w-full h-full border-2 border-white/20 rounded-lg flex flex-col items-center justify-center text-center p-2">
                        <BookOpen size={32} className="text-white/80 mb-2" />
                        <h3 className="text-white font-bold text-lg leading-tight">{book.title}</h3>
                        <p className="text-white/70 text-xs mt-2">{book.author}</p>
                    </div>
                </div>
                {/* Book Spine Effect */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/20 z-10"></div>
            </button>
        ))}

        {/* Upload New Book */}
        <label className="cursor-pointer aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-emerald-600">
            <Upload size={32} />
            <span className="text-sm font-bold">فتح ملف PDF</span>
            <span className="text-xs text-center px-2">من الجهاز</span>
            <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={handleFileUpload}
            />
        </label>
      </div>
      
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 text-blue-800 dark:text-blue-300 text-sm">
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <p>
            تمت إضافة "القرآن الكريم" إلى مكتبتك. يمكنك تصفحه الآن مطابقاً للمصحف الورقي (604 صفحة).
        </p>
      </div>
    </div>
  );
};

export default BooksView;