
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { 
  PlayCircle, 
  ChevronRight, 
  User, 
  List, 
  History, 
  CheckCircle2, 
  Play,
  Library,
  Tv,
  Loader2,
  WifiOff,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

// --- إعدادات API ---
const CUSTOM_API_URL = 'https://api.benoo.space/api/videos';
const YOUTUBE_API_KEY = ''; 

interface StoriesViewProps {
  settings: AppSettings;
}

interface Episode {
    title: string;
    index: number; // 0-based index
    videoId?: string; // YouTube ID (Optional - only for YouTube series)
    videoUrl?: string; // Direct URL (For Minio/S3)
    description?: string;
}

interface Series {
    id: string;
    sheikh: string;
    title: string;
    playlistId?: string; // Optional
    description: string;
    category: 'prophets' | 'fatwa' | 'seerah';
    color: string;
    episodes: Episode[]; 
    fetched?: boolean;
    sourceType: 'custom_api' | 'youtube_playlist' | 'static';
}

// --- DATA CONFIGURATION ---

const INITIAL_SERIES_DATA: Series[] = [
    {
        id: 'othman_prophets',
        sheikh: "د. عثمان الخميس",
        title: "قصص الأنبياء (السلسلة الكاملة)",
        description: "شرح مفصل لقصص الأنبياء والرسل والأمم السابقة، من سيرفر المنصة الخاص.",
        category: 'prophets',
        color: "from-amber-600 to-orange-700",
        episodes: [], // Will be fetched from API
        sourceType: 'custom_api'
    },
    {
        id: 'nabil_stories',
        sheikh: "الشيخ نبيل العوضي",
        title: "روائع القصص",
        description: "مجموعة من القصص المؤثرة من القرآن والسنة والتاريخ الإسلامي بأسلوب وعظي شيق.",
        playlistId: "PL228189D310C7351C", 
        category: 'prophets',
        color: "from-emerald-600 to-teal-700",
        episodes: Array.from({ length: 30 }, (_, i) => ({ index: i, title: `روائع القصص - الحلقة ${i + 1}` })),
        sourceType: 'youtube_playlist'
    },
    {
        id: 'bin_baz_fatwa',
        sheikh: "الشيخ ابن باز (رحمه الله)",
        title: "فتاوى نور على الدرب",
        description: "إجابات فقهية وعقدية لأهم تساؤلات المسلم.",
        playlistId: "PL98159C24018F08C6",
        category: 'fatwa',
        color: "from-slate-600 to-slate-800",
        episodes: Array.from({ length: 20 }, (_, i) => ({ index: i, title: `فتوى مختارة ${i + 1}` })),
        sourceType: 'youtube_playlist'
    }
];

// --- HELPER: Fetch Custom API Videos (Minio S3) ---
const fetchCustomVideos = async (): Promise<Episode[]> => {
    try {
        const response = await fetch(CUSTOM_API_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        console.log("Fetched Videos Data:", data); // DEBUG log
        
        // Ensure data is an array
        const items = Array.isArray(data) ? data : (data.videos || data.data || []);
        
        return items.map((item: any, index: number) => {
            // Map fields from Minio/S3 API
            let url = item.url || item.videoUrl || item.link || item.video_url || item.file || item.source;
            const title = item.title || item.name || item.videoTitle || `الحلقة ${index + 1}`;
            
            // Clean URL if present
            if (url && typeof url === 'string') {
                url = url.trim();
                try {
                    // Decode first to prevent double-encoding if the API returns mixed states
                    // Then Encode URI to ensure spaces/Arabic chars are valid for src
                    url = encodeURI(decodeURI(url));
                } catch (e) {
                    console.warn("Failed to parse URI:", url);
                    // Fallback to simple encoding if decode fails
                    try { url = encodeURI(url); } catch (e2) {}
                }
            }

            return {
                index: index,
                title: title,
                videoUrl: url,
                description: item.description || ''
            };
        });
    } catch (error) {
        console.error("Custom API Fetch Error:", error);
        return [];
    }
};

// --- HELPER: Fetch Playlist Items (YouTube Fallback) ---
const fetchPlaylistItems = async (playlistId: string): Promise<Episode[] | null> => {
    if (!YOUTUBE_API_KEY) return null;

    let allItems: Episode[] = [];
    let pageToken = '';
    
    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&pageToken=${pageToken}`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.error) return null;
            
            const pageItems = data.items.map((item: any) => ({
                title: item.snippet.title,
                index: item.snippet.position,
                videoId: item.snippet.resourceId.videoId
            }));
            
            allItems = [...allItems, ...pageItems];
            pageToken = data.nextPageToken;
        } while (pageToken);
        
        return allItems.sort((a, b) => a.index - b.index);
    } catch (err) {
        return null;
    }
};

const StoriesView: React.FC<StoriesViewProps> = ({ settings }) => {
  const [seriesList, setSeriesList] = useState<Series[]>(INITIAL_SERIES_DATA);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [savedProgress, setSavedProgress] = useState<Record<string, number>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [videoError, setVideoError] = useState(false);

  // Video Ref for Direct Playback
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load progress on mount
  useEffect(() => {
      const loaded: Record<string, number> = {};
      seriesList.forEach(s => {
          const saved = localStorage.getItem(`series_progress_${s.id}`);
          if (saved) loaded[s.id] = parseInt(saved);
      });
      setSavedProgress(loaded);

      if (typeof window !== 'undefined') {
          setOrigin(window.location.origin);
      }
  }, []); 

  const handleSeriesSelect = async (series: Series) => {
      setSelectedSeries(series);
      setFetchError(null);
      setVideoError(false);
      
      const lastIndex = savedProgress[series.id] || 0;
      setCurrentEpisodeIndex(lastIndex);

      // Fetch if not fetched yet
      if (!series.fetched) {
          setIsFetching(true);
          let episodes: Episode[] | null = [];

          if (series.sourceType === 'custom_api') {
              episodes = await fetchCustomVideos();
          } else if (series.sourceType === 'youtube_playlist' && series.playlistId) {
              episodes = await fetchPlaylistItems(series.playlistId);
          } else {
              // Static data fallback or already populated
              episodes = series.episodes;
          }

          setIsFetching(false);

          if (episodes && episodes.length > 0) {
              const updatedSeries = { ...series, episodes, fetched: true };
              setSelectedSeries(updatedSeries);
              setSeriesList(prev => prev.map(s => s.id === series.id ? updatedSeries : s));
          } else if (series.sourceType === 'custom_api') {
              setFetchError("تعذر الاتصال بالسيرفر لجلب الحلقات. يرجى التحقق من الإنترنت.");
          }
      }
  };

  const handleEpisodeChange = (seriesId: string, index: number) => {
      setCurrentEpisodeIndex(index);
      setVideoError(false);
      localStorage.setItem(`series_progress_${seriesId}`, index.toString());
      setSavedProgress(prev => ({ ...prev, [seriesId]: index }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
      setSelectedSeries(null);
      setFetchError(null);
      setVideoError(false);
  };

  // --- RENDER: PLAYER VIEW ---
  if (selectedSeries) {
      const currentEp = selectedSeries.episodes[currentEpisodeIndex];
      const hasEpisodes = selectedSeries.episodes.length > 0;
      
      // Determine Player Source
      const isCustomSource = selectedSeries.sourceType === 'custom_api';
      // Fallback logic for mixed content if needed
      const isYouTube = !isCustomSource && (!!currentEp?.videoId || (currentEp?.videoUrl && currentEp.videoUrl.includes('youtu')));

      // YouTube Embed Construction
      let embedBase = `https://www.youtube.com/embed/`;
      let params = `autoplay=1&rel=0&playsinline=1&modestbranding=1&showinfo=0`;
      if (origin) params += `&origin=${encodeURIComponent(origin)}`;

      let embedUrl = "";
      if (isYouTube) {
        if (currentEp?.videoId) {
            embedUrl = `${embedBase}${currentEp.videoId}?${params}`;
        } else if (selectedSeries.playlistId) {
            embedUrl = `${embedBase}videoseries?list=${selectedSeries.playlistId}&index=${currentEpisodeIndex}&${params}`;
        }
      }

      // External Link fallback
      const externalLink = currentEp?.videoUrl || 
          (currentEp?.videoId ? `https://www.youtube.com/watch?v=${currentEp.videoId}` : null);

      return (
          <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900 animate-in slide-in-from-bottom-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 shadow-sm z-10">
                  <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <ChevronRight size={24} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
                  </button>
                  <div className="flex-1">
                      <h2 className="font-bold text-gray-800 dark:text-white leading-tight">{selectedSeries.title}</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedSeries.sheikh}</p>
                  </div>
              </div>

              {/* Player Area */}
              <div className="w-full aspect-video bg-black sticky top-0 z-20 shadow-lg relative group flex items-center justify-center overflow-hidden">
                  {isFetching ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                          <Loader2 size={40} className="animate-spin mb-2" />
                          <p className="text-sm">جاري جلب الحلقات...</p>
                      </div>
                  ) : fetchError ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 p-4 text-center">
                          <AlertCircle size={40} className="mb-2 text-red-400" />
                          <p className="text-sm">{fetchError}</p>
                          <button onClick={() => handleSeriesSelect(selectedSeries)} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs">
                              إعادة المحاولة
                          </button>
                      </div>
                  ) : hasEpisodes ? (
                      <>
                        {isCustomSource ? (
                            currentEp?.videoUrl ? (
                                <video 
                                    ref={videoRef}
                                    key={currentEp.videoUrl} // Force re-mount on URL change
                                    src={currentEp.videoUrl} 
                                    controls 
                                    autoPlay 
                                    playsInline 
                                    preload="auto"
                                    className="w-full h-full object-contain bg-black"
                                    onError={(e) => {
                                        const err = e.currentTarget.error;
                                        // Log minimal info
                                        console.error(`Video Error: code=${err?.code}, message='${err?.message}', src='${currentEp.videoUrl}'`);
                                        setVideoError(true);
                                    }}
                                >
                                    <p className="text-white text-center">المتصفح لا يدعم عرض هذا الفيديو.</p>
                                </video>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                                    <AlertCircle size={32} className="mb-2 opacity-50"/>
                                    <p className="text-sm">رابط الفيديو غير متوفر</p>
                                </div>
                            )
                        ) : (
                            <iframe 
                                key={currentEpisodeIndex} 
                                className="w-full h-full"
                                src={embedUrl}
                                title={selectedSeries.title}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                referrerPolicy="no-referrer"
                            ></iframe>
                        )}
                        
                        {/* Error Overlay for Video Tag */}
                        {isCustomSource && videoError && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-30 p-4 text-center">
                                <AlertCircle size={32} className="text-red-500 mb-2" />
                                <p className="text-sm mb-2 font-bold">تعذر تشغيل الفيديو (Error {videoRef.current?.error?.code || 'Unknown'})</p>
                                <p className="text-xs text-gray-400 mb-4 break-all px-4">{currentEp?.videoUrl}</p>
                                <a 
                                    href={currentEp?.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-xs flex items-center gap-2"
                                >
                                    <ExternalLink size={14} />
                                    فتح الرابط المباشر
                                </a>
                            </div>
                        )}
                      </>
                  ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/50">
                          <p>لا توجد حلقات متاحة</p>
                      </div>
                  )}
              </div>

              {/* Info & List */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                   <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                             {hasEpisodes ? `الحلقة: ${currentEpisodeIndex + 1}` : ''}
                        </span>
                        <div className="flex items-center gap-2">
                            {isFetching && <Loader2 size={14} className="animate-spin text-emerald-500" />}
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-400">
                                {selectedSeries.episodes.length} حلقة
                            </span>
                        </div>
                   </div>
                   <h3 className="text-lg font-bold dark:text-white leading-snug">
                       {currentEp?.title || '...'}
                   </h3>
                   {currentEp?.description && (
                       <p className="text-xs text-gray-500 mt-2 line-clamp-2">{currentEp.description}</p>
                   )}
              </div>

              {/* Playlist */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-2 pb-24">
                      {selectedSeries.episodes.map((ep, idx) => {
                          const safeIndex = ep.index !== undefined ? ep.index : idx;
                          const isActive = safeIndex === currentEpisodeIndex;
                          const isWatched = (savedProgress[selectedSeries.id] || -1) > safeIndex;

                          return (
                              <button
                                  key={idx}
                                  onClick={() => handleEpisodeChange(selectedSeries.id, safeIndex)}
                                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-right transition-all duration-200 border
                                      ${isActive 
                                          ? 'bg-white dark:bg-gray-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md transform scale-[1.01]' 
                                          : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                      }
                                  `}
                              >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors
                                      ${isActive 
                                          ? 'bg-emerald-100 text-emerald-600' 
                                          : isWatched 
                                            ? 'bg-emerald-50 text-emerald-400 dark:bg-gray-700 dark:text-gray-500' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                      }`}
                                  >
                                      {isActive ? <Play size={20} fill="currentColor" /> : (isWatched ? <CheckCircle2 size={20} /> : <span className="font-bold font-mono text-sm">{safeIndex + 1}</span>)}
                                  </div>
                                  
                                  <div className="flex-1">
                                      <p className={`font-bold text-sm ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                          {ep.title}
                                      </p>
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: MAIN SERIES LIST ---
  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto space-y-6">
       <header>
            <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 font-quran mb-1">المكتبة المرئية</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">سلاسل علمية وقصصية مختارة لأهل العلم</p>
       </header>

       <div className="grid gap-4 md:grid-cols-2">
           {seriesList.map((series) => {
               const progress = savedProgress[series.id];
               const hasProgress = progress !== undefined && progress > 0;

               return (
                   <button 
                       key={series.id}
                       onClick={() => handleSeriesSelect(series)}
                       className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all text-right border border-transparent hover:border-emerald-500/30"
                   >
                       <div className={`h-24 bg-gradient-to-r ${series.color} p-4 flex items-start justify-between relative`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg text-white">
                                {series.category === 'prophets' ? <Library size={24} /> : <Tv size={24} />}
                            </div>
                            {hasProgress && (
                                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                                    <History size={12} />
                                    <span>تابع الحلقة {progress + 1}</span>
                                </div>
                            )}
                       </div>

                       <div className="p-5 pt-12 relative">
                            <div className="absolute -top-10 right-5 w-20 h-20 rounded-2xl bg-white dark:bg-gray-700 shadow-lg p-1 flex items-center justify-center">
                                 <div className="w-full h-full bg-gray-100 dark:bg-gray-600 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden">
                                     <User size={40} />
                                 </div>
                            </div>

                            <div className="mt-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                    {series.title}
                                </h3>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                    {series.sheikh}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 h-8">
                                    {series.description}
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <List size={14} />
                                    {series.episodes.length > 0 ? `${series.episodes.length} مقطع` : (series.sourceType === 'custom_api' ? 'تحميل تلقائي' : '..')}
                                </span>
                                <span className="flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform text-emerald-600 font-bold">
                                    مشاهدة السلسلة
                                    <ChevronRight size={14} className="rtl:rotate-180" />
                                </span>
                            </div>
                       </div>
                   </button>
               )
           })}
       </div>
    </div>
  );
};

export default StoriesView;
