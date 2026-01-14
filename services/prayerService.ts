
import { PrayerTimesData } from '../types';

// Default to Mecca coordinates if geolocation fails
const DEFAULT_LAT = 21.4225;
const DEFAULT_LNG = 39.8262;

export const fetchPrayerTimes = async (lat: number | null, lng: number | null): Promise<PrayerTimesData | null> => {
  try {
    const latitude = lat || DEFAULT_LAT;
    const longitude = lng || DEFAULT_LNG;
    
    // Method 4 is Umm Al-Qura University, Makkah (common standard)
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=4`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch prayer times');
    
    const data = await response.json();
    if (data.code === 200 && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Prayer API Error:", error);
    return null;
  }
};

export const fetchMonthlyPrayerCalendar = async (lat: number | null, lng: number | null, month: number, year: number): Promise<PrayerTimesData[]> => {
    try {
        const latitude = lat || DEFAULT_LAT;
        const longitude = lng || DEFAULT_LNG;
        
        const url = `https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=4&month=${month}&year=${year}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch calendar');
        
        const data = await response.json();
        if (data.code === 200 && data.data) {
          return data.data;
        }
        return [];
    } catch (error) {
        console.error("Calendar API Error:", error);
        return [];
    }
};

export const formatTime12H = (time24: string): string => {
    if (!time24) return '';
    // Handle edge case where time might have (EST) or timezone info
    const cleanTime = time24.split(' ')[0]; 
    const [hours, minutes] = cleanTime.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'م' : 'ص';
    const adjustedHour = h % 12 || 12;
    return `${adjustedHour}:${minutes} ${suffix}`;
};

export const getNextPrayer = (timings: any): string => {
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const prayer of prayers) {
        const cleanTime = timings[prayer].split(' ')[0];
        const [h, m] = cleanTime.split(':');
        const prayerMinutes = parseInt(h) * 60 + parseInt(m);
        
        if (prayerMinutes > currentMinutes) {
            return prayer;
        }
    }
    return 'Fajr'; // If all passed, next is Fajr tomorrow
};
