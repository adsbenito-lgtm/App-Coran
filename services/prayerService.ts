
import { PrayerTimesData } from '../types';

// Default to Mecca coordinates if geolocation fails
const DEFAULT_LAT = 21.4225;
const DEFAULT_LNG = 39.8262;

export const fetchPrayerTimes = async (lat: number | null, lng: number | null): Promise<PrayerTimesData | null> => {
  try {
    const latitude = lat || DEFAULT_LAT;
    const longitude = lng || DEFAULT_LNG;
    
    // Method 4 is Umm Al-Qura University, Makkah (common standard)
    // We fetch for the current timestamp
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

export const formatTime12H = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
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
        const [h, m] = timings[prayer].split(':');
        const prayerMinutes = parseInt(h) * 60 + parseInt(m);
        
        if (prayerMinutes > currentMinutes) {
            return prayer;
        }
    }
    return 'Fajr'; // If all passed, next is Fajr tomorrow
};
