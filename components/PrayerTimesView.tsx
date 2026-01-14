
import React, { useEffect, useState } from 'react';
import { PrayerTimesData, AppSettings } from '../types';
import { Clock, Calendar as CalendarIcon, MapPin, Navigation, Sunrise, Sun, Sunset, Moon, CloudMoon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatTime12H, getNextPrayer, fetchMonthlyPrayerCalendar } from '../services/prayerService';
import { formatNumber } from '../utils/number';

interface PrayerTimesViewProps {
  prayerTimes: PrayerTimesData | null; // Initial data for today
  locationName: string;
  settings: AppSettings;
}

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const EN_TO_AR_WEEKDAYS: Record<string, string> = {
  'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين',
  'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس',
  'Friday': 'الجمعة'
};

const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ prayerTimes, locationName, settings }) => {
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  
  // Calendar State
  const [currentViewDate, setCurrentViewDate] = useState(new Date()); // Controls the month being viewed
  const [calendarData, setCalendarData] = useState<PrayerTimesData[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<PrayerTimesData | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Initialize with today's data provided by parent
  useEffect(() => {
    if (prayerTimes && !selectedDayData) {
        setSelectedDayData(prayerTimes);
        
        // Calculate Qibla based on initial data
        const KAABA_LAT = 21.422487;
        const KAABA_LNG = 39.826206;
        const angle = calculateQibla(prayerTimes.meta.latitude, prayerTimes.meta.longitude, KAABA_LAT, KAABA_LNG);
        setQiblaAngle(angle);
    }
  }, [prayerTimes]);

  // Fetch Calendar Data when Month/Year changes
  useEffect(() => {
    const fetchCal = async () => {
        setLoadingCalendar(true);
        const lat = prayerTimes?.meta.latitude || null;
        const lng = prayerTimes?.meta.longitude || null;
        const month = currentViewDate.getMonth() + 1; // API is 1-indexed
        const year = currentViewDate.getFullYear();
        
        const data = await fetchMonthlyPrayerCalendar(lat, lng, month, year);
        setCalendarData(data);
        setLoadingCalendar(false);
    };

    fetchCal();
  }, [currentViewDate, prayerTimes?.meta.latitude]);

  const calculateQibla = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);
    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
    let qibla = toDeg(Math.atan2(y, x));
    return (qibla + 360) % 360;
  };

  const changeMonth = (direction: 'next' | 'prev') => {
      const newDate = new Date(currentViewDate);
      if (direction === 'next') {
          newDate.setMonth(newDate.getMonth() + 1);
      } else {
          newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentViewDate(newDate);
  };

  const isToday = (dateString: string) => {
      const today = new Date();
      // Format: DD-MM-YYYY in API usually
      const [d, m, y] = dateString.split('-');
      return parseInt(d) === today.getDate() && 
             parseInt(m) === (today.getMonth() + 1) && 
             parseInt(y) === today.getFullYear();
  };

  const isSelected = (dateString: string) => {
      if (!selectedDayData) return false;
      return selectedDayData.date.gregorian.date === dateString;
  };

  if (!prayerTimes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
        <p>جاري تحديد الموقع وحساب المواقيت...</p>
      </div>
    );
  }

  const prayersList = [
    { key: 'Fajr', name: 'الفجر', icon: <CloudMoon size={20} className="text-blue-400" /> },
    { key: 'Sunrise', name: 'الشروق', icon: <Sunrise size={20} className="text-orange-400" /> },
    { key: 'Dhuhr', name: 'الظهر', icon: <Sun size={20} className="text-yellow-500" /> },
    { key: 'Asr', name: 'العصر', icon: <Sun size={20} className="text-orange-300" /> },
    { key: 'Maghrib', name: 'المغرب', icon: <Sunset size={20} className="text-red-400" /> },
    { key: 'Isha', name: 'العشاء', icon: <Moon size={20} className="text-indigo-400" /> },
  ];

  // Helper to align grid
  const getFirstDayOfMonth = () => {
      const firstDay = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1);
      return firstDay.getDay(); // 0 (Sun) - 6 (Sat)
  };
  
  const displayMonthName = `${MONTHS_AR[currentViewDate.getMonth()]} ${formatNumber(currentViewDate.getFullYear(), settings.numeralSystem)}`;

  // Current displayed data (defaults to selected, falls back to today)
  const displayData = selectedDayData || prayerTimes;
  const isTodayData = isToday(displayData.date.gregorian.date);
  // Only calculate next prayer if we are looking at today's data
  const nextPrayerName = isTodayData ? getNextPrayer(displayData.timings) : '';

  // Get Arabic Weekday Name safely
  const weekdayName = EN_TO_AR_WEEKDAYS[displayData.date.gregorian.weekday.en] || displayData.date.hijri.weekday.ar;

  return (
    <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto animate-fade-in">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 font-quran">التقويم والمواقيت</h2>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <MapPin size={14} /> {locationName}
            </div>
          </div>
          <div className="text-left">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                  {formatNumber(displayData.date.hijri.day, settings.numeralSystem)} {displayData.date.hijri.month.ar}
              </div>
              <div className="text-xs text-gray-500">
                  {formatNumber(displayData.date.hijri.year, settings.numeralSystem)} هـ
              </div>
          </div>
      </div>

      {/* Calendar Widget */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <button onClick={() => changeMonth('prev')} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors">
                  <ChevronRight size={20} className="text-gray-600 dark:text-gray-300 rtl:rotate-180" />
              </button>
              <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <CalendarIcon size={18} className="text-emerald-500" />
                  <span className="font-sans">{displayMonthName}</span>
              </div>
              <button onClick={() => changeMonth('next')} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors">
                  <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300 rtl:rotate-180" />
              </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
              {loadingCalendar ? (
                  <div className="h-64 flex items-center justify-center">
                      <Loader2 className="animate-spin text-emerald-500" size={32} />
                  </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 mb-2 text-center">
                      {WEEKDAYS_AR.map(day => (
                          <div key={day} className="text-[10px] text-gray-400 font-bold">{day}</div>
                      ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {/* Empty cells for offset */}
                      {Array.from({ length: getFirstDayOfMonth() }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square"></div>
                      ))}
                      
                      {/* Days */}
                      {calendarData.map((dayData, idx) => {
                          const isTodayCell = isToday(dayData.date.gregorian.date);
                          const isSelectedCell = isSelected(dayData.date.gregorian.date);
                          
                          return (
                              <button
                                  key={idx}
                                  onClick={() => setSelectedDayData(dayData)}
                                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 border
                                      ${isSelectedCell 
                                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105 z-10' 
                                          : isTodayCell 
                                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700'
                                              : 'bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-transparent hover:border-emerald-200 dark:hover:border-gray-600'
                                      }
                                  `}
                              >
                                  <span className={`text-sm md:text-base font-bold font-sans`}>
                                      {formatNumber(parseInt(dayData.date.gregorian.day), settings.numeralSystem)}
                                  </span>
                                  <span className={`text-[8px] md:text-[10px] ${isSelectedCell ? 'text-emerald-100' : 'text-gray-400'}`}>
                                      {formatNumber(dayData.date.hijri.day, settings.numeralSystem)}
                                  </span>
                                  {/* Dot for today */}
                                  {isTodayCell && !isSelectedCell && (
                                      <div className="absolute bottom-1 w-1 h-1 bg-amber-500 rounded-full"></div>
                                  )}
                              </button>
                          );
                      })}
                  </div>
                </>
              )}
          </div>
      </div>

      {/* Selected Day Details */}
      <div className="grid md:grid-cols-2 gap-4">
          
          {/* Prayer Times List */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 border-b border-emerald-100 dark:border-emerald-900/30 text-center">
                 <h3 className="font-bold text-emerald-800 dark:text-emerald-300">
                     أوقات الصلاة ليوم {weekdayName}
                 </h3>
                 <p className="text-xs text-gray-500 font-sans">
                    {formatNumber(displayData.date.gregorian.date, settings.numeralSystem)}
                 </p>
             </div>
             
             <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                 {prayersList.map((prayer) => {
                     const isNext = nextPrayerName === prayer.key;
                     return (
                         <div key={prayer.key} className={`flex items-center justify-between p-3.5 ${isNext ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                             <div className="flex items-center gap-3">
                                 <div className={`p-1.5 rounded-lg ${isNext ? 'bg-amber-200 dark:bg-amber-800 text-amber-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                     {prayer.icon}
                                 </div>
                                 <span className={`font-bold ${isNext ? 'text-amber-800 dark:text-amber-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                     {prayer.name}
                                 </span>
                             </div>
                             <span className="font-bold font-sans text-gray-800 dark:text-white" dir="ltr">
                                 {formatNumber(formatTime12H(displayData.timings[prayer.key]), settings.numeralSystem)}
                             </span>
                         </div>
                     )
                 })}
             </div>
          </div>

          {/* Qibla Compass (Smaller) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-transparent dark:from-emerald-900/10 pointer-events-none"></div>
             
             <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4 z-10">
                 <Navigation size={18} className="text-emerald-500" />
                 اتجاه القبلة
             </h3>

             <div className="relative w-40 h-40 z-10">
                  <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center">
                      <div className="absolute top-1 text-gray-300 text-[10px] font-bold">N</div>
                  </div>
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-out"
                    style={{ transform: `rotate(${qiblaAngle}deg)` }}
                  >
                      <div className="flex flex-col items-center -mt-16 animate-compass-float">
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[12px] border-b-emerald-500 border-r-[6px] border-r-transparent mb-1"></div>
                          <div className="bg-black rounded-md w-6 h-8 flex items-center justify-center border border-amber-400 relative overflow-hidden shadow-lg">
                              <div className="absolute top-0.5 w-full h-[1px] bg-amber-400"></div>
                              <div className="w-2 h-2 border border-amber-400 rounded-full"></div>
                          </div>
                      </div>
                  </div>
             </div>
             <div className="mt-4 text-emerald-600 dark:text-emerald-400 font-bold font-sans text-lg z-10">
                 {formatNumber(Math.round(qiblaAngle), settings.numeralSystem)}°
             </div>
          </div>

      </div>
    </div>
  );
};

export default PrayerTimesView;
