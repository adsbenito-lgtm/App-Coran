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

export type QuranFont = 'Amiri' | 'Noto Naskh Arabic' | 'Scheherazade New';
export type ReadingMode = 'list' | 'mushaf';

export interface AppSettings {
  darkMode: boolean;
  fontSize: number; // 1-5 scale
  fontFamily: QuranFont;
  readingMode: ReadingMode;
}

export enum Tab {
  HOME = 'HOME',
  QURAN = 'QURAN',
  STORIES = 'STORIES',
  AZKAR = 'AZKAR',
  BOOKS = 'BOOKS',
  SETTINGS = 'SETTINGS',
}