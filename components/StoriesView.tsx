import React, { useState } from 'react';
import { Story, AppSettings } from '../types';
import { Book, Video, PlayCircle, FileText } from 'lucide-react';

interface StoriesViewProps {
  settings: AppSettings;
}

const MOCK_STORIES: Story[] = [
  { id: 1, title: "قصة آدم عليه السلام", content: "كان آدم عليه السلام أول البشر وأول الأنبياء..." },
  { id: 2, title: "قصة نوح عليه السلام", content: "أرسل الله نوحاً عليه السلام إلى قومه ليدعوهم..." },
  { id: 3, title: "قصة إبراهيم عليه السلام", content: "ولد إبراهيم عليه السلام في بابل..." },
  { id: 4, title: "قصة موسى عليه السلام", content: "ولد موسى عليه السلام في مصر في عام..." },
];

const StoriesView: React.FC<StoriesViewProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'read' | 'watch'>('read');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  if (selectedStory) {
    return (
      <div className="p-4 pb-24">
        <button 
          onClick={() => setSelectedStory(null)} 
          className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold"
        >
          &larr; عودة للقصص
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-48 bg-emerald-800 flex items-center justify-center relative">
            {/* Placeholder Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            <h1 className="text-3xl font-bold text-white relative z-10">{selectedStory.title}</h1>
          </div>
          
          <div className="p-6">
            {activeTab === 'read' ? (
              <div 
                className="prose dark:prose-invert max-w-none leading-loose text-gray-700 dark:text-gray-300"
                style={{ fontSize: `${16 + settings.fontSize * 2}px` }}
              >
                <p>{selectedStory.content}</p>
                <p>محتوى تجريبي للقصة... القصة ستكون أطول وتحتوي على تفاصيل كثيرة من القرآن والسنة.</p>
                <p>يستمر السرد هنا...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                 <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Video size={32} className="text-gray-400" />
                 </div>
                 <h3 className="text-lg font-bold mb-2">الفيديو غير متوفر</h3>
                 <p className="text-gray-500 text-sm">هذه ميزة تجريبية لعرض فيديوهات تعليمية.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
       <h2 className="text-2xl font-bold mb-4 text-emerald-800 dark:text-emerald-400">قصص الأنبياء</h2>
       
       {/* Tabs */}
       <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('read')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'read' ? 'bg-white dark:bg-gray-600 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-gray-500'}`}
          >
            <Book size={16} />
            قراءة
          </button>
          <button 
            onClick={() => setActiveTab('watch')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'watch' ? 'bg-white dark:bg-gray-600 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-gray-500'}`}
          >
            <Video size={16} />
            مشاهدة
          </button>
       </div>

       <div className="grid gap-4">
         {MOCK_STORIES.map(story => (
           <button 
             key={story.id}
             onClick={() => setSelectedStory(story)}
             className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-transparent hover:border-emerald-500 transition-all text-right"
           >
             <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
               {activeTab === 'read' ? <FileText size={20} /> : <PlayCircle size={20} />}
             </div>
             <div>
               <h3 className="font-bold text-lg">{story.title}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{story.content}</p>
             </div>
           </button>
         ))}
       </div>
    </div>
  );
};

export default StoriesView;