
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SettingsView from './components/Settings';
import QuranReader from './components/QuranReader';
import StoriesView, { INITIAL_SERIES_DATA } from './components/StoriesView';
import DuaView, { MOCK_AZKAR } from './components/DuaView';
import PrayerTimesView from './components/PrayerTimesView';
import { Tab, AppSettings, Surah, LastReadState, PrayerTimesData } from './types';
import { Search, Book, Moon, Calendar, ChevronLeft, Clock, BookOpen, Layers, MapPin, Sunrise, Sun, Sunset, CloudMoon, Compass, Sparkles, FileText, Hash, ArrowRight, Tv, Play } from 'lucide-react';
import { fetchPrayerTimes, formatTime12H, getNextPrayer } from './services/prayerService';
import { formatNumber } from './utils/number';

// Full List of 114 Surahs with Start Pages (Madani Mushaf)
const SURAHS: Surah[] = [
  { id: 1, name: "الفاتحة", englishName: "Al-Fatiha", transliteration: "Al-Fatiha", verses_count: 7, revelation_place: "مكية", startPage: 1 },
  { id: 2, name: "البقرة", englishName: "Al-Baqarah", transliteration: "Al-Baqarah", verses_count: 286, revelation_place: "مدنية", startPage: 2 },
  { id: 3, name: "آل عمران", englishName: "Aal-E-Imran", transliteration: "Aal-E-Imran", verses_count: 200, revelation_place: "مدنية", startPage: 50 },
  { id: 4, name: "النساء", englishName: "An-Nisa", transliteration: "An-Nisa", verses_count: 176, revelation_place: "مدنية", startPage: 77 },
  { id: 5, name: "المائدة", englishName: "Al-Ma'idah", transliteration: "Al-Ma'idah", verses_count: 120, revelation_place: "مدنية", startPage: 106 },
  { id: 6, name: "الأنعام", englishName: "Al-An'am", transliteration: "Al-An'am", verses_count: 165, revelation_place: "مكية", startPage: 128 },
  { id: 7, name: "الأعراف", englishName: "Al-A'raf", transliteration: "Al-A'raf", verses_count: 206, revelation_place: "مكية", startPage: 151 },
  { id: 8, name: "الأنفال", englishName: "Al-Anfal", transliteration: "Al-Anfal", verses_count: 75, revelation_place: "مدنية", startPage: 177 },
  { id: 9, name: "التوبة", englishName: "At-Tawbah", transliteration: "At-Tawbah", verses_count: 129, revelation_place: "مدنية", startPage: 187 },
  { id: 10, name: "يونس", englishName: "Yunus", transliteration: "Yunus", verses_count: 109, revelation_place: "مكية", startPage: 208 },
  { id: 11, name: "هود", englishName: "Hud", transliteration: "Hud", verses_count: 123, revelation_place: "مكية", startPage: 221 },
  { id: 12, name: "يوسف", englishName: "Yusuf", transliteration: "Yusuf", verses_count: 111, revelation_place: "مكية", startPage: 235 },
  { id: 13, name: "الرعد", englishName: "Ar-Ra'd", transliteration: "Ar-Ra'd", verses_count: 43, revelation_place: "مدنية", startPage: 249 },
  { id: 14, name: "إبراهيم", englishName: "Ibrahim", transliteration: "Ibrahim", verses_count: 52, revelation_place: "مكية", startPage: 255 },
  { id: 15, name: "الحجر", englishName: "Al-Hijr", transliteration: "Al-Hijr", verses_count: 99, revelation_place: "مكية", startPage: 262 },
  { id: 16, name: "النحل", englishName: "An-Nahl", transliteration: "An-Nahl", verses_count: 128, revelation_place: "مكية", startPage: 267 },
  { id: 17, name: "الإسراء", englishName: "Al-Isra", transliteration: "Al-Isra", verses_count: 111, revelation_place: "مكية", startPage: 282 },
  { id: 18, name: "الكهف", englishName: "Al-Kahf", transliteration: "Al-Kahf", verses_count: 110, revelation_place: "مكية", startPage: 293 },
  { id: 19, name: "مريم", englishName: "Maryam", transliteration: "Maryam", verses_count: 98, revelation_place: "مكية", startPage: 305 },
  { id: 20, name: "طه", englishName: "Ta-Ha", transliteration: "Ta-Ha", verses_count: 135, revelation_place: "مكية", startPage: 312 },
  { id: 21, name: "الأنبياء", englishName: "Al-Anbiya", transliteration: "Al-Anbiya", verses_count: 112, revelation_place: "مكية", startPage: 322 },
  { id: 22, name: "الحج", englishName: "Al-Hajj", transliteration: "Al-Hajj", verses_count: 78, revelation_place: "مدنية", startPage: 332 },
  { id: 23, name: "المؤمنون", englishName: "Al-Mu'minun", transliteration: "Al-Mu'minun", verses_count: 118, revelation_place: "مكية", startPage: 342 },
  { id: 24, name: "النور", englishName: "An-Nur", transliteration: "An-Nur", verses_count: 64, revelation_place: "مدنية", startPage: 350 },
  { id: 25, name: "الفرقان", englishName: "Al-Furqan", transliteration: "Al-Furqan", verses_count: 77, revelation_place: "مكية", startPage: 359 },
  { id: 26, name: "الشعراء", englishName: "Ash-Shu'ara", transliteration: "Ash-Shu'ara", verses_count: 227, revelation_place: "مكية", startPage: 367 },
  { id: 27, name: "النمل", englishName: "An-Naml", transliteration: "An-Naml", verses_count: 93, revelation_place: "مكية", startPage: 377 },
  { id: 28, name: "القصص", englishName: "Al-Qasas", transliteration: "Al-Qasas", verses_count: 88, revelation_place: "مكية", startPage: 385 },
  { id: 29, name: "العنكبوت", englishName: "Al-Ankabut", transliteration: "Al-Ankabut", verses_count: 69, revelation_place: "مكية", startPage: 396 },
  { id: 30, name: "الروم", englishName: "Ar-Rum", transliteration: "Ar-Rum", verses_count: 60, revelation_place: "مكية", startPage: 404 },
  { id: 31, name: "لقمان", englishName: "Luqman", transliteration: "Luqman", verses_count: 34, revelation_place: "مكية", startPage: 411 },
  { id: 32, name: "السجدة", englishName: "As-Sajdah", transliteration: "As-Sajdah", verses_count: 30, revelation_place: "مكية", startPage: 415 },
  { id: 33, name: "الأحزاب", englishName: "Al-Ahzab", transliteration: "Al-Ahzab", verses_count: 73, revelation_place: "مدنية", startPage: 418 },
  { id: 34, name: "سبأ", englishName: "Saba", transliteration: "Saba", verses_count: 54, revelation_place: "مكية", startPage: 428 },
  { id: 35, name: "فاطر", englishName: "Fatir", transliteration: "Fatir", verses_count: 45, revelation_place: "مكية", startPage: 434 },
  { id: 36, name: "يس", englishName: "Ya-Sin", transliteration: "Ya-Sin", verses_count: 83, revelation_place: "مكية", startPage: 440 },
  { id: 37, name: "الصافات", englishName: "As-Saffat", transliteration: "As-Saffat", verses_count: 182, revelation_place: "مكية", startPage: 446 },
  { id: 38, name: "ص", englishName: "Sad", transliteration: "Sad", verses_count: 88, revelation_place: "مكية", startPage: 453 },
  { id: 39, name: "الزمر", englishName: "Az-Zumar", transliteration: "Az-Zumar", verses_count: 75, revelation_place: "مكية", startPage: 458 },
  { id: 40, name: "غافر", englishName: "Ghafir", transliteration: "Ghafir", verses_count: 85, revelation_place: "مكية", startPage: 467 },
  { id: 41, name: "فصلت", englishName: "Fussilat", transliteration: "Fussilat", verses_count: 54, revelation_place: "مكية", startPage: 477 },
  { id: 42, name: "الشورى", englishName: "Ash-Shura", transliteration: "Ash-Shura", verses_count: 53, revelation_place: "مكية", startPage: 483 },
  { id: 43, name: "الزخرف", englishName: "Az-Zukhruf", transliteration: "Az-Zukhruf", verses_count: 89, revelation_place: "مكية", startPage: 489 },
  { id: 44, name: "الدخان", englishName: "Ad-Dukhan", transliteration: "Ad-Dukhan", verses_count: 59, revelation_place: "مكية", startPage: 496 },
  { id: 45, name: "الجاثية", englishName: "Al-Jathiyah", transliteration: "Al-Jathiyah", verses_count: 37, revelation_place: "مكية", startPage: 499 },
  { id: 46, name: "الأحقاف", englishName: "Al-Ahqaf", transliteration: "Al-Ahqaf", verses_count: 35, revelation_place: "مكية", startPage: 502 },
  { id: 47, name: "محمد", englishName: "Muhammad", transliteration: "Muhammad", verses_count: 38, revelation_place: "مدنية", startPage: 507 },
  { id: 48, name: "الفتح", englishName: "Al-Fath", transliteration: "Al-Fath", verses_count: 29, revelation_place: "مدنية", startPage: 511 },
  { id: 49, name: "الحجرات", englishName: "Al-Hujurat", transliteration: "Al-Hujurat", verses_count: 18, revelation_place: "مدنية", startPage: 515 },
  { id: 50, name: "ق", englishName: "Qaf", transliteration: "Qaf", verses_count: 45, revelation_place: "مكية", startPage: 518 },
  { id: 51, name: "الذاريات", englishName: "Ad-Dhariyat", transliteration: "Ad-Dhariyat", verses_count: 60, revelation_place: "مكية", startPage: 520 },
  { id: 52, name: "الطور", englishName: "At-Tur", transliteration: "At-Tur", verses_count: 49, revelation_place: "مكية", startPage: 523 },
  { id: 53, name: "النجم", englishName: "An-Najm", transliteration: "An-Najm", verses_count: 62, revelation_place: "مكية", startPage: 526 },
  { id: 54, name: "القمر", englishName: "Al-Qamar", transliteration: "Al-Qamar", verses_count: 55, revelation_place: "مكية", startPage: 528 },
  { id: 55, name: "الرحمن", englishName: "Ar-Rahman", transliteration: "Ar-Rahman", verses_count: 78, revelation_place: "مدنية", startPage: 531 },
  { id: 56, name: "الواقعة", englishName: "Al-Waqi'ah", transliteration: "Al-Waqi'ah", verses_count: 96, revelation_place: "مكية", startPage: 534 },
  { id: 57, name: "الحديد", englishName: "Al-Hadid", transliteration: "Al-Hadid", verses_count: 29, revelation_place: "مدنية", startPage: 537 },
  { id: 58, name: "المجادلة", englishName: "Al-Mujadila", transliteration: "Al-Mujadila", verses_count: 22, revelation_place: "مدنية", startPage: 542 },
  { id: 59, name: "الحشر", englishName: "Al-Hashr", transliteration: "Al-Hashr", verses_count: 24, revelation_place: "مدنية", startPage: 545 },
  { id: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", transliteration: "Al-Mumtahanah", verses_count: 13, revelation_place: "مدنية", startPage: 549 },
  { id: 61, name: "الصف", englishName: "As-Saff", transliteration: "As-Saff", verses_count: 14, revelation_place: "مدنية", startPage: 551 },
  { id: 62, name: "الجمعة", englishName: "Al-Jumu'ah", transliteration: "Al-Jumu'ah", verses_count: 11, revelation_place: "مدنية", startPage: 553 },
  { id: 63, name: "المنافقون", englishName: "Al-Munafiqun", transliteration: "Al-Munafiqun", verses_count: 11, revelation_place: "مدنية", startPage: 554 },
  { id: 64, name: "التغابن", englishName: "At-Taghabun", transliteration: "At-Taghabun", verses_count: 18, revelation_place: "مدنية", startPage: 556 },
  { id: 65, name: "الطلاق", englishName: "At-Talaq", transliteration: "At-Talaq", verses_count: 12, revelation_place: "مدنية", startPage: 558 },
  { id: 66, name: "التحريم", englishName: "At-Tahrim", transliteration: "At-Tahrim", verses_count: 12, revelation_place: "مدنية", startPage: 560 },
  { id: 67, name: "الملك", englishName: "Al-Mulk", transliteration: "Al-Mulk", verses_count: 30, revelation_place: "مكية", startPage: 562 },
  { id: 68, name: "القلم", englishName: "Al-Qalam", transliteration: "Al-Qalam", verses_count: 52, revelation_place: "مكية", startPage: 564 },
  { id: 69, name: "الحاقة", englishName: "Al-Haqqah", transliteration: "Al-Haqqah", verses_count: 52, revelation_place: "مكية", startPage: 566 },
  { id: 70, name: "المعارج", englishName: "Al-Ma'arij", transliteration: "Al-Ma'arij", verses_count: 44, revelation_place: "مكية", startPage: 568 },
  { id: 71, name: "نوح", englishName: "Nuh", transliteration: "Nuh", verses_count: 28, revelation_place: "مكية", startPage: 570 },
  { id: 72, name: "الجن", englishName: "Al-Jinn", transliteration: "Al-Jinn", verses_count: 28, revelation_place: "مكية", startPage: 572 },
  { id: 73, name: "المزمل", englishName: "Al-Muzzammil", transliteration: "Al-Muzzammil", verses_count: 20, revelation_place: "مكية", startPage: 574 },
  { id: 74, name: "المدثر", englishName: "Al-Muddaththir", transliteration: "Al-Muddaththir", verses_count: 56, revelation_place: "مكية", startPage: 575 },
  { id: 75, name: "القيامة", englishName: "Al-Qiyamah", transliteration: "Al-Qiyamah", verses_count: 40, revelation_place: "مكية", startPage: 577 },
  { id: 76, name: "الإنسان", englishName: "Al-Insan", transliteration: "Al-Insan", verses_count: 31, revelation_place: "مدنية", startPage: 578 },
  { id: 77, name: "المرسلات", englishName: "Al-Mursalat", transliteration: "Al-Mursalat", verses_count: 50, revelation_place: "مكية", startPage: 580 },
  { id: 78, name: "النبأ", englishName: "An-Naba", transliteration: "An-Naba", verses_count: 40, revelation_place: "مكية", startPage: 582 },
  { id: 79, name: "النازعات", englishName: "An-Nazi'at", transliteration: "An-Nazi'at", verses_count: 46, revelation_place: "مكية", startPage: 583 },
  { id: 80, name: "عبس", englishName: "'Abasa", transliteration: "'Abasa", verses_count: 42, revelation_place: "مكية", startPage: 585 },
  { id: 81, name: "التكوير", englishName: "At-Takwir", transliteration: "At-Takwir", verses_count: 29, revelation_place: "مكية", startPage: 586 },
  { id: 82, name: "الانفطار", englishName: "Al-Infitar", transliteration: "Al-Infitar", verses_count: 19, revelation_place: "مكية", startPage: 587 },
  { id: 83, name: "المطففين", englishName: "Al-Mutaffifin", transliteration: "Al-Mutaffifin", verses_count: 36, revelation_place: "مكية", startPage: 587 },
  { id: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", transliteration: "Al-Inshiqaq", verses_count: 25, revelation_place: "مكية", startPage: 589 },
  { id: 85, name: "البروج", englishName: "Al-Buruj", transliteration: "Al-Buruj", verses_count: 22, revelation_place: "مكية", startPage: 590 },
  { id: 86, name: "الطارق", englishName: "At-Tariq", transliteration: "At-Tariq", verses_count: 17, revelation_place: "مكية", startPage: 591 },
  { id: 87, name: "الأعلى", englishName: "Al-A'la", transliteration: "Al-A'la", verses_count: 19, revelation_place: "مكية", startPage: 591 },
  { id: 88, name: "الغاشية", englishName: "Al-Ghashiyah", transliteration: "Al-Ghashiyah", verses_count: 26, revelation_place: "مكية", startPage: 592 },
  { id: 89, name: "الفجر", englishName: "Al-Fajr", transliteration: "Al-Fajr", verses_count: 30, revelation_place: "مكية", startPage: 593 },
  { id: 90, name: "البلد", englishName: "Al-Balad", transliteration: "Al-Balad", verses_count: 20, revelation_place: "مكية", startPage: 594 },
  { id: 91, name: "الشمس", englishName: "Ash-Shams", transliteration: "Ash-Shams", verses_count: 15, revelation_place: "مكية", startPage: 595 },
  { id: 92, name: "الليل", englishName: "Al-Layl", transliteration: "Al-Layl", verses_count: 21, revelation_place: "مكية", startPage: 595 },
  { id: 93, name: "الضحى", englishName: "Ad-Duha", transliteration: "Ad-Duha", verses_count: 11, revelation_place: "مكية", startPage: 596 },
  { id: 94, name: "الشرح", englishName: "Ash-Sharh", transliteration: "Ash-Sharh", verses_count: 8, revelation_place: "مكية", startPage: 596 },
  { id: 95, name: "التين", englishName: "At-Tin", transliteration: "At-Tin", verses_count: 8, revelation_place: "مكية", startPage: 597 },
  { id: 96, name: "العلق", englishName: "Al-Alaq", transliteration: "Al-Alaq", verses_count: 19, revelation_place: "مكية", startPage: 597 },
  { id: 97, name: "القدر", englishName: "Al-Qadr", transliteration: "Al-Qadr", verses_count: 5, revelation_place: "مكية", startPage: 598 },
  { id: 98, name: "البينة", englishName: "Al-Bayyinah", transliteration: "Al-Bayyinah", verses_count: 8, revelation_place: "مدنية", startPage: 598 },
  { id: 99, name: "الزلزلة", englishName: "Az-Zalzalah", transliteration: "Az-Zalzalah", verses_count: 8, revelation_place: "مدنية", startPage: 599 },
  { id: 100, name: "العاديات", englishName: "Al-Adiyat", transliteration: "Al-Adiyat", verses_count: 11, revelation_place: "مكية", startPage: 599 },
  { id: 101, name: "القارعة", englishName: "Al-Qari'ah", transliteration: "Al-Qari'ah", verses_count: 11, revelation_place: "مكية", startPage: 600 },
  { id: 102, name: "التكاثر", englishName: "At-Takathur", transliteration: "At-Takathur", verses_count: 8, revelation_place: "مكية", startPage: 600 },
  { id: 103, name: "العصر", englishName: "Al-Asr", transliteration: "Al-Asr", verses_count: 3, revelation_place: "مكية", startPage: 601 },
  { id: 104, name: "الهمزة", englishName: "Al-Humazah", transliteration: "Al-Humazah", verses_count: 9, revelation_place: "مكية", startPage: 601 },
  { id: 105, name: "الفيل", englishName: "Al-Fil", transliteration: "Al-Fil", verses_count: 5, revelation_place: "مكية", startPage: 601 },
  { id: 106, name: "قريش", englishName: "Quraysh", transliteration: "Quraysh", verses_count: 4, revelation_place: "مكية", startPage: 602 },
  { id: 107, name: "الماعون", englishName: "Al-Ma'un", transliteration: "Al-Ma'un", verses_count: 7, revelation_place: "مكية", startPage: 602 },
  { id: 108, name: "الكوثر", englishName: "Al-Kawthar", transliteration: "Al-Kawthar", verses_count: 3, revelation_place: "مكية", startPage: 602 },
  { id: 109, name: "الكافرون", englishName: "Al-Kafirun", transliteration: "Al-Kafirun", verses_count: 6, revelation_place: "مكية", startPage: 603 },
  { id: 110, name: "النصر", englishName: "An-Nasr", transliteration: "An-Nasr", verses_count: 3, revelation_place: "مدنية", startPage: 603 },
  { id: 111, name: "المسد", englishName: "Al-Masad", transliteration: "Al-Masad", verses_count: 5, revelation_place: "مكية", startPage: 603 },
  { id: 112, name: "الإخلاص", englishName: "Al-Ikhlas", transliteration: "Al-Ikhlas", verses_count: 4, revelation_place: "مكية", startPage: 604 },
  { id: 113, name: "الفلف", englishName: "Al-Falaq", transliteration: "Al-Falaq", verses_count: 5, revelation_place: "مكية", startPage: 604 },
  { id: 114, name: "الناس", englishName: "An-Nas", transliteration: "An-Nas", verses_count: 6, revelation_place: "مكية", startPage: 604 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [settings, setSettings] = useState<AppSettings>({ 
    darkMode: false, 
    fontSize: 2,
    tafseerFontSize: 3, 
    tafseerFontFamily: 'Amiri', 
    fontFamily: 'Amiri',
    readingMode: 'mushaf',
    verseNumberStyle: 'circle',
    selectedTafseer: 'ar.muyassar',
    selectedReciter: 'alafasy',
    numeralSystem: 'arabic' 
  });
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [initialPage, setInitialPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Last Read & Watch Persistence
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);
  const [lastWatchedSeries, setLastWatchedSeries] = useState<{id: string, title: string, episode: number} | null>(null);
  const [resumeSeriesId, setResumeSeriesId] = useState<string | null>(null);

  // Prayer Times State
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('مكة المكرمة');

  // Time-based Content State
  const [dailyZikr, setDailyZikr] = useState<{catTitle: string, item: any, theme: any} | null>(null);

  // Load Data
  useEffect(() => {
    // Dark Mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Time-based Content Logic
    const h = new Date().getHours();
    let catId = 1;
    let theme = { 
      grad: 'from-amber-500 via-orange-600 to-red-600', 
      icon: <Sunrise size={16} />,
      label: 'إشراقة الصباح'
    };

    if (h >= 16 && h < 21) {
        catId = 2; // Evening
        theme = { 
          grad: 'from-indigo-700 via-purple-700 to-pink-700', 
          icon: <Sunset size={16} />,
          label: 'هدوء المساء'
        };
    } else if (h >= 21 || h < 4) {
        catId = 3; // Sleep
        theme = { 
          grad: 'from-slate-900 via-gray-800 to-black', 
          icon: <Moon size={16} />,
          label: 'سكون الليل'
        };
    }

    const cat = MOCK_AZKAR.find(c => c.id === catId);
    if (cat && cat.items.length > 0) {
        const item = cat.items[Math.floor(Math.random() * cat.items.length)];
        setDailyZikr({ catTitle: cat.title, item, theme });
    }

  }, [settings.darkMode]); // Re-run if darkMode changes (though logic is time based, mainly mount)

  // ... (Rest of useEffects for LastRead, PrayerTimes remain same) ...
  useEffect(() => {
    if (activeTab === Tab.HOME) {
        const saved = localStorage.getItem('lastRead');
        if (saved) {
          try {
            setLastRead(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse lastRead", e);
          }
        }
        const lastSeriesId = localStorage.getItem('last_active_series');
        if (lastSeriesId) {
            const series = INITIAL_SERIES_DATA.find(s => s.id === lastSeriesId);
            if (series) {
                 const progress = localStorage.getItem(`series_progress_${lastSeriesId}`);
                 const episodeIndex = progress ? parseInt(progress) : 0;
                 setLastWatchedSeries({
                     id: lastSeriesId,
                     title: series.title,
                     episode: episodeIndex + 1
                 });
            }
        }
    }
  }, [activeTab]);

  useEffect(() => {
    const initPrayerTimes = async () => {
       if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(
               async (position) => {
                   const { latitude, longitude } = position.coords;
                   setLocationName('موقعي الحالي');
                   const data = await fetchPrayerTimes(latitude, longitude);
                   if (data) {
                       setPrayerTimes(data);
                       setNextPrayer(getNextPrayer(data.timings));
                   }
               },
               async (error) => {
                   console.log("Geolocation blocked or failed, defaulting to Mecca");
                   const data = await fetchPrayerTimes(null, null);
                   if (data) {
                       setPrayerTimes(data);
                       setNextPrayer(getNextPrayer(data.timings));
                   }
               }
           );
       } else {
           const data = await fetchPrayerTimes(null, null);
           if (data) {
               setPrayerTimes(data);
               setNextPrayer(getNextPrayer(data.timings));
           }
       }
    };
    initPrayerTimes();
  }, []);

  const handlePageChange = (page: number, surah: Surah | undefined) => {
    if (!surah) return;
    let actualSurah = surah;
    const foundSurah = SURAHS.find(s => {
       return page >= s.startPage && (SURAHS[s.id] ? page < SURAHS[s.id].startPage : page <= 604);
    });
    if (foundSurah) actualSurah = foundSurah;
    const newState: LastReadState = {
      surahId: actualSurah.id,
      surahName: actualSurah.name,
      pageNumber: page,
      timestamp: Date.now()
    };
    setLastRead(newState);
    localStorage.setItem('lastRead', JSON.stringify(newState));
  };

  const getSurahFromPage = (page: number) => {
     return [...SURAHS].reverse().find(s => s.startPage <= page) || SURAHS[0];
  };

  const openSurah = (surah: Surah) => {
    let pageToOpen = surah.startPage;
    if (lastRead) {
        const nextSurah = SURAHS[surah.id];
        const endPage = nextSurah ? nextSurah.startPage - 1 : 604;
        if (lastRead.pageNumber >= surah.startPage && lastRead.pageNumber <= endPage) {
            pageToOpen = lastRead.pageNumber;
        }
    }
    setInitialPage(pageToOpen);
    setSelectedSurah(surah);
    setActiveTab(Tab.QURAN);
  };
  
  const handlePageNavigation = (page: number) => {
      const targetSurah = getSurahFromPage(page);
      setInitialPage(page);
      setSelectedSurah(targetSurah);
      setActiveTab(Tab.QURAN);
      setSearchTerm("");
  };

  const resumeReading = () => {
    if (lastRead) {
      const surah = SURAHS.find(s => s.id === lastRead.surahId);
      if (surah) {
        setInitialPage(lastRead.pageNumber);
        setSelectedSurah(surah);
        setActiveTab(Tab.QURAN);
      }
    } else {
      openSurah(SURAHS[0]);
    }
  };

  const handleResumeWatching = () => {
      if (lastWatchedSeries) {
          setResumeSeriesId(lastWatchedSeries.id);
          setActiveTab(Tab.STORIES);
      }
  };

  const onTabChange = (t: Tab) => {
      if (t === Tab.STORIES) setResumeSeriesId(null);
      setActiveTab(t);
  };

  const filteredSurahs = SURAHS.filter(s => 
    s.name.includes(searchTerm) || 
    s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString() === searchTerm
  );

  const searchAsNumber = parseInt(searchTerm);
  const isPageSearch = !isNaN(searchAsNumber) && searchAsNumber >= 1 && searchAsNumber <= 604;
  const isSurahNumberSearch = !isNaN(searchAsNumber) && searchAsNumber >= 1 && searchAsNumber <= 114;
  const targetSurahByNumber = isSurahNumberSearch ? SURAHS.find(s => s.id === searchAsNumber) : null;

  if (activeTab === Tab.QURAN && selectedSurah) {
    return (
      <QuranReader 
        settings={settings} 
        surah={selectedSurah} 
        initialPage={initialPage}
        onPageChange={(page) => handlePageChange(page, selectedSurah)}
        goBack={() => setSelectedSurah(null)} 
      />
    );
  }

  const renderContent = () => {
    if (activeTab === Tab.QURAN) {
      // (Quran List render remains same)
      return (
        <div className="p-4 pb-24">
           {/* ... existing Quran tab code ... */}
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">القرآن الكريم</h2>
             <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
               المصحف الشريف ({formatNumber(604, settings.numeralSystem)} صفحة)
             </div>
           </div>
           
           <div className="relative mb-6 group">
             <input 
               type="text" 
               placeholder="ابحث عن سورة، رقم صفحة (١-٦٠٤)، أو رقم آية..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white dark:bg-gray-800 p-4 pr-12 rounded-2xl shadow-sm border border-transparent focus:border-emerald-500 outline-none dark:text-white transition-all text-right" 
               dir="rtl"
             />
             <Search className="absolute right-4 top-4 text-gray-400 group-focus-within:text-emerald-500" size={20} />
           </div>

           {(isPageSearch || isSurahNumberSearch) && (
               <div className="mb-6 grid gap-3 animate-in fade-in slide-in-from-top-2">
                   {isPageSearch && (
                       <button 
                         onClick={() => handlePageNavigation(searchAsNumber)}
                         className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors group"
                       >
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-700 dark:text-amber-200">
                                   <FileText size={24} />
                               </div>
                               <div className="text-right">
                                   <h3 className="font-bold text-gray-800 dark:text-white">الذهاب للصفحة {formatNumber(searchAsNumber, settings.numeralSystem)}</h3>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">
                                       من سورة {getSurahFromPage(searchAsNumber).name}
                                   </p>
                               </div>
                           </div>
                           <ArrowRight className="text-amber-500 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
                       </button>
                   )}

                   {targetSurahByNumber && (
                       <button 
                         onClick={() => openSurah(targetSurahByNumber)}
                         className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group"
                       >
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-200">
                                   <Hash size={24} />
                               </div>
                               <div className="text-right">
                                   <h3 className="font-bold text-gray-800 dark:text-white">سورة {targetSurahByNumber.name}</h3>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">
                                       ترتيب المصحف: {formatNumber(targetSurahByNumber.id, settings.numeralSystem)}
                                   </p>
                               </div>
                           </div>
                           <ArrowRight className="text-emerald-500 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
                       </button>
                   )}
               </div>
           )}
           
           <div className="space-y-3">
             {filteredSurahs.map((surah) => {
               const nextSurah = SURAHS[surah.id];
               const endPage = nextSurah ? nextSurah.startPage - 1 : 604;
               const isLastRead = lastRead && lastRead.surahId === surah.id;

               return (
                 <button 
                   key={surah.id} 
                   onClick={() => openSurah(surah)}
                   className={`w-full p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-all group ${isLastRead ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-700 hover:border-emerald-500'}`}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative transition-colors ${isLastRead ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-gray-50 dark:bg-gray-700 group-hover:bg-emerald-50'}`}>
                       <span className={`font-bold font-quran text-lg ${isLastRead ? 'text-emerald-800 dark:text-emerald-100' : 'text-emerald-700 dark:text-emerald-400'}`}>
                         {formatNumber(surah.id, settings.numeralSystem)}
                       </span>
                     </div>
                     <div className="text-right">
                       <h3 className="font-bold text-lg dark:text-white text-gray-800">{surah.name}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{surah.revelation_place} • {formatNumber(surah.verses_count, settings.numeralSystem)} آية</p>
                     </div>
                   </div>
                   <div className="text-left flex flex-col items-end">
                     <p className="text-sm font-semibold text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1">{surah.englishName}</p>
                     <div className="flex items-center gap-2">
                        {isLastRead && (
                             <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded animate-pulse">
                                صفحة {formatNumber(lastRead.pageNumber, settings.numeralSystem)}
                             </span>
                        )}
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">
                          صفحة {formatNumber(surah.startPage, settings.numeralSystem)}-{formatNumber(endPage, settings.numeralSystem)}
                        </span>
                     </div>
                   </div>
                 </button>
               );
             })}
           </div>
        </div>
      );
    }

    if (activeTab === Tab.STORIES) {
      return <StoriesView settings={settings} initialSeriesId={resumeSeriesId} />;
    }
    
    if (activeTab === Tab.PRAYER) {
      return <PrayerTimesView settings={settings} prayerTimes={prayerTimes} locationName={locationName} />;
    }

    if (activeTab === Tab.AZKAR) {
      return <DuaView settings={settings} />;
    }

    if (activeTab === Tab.SETTINGS) {
      return <SettingsView settings={settings} setSettings={setSettings} />;
    }

    // HOME (Dashboard)
    return (
      <div className="p-5 pb-24 space-y-6 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-start pt-2">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
               <Calendar size={14} />
               <span className="text-xs font-bold">
                   {prayerTimes ? `${formatNumber(prayerTimes.date.hijri.day, settings.numeralSystem)} ${prayerTimes.date.hijri.month.ar} ${formatNumber(prayerTimes.date.hijri.year, settings.numeralSystem)}` : 'جاري التحميل...'}
               </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white font-quran">السلام عليكم</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
               <MapPin size={12}/> {locationName}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 flex items-center justify-center text-white font-bold text-xl font-quran">
            ع
          </div>
        </header>

        {/* Prayer Times Widget */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-4 px-2">
                 <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Clock size={16} className="text-emerald-500"/> مواقيت الصلاة
                 </h3>
                 <span className="text-xs text-gray-400 font-medium">Umm Al-Qura</span>
             </div>
             
             {prayerTimes ? (
                 <div className="flex justify-between items-center text-center">
                     {[
                         { name: 'Fajr', label: 'الفجر', icon: <CloudMoon size={18}/> },
                         { name: 'Dhuhr', label: 'الظهر', icon: <Sun size={18}/> },
                         { name: 'Asr', label: 'العصر', icon: <Sun size={18} className="opacity-70"/> },
                         { name: 'Maghrib', label: 'المغرب', icon: <Sunset size={18}/> },
                         { name: 'Isha', label: 'العشاء', icon: <Moon size={18}/> }
                     ].map((p) => {
                         const isNext = nextPrayer === p.name;
                         return (
                             <div key={p.name} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isNext ? 'bg-emerald-100 dark:bg-emerald-900/50 scale-105' : ''}`}>
                                 <div className={`${isNext ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                     {p.icon}
                                 </div>
                                 <span className={`text-[10px] font-bold ${isNext ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-500'}`}>{p.label}</span>
                                 <span className={`text-xs font-bold font-sans ${isNext ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                     {formatNumber(formatTime12H(prayerTimes.timings[p.name]), settings.numeralSystem)}
                                 </span>
                             </div>
                         )
                     })}
                 </div>
             ) : (
                 <div className="flex justify-center py-4">
                     <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
             )}
        </div>

        {/* Dynamic Daily Zikr Card (Replaces Daily Verse) */}
        {dailyZikr ? (
        <div 
            onClick={() => setActiveTab(Tab.AZKAR)}
            className="relative group overflow-hidden rounded-3xl cursor-pointer shadow-lg shadow-gray-200/50 dark:shadow-none transition-transform active:scale-[0.98]"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${dailyZikr.theme.grad}`}></div>
          {/* Decorative Pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
          {/* Circle Decorations */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative p-6 text-white text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-4 border border-white/10 shadow-sm">
              {dailyZikr.theme.icon}
              <span>{dailyZikr.theme.label}</span>
            </div>
            
            <p className="font-quran text-lg md:text-xl leading-loose mb-6 drop-shadow-sm line-clamp-4">
              "{dailyZikr.item.text}"
            </p>
            
            <div className="flex items-center justify-center gap-2 text-white/90 text-sm font-medium">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs hover:bg-white/30 transition-colors">عرض الأذكار</span>
            </div>
          </div>
        </div>
        ) : (
            // Fallback to Verse if no zikr found
            <div className="relative group overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900"></div>
              <div className="relative p-6 text-white text-center">
                <p className="font-quran text-2xl md:text-3xl leading-loose mb-6 drop-shadow-sm">
                  "فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرًا"
                </p>
              </div>
            </div>
        )}

        {/* Last Read Section */}
        {lastRead ? (
           <div className="bg-white dark:bg-gray-800 p-1 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center pr-1 pl-4 gap-4 animate-in slide-in-from-bottom-2">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Book size={24} />
              </div>
              <div className="flex-1 py-3 cursor-pointer" onClick={resumeReading}>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">تابـع القـراءة</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">سورة {lastRead.surahName} • صفحة {formatNumber(lastRead.pageNumber, settings.numeralSystem)}</p>
              </div>
              <button onClick={resumeReading} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-emerald-500 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
           </div>
        ) : (
           <div className="bg-white dark:bg-gray-800 p-1 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center pr-1 pl-4 gap-4 opacity-75">
              <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl flex items-center justify-center text-gray-400">
                <Book size={24} />
              </div>
              <div className="flex-1 py-3">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">ابدأ القراءة</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">لم تقرأ شيئاً بعد</p>
              </div>
              <button onClick={() => { setActiveTab(Tab.QURAN); openSurah(SURAHS[0]); }} className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
           </div>
        )}

        {/* Continue Watching Section */}
        {lastWatchedSeries && (
            <div className="bg-white dark:bg-gray-800 p-1 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center pr-1 pl-4 gap-4 animate-in slide-in-from-bottom-3 mt-4">
                <div className="bg-rose-100 dark:bg-rose-900/30 w-16 h-16 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Tv size={24} />
                </div>
                <div className="flex-1 py-3 cursor-pointer" onClick={handleResumeWatching}>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">تابع المشاهدة</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lastWatchedSeries.title} • الحلقة {formatNumber(lastWatchedSeries.episode, settings.numeralSystem)}</p>
                </div>
                <button onClick={handleResumeWatching} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-emerald-500 hover:text-white transition-colors">
                    <Play size={20} fill="currentColor" />
                </button>
            </div>
        )}

        {/* Quick Access Grid */}
        <div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">الوصول السريع</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickLinkCard 
              title="سورة الكهف" 
              subtitle="نور بين الجمعتين"
              icon={<Book className="text-emerald-600" size={20} />}
              color="bg-emerald-50 dark:bg-emerald-900/20"
              onClick={() => openSurah(SURAHS[17])} 
            />
            <QuickLinkCard 
              title="المواقيت والقبلة" 
              subtitle="الصلاة والتقويم"
              icon={<Compass className="text-indigo-600" size={20} />}
              color="bg-indigo-50 dark:bg-indigo-900/20"
              onClick={() => setActiveTab(Tab.PRAYER)} 
            />
            <QuickLinkCard 
              title="قصص الأنبياء" 
              subtitle="عبرة وموعظة"
              icon={<Layers className="text-amber-600" size={20} />}
              color="bg-amber-50 dark:bg-amber-900/20"
              onClick={() => setActiveTab(Tab.STORIES)} 
            />
             <QuickLinkCard 
              title="القرآن الكريم" 
              subtitle="المصحف كاملاً"
              icon={<BookOpen className="text-teal-600" size={20} />}
              color="bg-teal-50 dark:bg-teal-900/20"
              onClick={() => setActiveTab(Tab.QURAN)} 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={onTabChange} settings={settings}>
      {renderContent()}
    </Layout>
  );
};

// Helper Components
const QuickLinkCard = ({ title, subtitle, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`p-4 rounded-2xl ${color} border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all text-right flex flex-col justify-between h-32 group`}>
    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 dark:text-white">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  </button>
);

export default App;
