
import React from 'react';
import { Tab, AppSettings } from '../types';
import { BookOpen, Home, Layers, Settings, Moon, Compass } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  settings: AppSettings;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, settings }) => {
  return (
    <div className={`min-h-screen flex flex-col ${settings.darkMode ? 'dark' : ''}`}>
      <div className="flex-1 bg-pattern transition-colors duration-300 font-sans relative">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-2 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center max-w-md mx-auto h-16">
          <NavButton 
            active={activeTab === Tab.HOME} 
            onClick={() => setActiveTab(Tab.HOME)} 
            icon={<Home size={22} />} 
            label="الرئيسية" 
          />
          <NavButton 
            active={activeTab === Tab.QURAN} 
            onClick={() => setActiveTab(Tab.QURAN)} 
            icon={<BookOpen size={22} />} 
            label="القرآن" 
          />
          <NavButton 
            active={activeTab === Tab.PRAYER} 
            onClick={() => setActiveTab(Tab.PRAYER)} 
            icon={<Compass size={22} />} 
            label="المواقيت" 
          />
          <NavButton 
            active={activeTab === Tab.STORIES} 
            onClick={() => setActiveTab(Tab.STORIES)} 
            icon={<Layers size={22} />} 
            label="القصص" 
          />
          <NavButton 
            active={activeTab === Tab.AZKAR} 
            onClick={() => setActiveTab(Tab.AZKAR)} 
            icon={<Moon size={22} />} 
            label="الأذكار" 
          />
          <NavButton 
            active={activeTab === Tab.SETTINGS} 
            onClick={() => setActiveTab(Tab.SETTINGS)} 
            icon={<Settings size={22} />} 
            label="الإعدادات" 
          />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${active ? 'text-emerald-600 dark:text-emerald-400 -translate-y-1' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
  >
    <div className={`p-1.5 rounded-2xl transition-all ${active ? 'bg-emerald-100/50 dark:bg-emerald-900/30' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold mt-1 ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

export default Layout;
