
import React, { useState, useEffect } from 'react';
import { Download, Check, Trash2, Wifi, AlertTriangle, Database, Loader2, Book, Mic, HardDrive } from 'lucide-react';
import { 
    saveFullQuranOffline, 
    checkQuranDownloaded, 
    clearOfflineData, 
    saveTafseerOffline, 
    checkTafseerDownloaded,
    clearOfflineTafseer,
    saveReciterAudioOffline,
    checkAudioDownloaded,
    clearOfflineAudio
} from '../services/offlineService';
import { AppSettings } from '../types';

interface DownloadsViewProps {
    settings: AppSettings;
}

interface DownloadItem {
    id: 'quran' | 'tafseer' | 'audio';
    title: string;
    description: string;
    size: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    isLargeFile?: boolean;
}

const DownloadsView: React.FC<DownloadsViewProps> = ({ settings }) => {
    const [status, setStatus] = useState({
        quran: false,
        tafseer: false,
        audio: false
    });
    
    const [loading, setLoading] = useState<string | null>(null); // 'quran' | 'tafseer' | 'audio'
    const [progressText, setProgressText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAllStatus();
    }, []);

    const checkAllStatus = async () => {
        const [q, t, a] = await Promise.all([
            checkQuranDownloaded(),
            checkTafseerDownloaded(),
            checkAudioDownloaded('alafasy')
        ]);
        setStatus({ quran: q, tafseer: t, audio: a });
    };

    // --- Actions ---

    const handleDownload = async (item: DownloadItem, downloadFn: (cb: (msg: string) => void) => Promise<boolean>) => {
        if (item.isLargeFile && !window.confirm(`حجم هذا الملف كبير (${item.size}). هل تود المتابعة؟ يفضل استخدام Wifi.`)) {
            return;
        }

        setLoading(item.id);
        setError(null);
        setProgressText('جاري التحضير...');
        
        const success = await downloadFn((msg) => setProgressText(msg));
        
        if (success) {
            checkAllStatus();
        } else {
            setError("حدث خطأ أثناء التحميل. تأكد من اتصالك بالإنترنت.");
        }
        setLoading(null);
    };

    const handleDelete = async (id: string, deleteFn: () => Promise<boolean>, confirmMsg: string) => {
        if (window.confirm(confirmMsg)) {
            setLoading(id);
            await deleteFn();
            await checkAllStatus();
            setLoading(null);
        }
    };

    // --- Data Definition ---

    const items: DownloadItem[] = [
        {
            id: 'quran',
            title: "المصحف الشريف (نصوص)",
            description: "قاعدة بيانات الآيات والسور والصفحات.",
            size: "~2 MB",
            icon: <Database size={24} />,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            id: 'tafseer',
            title: "التفسير الميسر",
            description: "شرح الآيات ومعاني الكلمات.",
            size: "~8 MB",
            icon: <Book size={24} />,
            colorClass: "text-amber-600 dark:text-amber-400",
            bgClass: "bg-amber-100 dark:bg-amber-900/30",
        },
        {
            id: 'audio',
            title: "تلاوة مشاري العفاسي",
            description: "المصحف المرتل كاملاً (جودة متوسطة).",
            size: "~650 MB",
            icon: <Mic size={24} />,
            colorClass: "text-purple-600 dark:text-purple-400",
            bgClass: "bg-purple-100 dark:bg-purple-900/30",
            isLargeFile: true
        }
    ];

    // --- Render Logic ---

    const getActionHandlers = (id: string) => {
        switch (id) {
            case 'quran': return {
                dl: () => handleDownload(items[0], saveFullQuranOffline),
                del: () => handleDelete('quran', clearOfflineData, "هل أنت متأكد من حذف نصوص المصحف؟")
            };
            case 'tafseer': return {
                dl: () => handleDownload(items[1], saveTafseerOffline),
                del: () => handleDelete('tafseer', clearOfflineTafseer, "هل أنت متأكد من حذف التفسير؟")
            };
            case 'audio': return {
                dl: () => handleDownload(items[2], (cb) => saveReciterAudioOffline('alafasy', cb)),
                del: () => handleDelete('audio', () => clearOfflineAudio('alafasy'), "هل أنت متأكد من حذف الملفات الصوتية؟")
            };
            default: return { dl: async () => {}, del: async () => {} };
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            {/* Storage Summary (Visual Only) */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <HardDrive size={20} className="text-emerald-100" />
                    <h3 className="font-bold text-lg">إدارة المحتوى المحلي</h3>
                </div>
                <p className="text-emerald-50 text-sm leading-relaxed opacity-90">
                    يمكنك تحميل المحتوى لتصفح التطبيق والاستماع للتلاوة دون الحاجة للاتصال بالإنترنت.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold mb-4 animate-bounce">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            {/* Items Grid */}
            <div className="grid gap-4">
                {items.map((item) => {
                    const isDownloaded = status[item.id];
                    const isLoading = loading === item.id;
                    const { dl, del } = getActionHandlers(item.id);

                    return (
                        <div 
                            key={item.id}
                            className={`relative overflow-hidden rounded-2xl p-4 md:p-5 border-2 transition-all duration-300
                                ${isDownloaded 
                                    ? 'bg-white dark:bg-gray-800 border-emerald-500/30 shadow-sm' 
                                    : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                }
                            `}
                        >
                            <div className="flex items-start gap-4 relative z-10">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bgClass} ${item.colorClass}`}>
                                    {item.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                            {item.title}
                                        </h3>
                                        {isDownloaded && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                <Check size={12} />
                                                محمل
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                                        {item.description}
                                    </p>

                                    {/* Meta Info Row */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                            {item.size}
                                        </span>
                                        {item.isLargeFile && !isDownloaded && (
                                            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                                                <Wifi size={12} />
                                                يفضل واي فاي
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-4">
                                {isLoading ? (
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg py-2 flex items-center justify-center gap-2 text-sm text-emerald-600 animate-pulse">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>{progressText || 'جاري العمل...'}</span>
                                    </div>
                                ) : (
                                    <>
                                        {isDownloaded ? (
                                            <button 
                                                onClick={del}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-bold"
                                            >
                                                <Trash2 size={16} />
                                                حذف المحتوى
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={dl}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all text-sm font-bold
                                                    ${item.id === 'audio' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                                                `}
                                            >
                                                <Download size={16} />
                                                تحميل
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Background Decoration */}
                            {isDownloaded && (
                                <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DownloadsView;
