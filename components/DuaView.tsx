import React, { useState } from 'react';
import { Zikr, AzkarCategory, AppSettings } from '../types';
import { Repeat, CheckCircle } from 'lucide-react';

const MOCK_AZKAR: AzkarCategory[] = [
  {
    id: 1,
    title: "أذكار الصباح",
    items: [
      { id: 1, text: "أَصْـبَحْنا وَأَصْـبَحَ المُـلْكُ لله وَالحَمدُ لله ، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ...", count: 3 },
      { id: 2, text: "اللّهُمَّ بِكَ أَصْبَحْنا وَبِكَ أَمْسَينا ، وَبِكَ نَحْيا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُور.", count: 1 }
    ]
  },
  {
    id: 2,
    title: "أذكار المساء",
    items: [
      { id: 3, text: "أَمْسَيْنا وَأَمْسَى المُـلْكُ لله وَالحَمدُ لله...", count: 3 }
    ]
  },
  {
    id: 3,
    title: "أدعية قرآنية",
    items: [
        { id: 4, text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", count: 1}
    ]
  }
];

const DuaView: React.FC<{ settings: AppSettings }> = ({ settings }) => {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [counts, setCounts] = useState<Record<string, number>>({});

    const handleCount = (catId: number, zikrId: number, target: number) => {
        const key = `${catId}-${zikrId}`;
        const current = counts[key] || 0;
        if (current < target) {
            setCounts(prev => ({ ...prev, [key]: current + 1 }));
        }
    };

    if (activeCategory !== null) {
        const category = MOCK_AZKAR.find(c => c.id === activeCategory);
        if (!category) return null;

        return (
            <div className="pb-24">
                <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20 p-4 border-b dark:border-gray-800 flex items-center gap-2">
                     <button onClick={() => setActiveCategory(null)} className="text-sm font-bold text-emerald-600">
                        &larr; العودة
                     </button>
                     <h2 className="text-lg font-bold flex-1 text-center">{category.title}</h2>
                     <div className="w-10"></div>
                </div>

                <div className="p-4 space-y-4">
                    {category.items.map(zikr => {
                        const key = `${category.id}-${zikr.id}`;
                        const current = counts[key] || 0;
                        const isDone = current >= zikr.count;
                        const percent = (current / zikr.count) * 100;

                        return (
                            <div 
                                key={zikr.id} 
                                onClick={() => handleCount(category.id, zikr.id, zikr.count)}
                                className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 transition-all cursor-pointer select-none ${isDone ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-transparent active:scale-[0.98]'}`}
                            >
                                {/* Progress Bar Background */}
                                <div 
                                    className="absolute bottom-0 right-0 h-1 bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                ></div>

                                <p 
                                    className={`text-center font-quran leading-loose mb-6 ${isDone ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-100'}`}
                                    style={{ fontSize: `${18 + settings.fontSize * 2}px` }}
                                >
                                    {zikr.text}
                                </p>

                                <div className="flex justify-center">
                                    <div className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold ${isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                        {isDone ? <CheckCircle size={16} /> : <Repeat size={16} />}
                                        <span>{current} / {zikr.count}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 pb-24">
            <h2 className="text-2xl font-bold mb-6 text-emerald-800 dark:text-emerald-400">الأذكار والأدعية</h2>
            <div className="grid grid-cols-1 gap-4">
                {MOCK_AZKAR.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)}
                        className="bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-between group transition-all"
                    >
                        <span className="text-xl font-bold">{cat.title}</span>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="font-mono font-bold">{cat.items.length}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DuaView;