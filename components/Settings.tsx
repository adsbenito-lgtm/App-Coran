import React from 'react';
import { AppSettings, QuranFont, ReadingMode, VerseNumberStyle, TafseerId } from '../types';
import { Moon, Sun, Type, Monitor, BookOpen, List, Circle, Square, Flower, Book } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  
  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const changeFontSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }));
  };
  
  const changeTafseerFontSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, tafseerFontSize: parseInt(e.target.value) }));
  };

  const changeFontFamily = (font: QuranFont) => {
    setSettings(prev => ({ ...prev, fontFamily: font }));
  };

  const changeReadingMode = (mode: ReadingMode) => {
    setSettings(prev => ({ ...prev, readingMode: mode }));
  };

  const changeVerseNumberStyle = (style: VerseNumberStyle) => {
    setSettings(prev => ({ ...prev, verseNumberStyle: style }));
  };

  const changeTafseer = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSettings(prev => ({ ...prev, selectedTafseer: e.target.value as TafseerId }));
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-emerald-800 dark:text-emerald-400">الإعدادات</h2>

      {/* Theme Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
              {settings.darkMode ? <Moon size={20} className="text-emerald-700 dark:text-emerald-300" /> : <Sun size={20} className="text-emerald-700" />}
            </div>
            <div>
              <h3 className="font-bold">المظهر</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">التبديل بين الوضع الليلي والنهاري</p>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.darkMode ? 'bg-emerald-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-[-1.25rem]' : 'translate-x-[-0.25rem]'}`} />
          </button>
        </div>
      </div>

      {/* Reading Mode */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-3">نمط القراءة</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => changeReadingMode('list')}
            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${settings.readingMode === 'list' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}
          >
            <List size={18} />
            <span className="font-bold text-sm">قائمة آيات</span>
          </button>
          <button 
            onClick={() => changeReadingMode('mushaf')}
            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${settings.readingMode === 'mushaf' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}
          >
            <BookOpen size={18} />
            <span className="font-bold text-sm">صفحة مصحف</span>
          </button>
        </div>
      </div>

      {/* Verse Number Style */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-3">شكل أرقام الآيات</h3>
        <div className="flex gap-3 justify-center">
            <button
                onClick={() => changeVerseNumberStyle('circle')}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all ${settings.verseNumberStyle === 'circle' ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200 dark:border-gray-600'}`}
            >
                <div className="w-8 h-8 rounded-full border border-emerald-500 flex items-center justify-center text-xs font-bold mb-2">1</div>
                <span className="text-xs">دائري</span>
            </button>
            <button
                onClick={() => changeVerseNumberStyle('square')}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all ${settings.verseNumberStyle === 'square' ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200 dark:border-gray-600'}`}
            >
                <div className="w-8 h-8 rounded-md border border-emerald-500 flex items-center justify-center text-xs font-bold mb-2">1</div>
                <span className="text-xs">مربع</span>
            </button>
            <button
                onClick={() => changeVerseNumberStyle('flower')}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all ${settings.verseNumberStyle === 'flower' ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200 dark:border-gray-600'}`}
            >
                <div className="w-8 h-8 relative flex items-center justify-center mb-2">
                    <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                       <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                    </svg>
                    <span className="text-xs font-bold">1</span>
                </div>
                <span className="text-xs">مزخرف</span>
            </button>
        </div>
      </div>

      {/* Tafseer Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                  <Book size={20} className="text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="font-bold">كتاب التفسير</h3>
          </div>
          <select 
            value={settings.selectedTafseer}
            onChange={changeTafseer}
            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white outline-none focus:border-emerald-500"
          >
              <option value="ar.muyassar">التفسير الميسر (يوصى به)</option>
              <option value="ar.jalalayn">تفسير الجلالين</option>
              <option value="ar.ibnkathir">تفسير ابن كثير</option>
              <option value="ar.qurtubi">تفسير القرطبي</option>
              <option value="ar.tabari">تفسير الطبري</option>
          </select>
          <div className="mt-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">حجم خط التفسير</label>
              <div className="flex items-center gap-4">
                  <span className="text-xs">صغير</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1" 
                    value={settings.tafseerFontSize} 
                    onChange={changeTafseerFontSize}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-amber-600"
                  />
                  <span className="text-xs font-bold">كبير</span>
              </div>
          </div>
      </div>

      {/* Font Family Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-3">نوع الخط</h3>
        <div className="space-y-2">
          {[
            { id: 'Amiri', label: 'الخط الأميري (التقليدي)' },
            { id: 'Scheherazade New', label: 'الرسم العثماني (واضح)' },
            { id: 'Noto Naskh Arabic', label: 'خط النسخ (للشاشات)' }
          ].map((font) => (
            <button
              key={font.id}
              onClick={() => changeFontFamily(font.id as QuranFont)}
              className={`w-full text-right p-3 rounded-lg border transition-all ${settings.fontFamily === font.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-sans">{font.label}</span>
                <span style={{ fontFamily: font.id }} className="text-xl">بسم الله</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size Slider */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Type size={20} className="text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="font-bold">حجم خط القرآن</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">تحكم في حجم خط النصوص القرآنية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm">صغير</span>
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="1" 
            value={settings.fontSize} 
            onChange={changeFontSize}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-600"
          />
          <span className="text-lg font-bold">كبير</span>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center border border-gray-200 dark:border-gray-700 transition-all">
          <p style={{ fontSize: `${16 + settings.fontSize * 4}px`, fontFamily: settings.fontFamily }}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;