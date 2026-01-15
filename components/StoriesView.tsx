
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
  AlertCircle,
  Download,
  DownloadCloud,
  Check
} from 'lucide-react';

// --- إعدادات API ---
const API_URL_OTHMAN = 'https://api.benoo.space/api/list/coran-videos';
const API_URL_NABIL = 'https://api.benoo.space/api/list/awad-video';
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
    apiUrl?: string; // Optional - For custom APIs
    description: string;
    category: 'prophets' | 'fatwa' | 'seerah';
    color: string;
    imageUrl?: string; // New: Image for the Sheikh
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
        imageUrl: "https://drive.google.com/thumbnail?id=1I49EvTL9D9iiAK3A4GmCBEH4uYBgDRVj&sz=w1000",
        episodes: [], // Will be fetched from API
        sourceType: 'custom_api',
        apiUrl: API_URL_OTHMAN
    },
    {
        id: 'nabil_stories',
        sheikh: "الشيخ نبيل العوضي",
        title: "روائع القصص",
        description: "مجموعة من القصص المؤثرة من القرآن والسنة والتاريخ الإسلامي بأسلوب وعظي شيق.",
        category: 'prophets',
        color: "from-emerald-600 to-teal-700",
        // Using thumbnail endpoint for better reliability with Google Drive images
        imageUrl: "https://drive.google.com/thumbnail?id=1svL48NK9viJEGzOAaT0ha8x7aJG9zwN4&sz=w1000",
        episodes: [], // Will be fetched from API
        sourceType: 'custom_api',
        apiUrl: API_URL_NABIL
    }
];

// --- HELPER: Fetch Custom API Videos (Minio S3) ---
const fetchCustomVideos = async (url: string): Promise<Episode[]> => {
    if (!url) return [];
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} for ${url}`);
            throw new Error(`Network response was not ok (${response.status})`);
        }
        
        const data = await response.json();
        console.log(`Fetched Data from ${url}:`, data); 
        
        // Handle different API structures (Array root or Object with data/videos property)
        const items = Array.isArray(data) ? data : (data.videos || data.data || []);
        
        if (!Array.isArray(items)) {
            console.warn("API returned unexpected format:", data);
            return [];
        }

        return items.map((item: any, index: number) => {
            // Flexible property matching for different API responses
            let url = item.url || item.videoUrl || item.link || item.video_url || item.file || item.source;
            let title = item.title || item.name || item.videoTitle || `الحلقة ${index + 1}`;
            
            // Clean URL
            if (url && typeof url === 'string') {
                url = url.trim();
                try {
                    // Fix double encoded URLs if present
                    if (url.includes('%')) {
                        url = encodeURI(decodeURI(url));
                    } else {
                        url = encodeURI(url);
                    }
                } catch (e) {
                    console.warn("Failed to parse URI:", url);
                }
            }

            // Clean Title (Remove extension)
            if (typeof title === 'string') {
                // Remove .mp4, .mkv, etc. (case insensitive)
                title = title.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '');
                
                // If the title looks like a raw filename (contains underscores but no spaces), clean it
                if (!title.includes(' ') && title.includes('_')) {
                    title = title.replace(/_/g, ' ');
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
        throw error; // Re-throw to be caught by the UI handler
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
  
  // Video Playback Progress State (Percentage for UI)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});

  // Image Load Error State
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  // Download States
  const [downloadStatus, setDownloadStatus] = useState<Record<number, 'loading' | 'success' | 'error' | 'idle'>>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
      // Load series progress (last watched episode index)
      const loaded: Record<string, number> = {};
      seriesList.forEach(s => {
          const saved = localStorage.getItem(`series_progress_${s.id}`);
          if (saved) loaded[s.id] = parseInt(saved);
      });
      setSavedProgress(loaded);

      // Load specific video progress percentages for UI
      // We scan localStorage keys that match our pattern
      const progressMap: Record<string, number> = {};
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('vid_meta_')) {
              // vid_meta key stores JSON { currentTime, duration }
              try {
                  const raw = localStorage.getItem(key);
                  if (raw) {
                      const data = JSON.parse(raw);
                      if (data.duration > 0) {
                          const id = key.replace('vid_meta_', '');
                          progressMap[id] = (data.currentTime / data.duration) * 100;
                      }
                  }
              } catch (e) {
                  console.error("Error parsing video meta", e);
              }
          }
      }
      setPlaybackProgress(progressMap);

      if (typeof window !== 'undefined') {
          setOrigin(window.location.origin);
      }
  }, []); 

  const handleSeriesSelect = async (series: Series) => {
      setSelectedSeries(series);
      setFetchError(null);
      setVideoError(false);
      setDownloadStatus({});
      setIsDownloadingAll(false);
      
      const lastIndex = savedProgress[series.id] || 0;
      setCurrentEpisodeIndex(lastIndex);

      if (!series.fetched) {
          setIsFetching(true);
          let episodes: Episode[] | null = [];

          try {
            if (series.sourceType === 'custom_api' && series.apiUrl) {
                episodes = await fetchCustomVideos(series.apiUrl);
            } else if (series.sourceType === 'youtube_playlist' && series.playlistId) {
                episodes = await fetchPlaylistItems(series.playlistId);
            } else {
                episodes = series.episodes;
            }

            if (episodes && episodes.length > 0) {
                const updatedSeries = { ...series, episodes, fetched: true };
                setSelectedSeries(updatedSeries);
                setSeriesList(prev => prev.map(s => s.id === series.id ? updatedSeries : s));
            } else if (series.sourceType === 'custom_api') {
                setFetchError("لم يتم العثور على حلقات في المصدر.");
            }
          } catch (err) {
              setFetchError("تعذر الاتصال بالسيرفر لجلب الحلقات. يرجى التحقق من الإنترنت أو المحاولة لاحقاً.");
          } finally {
             setIsFetching(false);
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

  // --- PROGRESS HELPERS ---
  const getProgressKey = (seriesId: string, episodeIndex: number) => {
      return `vid_time_${seriesId}_${episodeIndex}`;
  };
  
  const getMetaKey = (seriesId: string, episodeIndex: number) => {
      return `vid_meta_${seriesId}_${episodeIndex}`;
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      if (!selectedSeries) return;
      
      const video = e.currentTarget;
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      // Save every 2 seconds roughly
      if (currentTime > 0 && !video.paused) {
           const timeKey = getProgressKey(selectedSeries.id, currentEpisodeIndex);
           localStorage.setItem(timeKey, currentTime.toString());

           // Save metadata for UI percentage (less frequent updates ideally, but we do it here for simplicity)
           if (duration > 0 && Math.floor(currentTime) % 5 === 0) {
               const metaKey = getMetaKey(selectedSeries.id, currentEpisodeIndex);
               const percent = (currentTime / duration) * 100;
               localStorage.setItem(metaKey, JSON.stringify({ currentTime, duration }));
               
               // Update state for UI
               const uniqueId = `${selectedSeries.id}_${currentEpisodeIndex}`;
               setPlaybackProgress(prev => ({ ...prev, [uniqueId]: percent }));
           }
      }
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      if (!selectedSeries) return;
      
      const video = e.currentTarget;
      const timeKey = getProgressKey(selectedSeries.id, currentEpisodeIndex);
      const savedTime = localStorage.getItem(timeKey);
      
      if (savedTime) {
          const time = parseFloat(savedTime);
          // Only restore if valid and not at the very end
          if (time > 0 && time < video.duration - 5) {
              video.currentTime = time;
          }
      }
  };

  // --- DOWNLOAD LOGIC ---
  const downloadVideo = async (episode: Episode) => {
      if (!episode.videoUrl) return;

      setDownloadStatus(prev => ({...prev, [episode.index]: 'loading'}));
      
      try {
          const response = await fetch(episode.videoUrl);
          if (!response.ok) throw new Error('Download failed');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // Sanitize title for filename
          const safeTitle = episode.title.replace(/[^a-z0-9\u0600-\u06FF\s-]/gi, '_');
          a.download = `${safeTitle}.mp4`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          
          setDownloadStatus(prev => ({...prev, [episode.index]: 'success'}));
          setTimeout(() => {
               setDownloadStatus(prev => ({...prev, [episode.index]: 'idle'}));
          }, 3000);
      } catch (e) {
          console.error("Blob download failed, fallback to direct link", e);
          setDownloadStatus(prev => ({...prev, [episode.index]: 'error'}));
          // Fallback: Try opening in new tab
          window.open(episode.videoUrl, '_blank');
          setTimeout(() => {
               setDownloadStatus(prev => ({...prev, [episode.index]: 'idle'}));
          }, 3000);
      }
  };

  const downloadAll = async () => {
      if (!selectedSeries || selectedSeries.episodes.length === 0) return;
      
      const count = selectedSeries.episodes.length;
      if (!window.confirm(`هل أنت متأكد من تحميل السلسلة كاملة (${count} حلقة)؟\nقد يستهلك هذا كمية كبيرة من البيانات.`)) return;

      setIsDownloadingAll(true);

      // Process sequentially to avoid browser crash/network choke
      for (const ep of selectedSeries.episodes) {
          // Skip if already downloading or failed
          if (downloadStatus[ep.index] === 'loading') continue;
          
          await downloadVideo(ep);
          // Small delay between downloads
          await new Promise(r => setTimeout(r, 1000));
      }
      
      setIsDownloadingAll(false);
      alert("اكتملت عملية التحميل.");
  };

  // --- RENDER ---
  if (selectedSeries) {
      const currentEp = selectedSeries.episodes[currentEpisodeIndex];
      const hasEpisodes = selectedSeries.episodes.length > 0;
      
      const isCustomSource = selectedSeries.sourceType === 'custom_api';
      const isYouTube = !isCustomSource && (!!currentEp?.videoId || (currentEp?.videoUrl && currentEp.videoUrl.includes('youtu')));

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
                  {/* Download All Button (Only for Custom API) */}
                  {isCustomSource && hasEpisodes && (
                      <button 
                        onClick={downloadAll}
                        disabled={isDownloadingAll}
                        className={`p-2 rounded-full transition-all flex items-center gap-2 px-3
                            ${isDownloadingAll 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                        title="تحميل السلسلة كاملة"
                      >
                           {isDownloadingAll ? <Loader2 size={18} className="animate-spin"/> : <DownloadCloud size={18} />}
                           <span className="text-xs font-bold hidden md:inline">
                               {isDownloadingAll ? 'جاري التحميل..' : 'تحميل الكل'}
                           </span>
                      </button>
                  )}
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
                                    key={currentEp.videoUrl} 
                                    src={currentEp.videoUrl} 
                                    controls 
                                    autoPlay 
                                    playsInline 
                                    preload="auto"
                                    className="w-full h-full object-contain bg-black"
                                    onTimeUpdate={handleVideoTimeUpdate}
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    onError={(e) => {
                                        const err = e.currentTarget.error;
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
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-2 pb-24">
                      {selectedSeries.episodes.map((ep, idx) => {
                          const safeIndex = ep.index !== undefined ? ep.index : idx;
                          const isActive = safeIndex === currentEpisodeIndex;
                          const isWatched = (savedProgress[selectedSeries.id] || -1) > safeIndex;
                          const dlStatus = downloadStatus[safeIndex];
                          
                          // Progress Bar Logic
                          const uniqueId = `${selectedSeries.id}_${safeIndex}`;
                          const progressPercent = playbackProgress[uniqueId] || 0;

                          return (
                              <div key={idx} className="flex gap-2 w-full">
                                  {/* Episode Button */}
                                  <button
                                      onClick={() => handleEpisodeChange(selectedSeries.id, safeIndex)}
                                      className={`flex-1 flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 border relative overflow-hidden
                                          ${isActive 
                                              ? 'bg-white dark:bg-gray-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md' 
                                              : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                          }
                                      `}
                                  >
                                      {/* Progress Bar Background */}
                                      {progressPercent > 0 && progressPercent < 98 && !isActive && (
                                           <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
                                               <div className="h-full bg-emerald-500/50" style={{ width: `${progressPercent}%` }}></div>
                                           </div>
                                      )}

                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors z-10
                                          ${isActive 
                                              ? 'bg-emerald-100 text-emerald-600' 
                                              : isWatched 
                                                ? 'bg-emerald-50 text-emerald-400 dark:bg-gray-700 dark:text-gray-500' 
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                          }`}
                                      >
                                          {isActive ? <Play size={20} fill="currentColor" /> : (isWatched ? <CheckCircle2 size={20} /> : <span className="font-bold font-mono text-sm">{safeIndex + 1}</span>)}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0 z-10">
                                          <p className={`font-bold text-sm leading-relaxed ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                              {ep.title}
                                          </p>
                                          {progressPercent > 0 && progressPercent < 98 && (
                                              <p className="text-[10px] text-gray-400 mt-1">
                                                  أكملت {Math.round(progressPercent)}%
                                              </p>
                                          )}
                                      </div>
                                  </button>

                                  {/* Download Button (Only Custom Source) */}
                                  {isCustomSource && (
                                      <button 
                                        onClick={() => downloadVideo(ep)}
                                        disabled={dlStatus === 'loading'}
                                        className={`w-14 rounded-xl flex items-center justify-center transition-all border shrink-0
                                            ${dlStatus === 'success' 
                                                ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                                                : dlStatus === 'loading'
                                                ? 'bg-gray-50 border-gray-200'
                                                : 'bg-white dark:bg-gray-800 text-gray-400 border-transparent hover:text-emerald-600 hover:bg-gray-50'
                                            }
                                        `}
                                      >
                                          {dlStatus === 'loading' ? (
                                              <Loader2 size={20} className="animate-spin text-emerald-500"/>
                                          ) : dlStatus === 'success' ? (
                                              <Check size={20} />
                                          ) : dlStatus === 'error' ? (
                                              <AlertCircle size={20} className="text-red-500" />
                                          ) : (
                                              <Download size={20} />
                                          )}
                                      </button>
                                  )}
                              </div>
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
                                     {series.imageUrl && !imageError[series.id] ? (
                                         <img 
                                            src={series.imageUrl} 
                                            alt={series.sheikh} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            onError={() => setImageError(prev => ({ ...prev, [series.id]: true }))}
                                         />
                                     ) : (
                                         <User size={40} />
                                     )}
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
