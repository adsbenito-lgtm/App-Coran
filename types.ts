

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  transliteration: string;
  verses_count: number;
  revelation_place: string;
  startPage: number; // Page number in the Madani Mushaf
}

export interface Verse {
  id: number;
  text: string;
  translation: string;
  number: number;
  juz?: number;
  surah?: Surah; // Optional reference to surah
}

export interface QuranPage {
  number: number;
  ayahs: Verse[];
  surahs: { [key: number]: Surah }; // Map of surah ID to Surah object on this page
}

export interface Story {
  id: number;
  title: string;
  content: string;
  source?: string; // Quranic references
  videoUrl?: string; // Placeholder for video
}

export interface AzkarCategory {
  id: number;
  title: string;
  items: Zikr[];
}

export interface Zikr {
  id: number;
  text: string;
  count: number;
}

export interface LastReadState {
  surahId: number;
  pageNumber: number;
  surahName: string;
  timestamp: number;
}

export interface Reciter {
  id: string;
  name: string;
  subfolder: string; // The folder name in EveryAyah API
}

export interface PrayerTimesData {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  };
  date: {
    hijri: {
      day: string;
      month: {
        ar: string;
        number: number;
      };
      year: string;
      weekday: {
        ar: string;
      };
    };
    gregorian: {
      date: string;
      day: string;
      year: string;
      weekday: {
        en: string;
      };
      month: {
        en: string;
      }
    }
  };
  meta: {
      latitude: number;
      longitude: number;
      timezone: string;
  };
}

export type QuranFont = 'Amiri' | 'Noto Naskh Arabic' | 'Scheherazade New';
export type ReadingMode = 'list' | 'mushaf';
export type VerseNumberStyle = 'circle' | 'square' | 'flower';
export type TafseerId = 'ar.muyassar' | 'ar.jalalayn' | 'ar.qurtubi';

export interface AppSettings {
  darkMode: boolean;
  fontSize: number; // 1-5 scale for Quran text
  tafseerFontSize: number; // 1-5 scale for Tafseer text
  tafseerFontFamily: QuranFont; // Font family for Tafseer text
  fontFamily: QuranFont;
  readingMode: ReadingMode;
  verseNumberStyle: VerseNumberStyle;
  selectedTafseer: TafseerId;
  selectedReciter: string; // ID of the selected reciter
  numeralSystem: 'latin' | 'arabic'; // 'latin' = 123, 'arabic' = ١٢٣
}

export enum Tab {
  HOME = 'HOME',
  QURAN = 'QURAN',
  STORIES = 'STORIES',
  AZKAR = 'AZKAR',
  PRAYER = 'PRAYER',
  SETTINGS = 'SETTINGS',
}
