
import { Verse, QuranPage, Surah } from '../types';
import { OFFLINE_PAGES } from './offlineQuran';
import { getOfflineSurah, getOfflinePage, getOfflineTafseerText } from './offlineService';

const tafseerCache: Record<string, Record<number, string>> = {};

// ID mapping for Quran.com API (Used as Fallback)
const QURAN_COM_IDS: Record<string, number> = {
    'ar.muyassar': 169, // Tafseer Al-Muyassar
    'ar.jalalayn': 164, // Tafseer Al-Jalalayn
    'ar.qurtubi': 167    // Tafseer Al-Qurtubi
};

export const fetchSurahVerses = async (surahId: number): Promise<Verse[]> => {
  // 1. Check Offline DB (IndexedDB)
  const localData = await getOfflineSurah(surahId);
  if (localData) return localData;

  // 2. Fetch API
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
    if (!response.ok) throw new Error("Network");
    const data = await response.json();
    if (data.data?.ayahs) {
      return data.data.ayahs.map((ayah: any) => ({
        id: ayah.number, number: ayah.numberInSurah, text: ayah.text, translation: "", juz: ayah.juz
      }));
    }
    return [];
  } catch (error) {
    // 3. Fallback to Partial Offline Data (offlineQuran.ts)
    const offlineVerses: Verse[] = [];
    Object.values(OFFLINE_PAGES).forEach(pageVerses => {
        pageVerses.forEach(v => {
            if (v.surah && v.surah.id === surahId) offlineVerses.push(v);
        });
    });
    return offlineVerses.length > 0 ? offlineVerses.sort((a, b) => a.number - b.number) : [];
  }
};

export const fetchQuranPage = async (pageNumber: number): Promise<QuranPage | null> => {
  // 1. Check Offline DB
  const localPage = await getOfflinePage(pageNumber);
  if (localPage) return localPage;

  // 2. Check Partial Static Data
  if (OFFLINE_PAGES[pageNumber]) return constructPageFromOffline(pageNumber, OFFLINE_PAGES[pageNumber]);
  
  // 3. Fetch API
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
    if (!response.ok) throw new Error("Network");
    const data = await response.json();
    if (data.data?.ayahs) {
      const ayahs: Verse[] = data.data.ayahs.map((apiAyah: any) => ({
        id: apiAyah.number,
        number: apiAyah.numberInSurah,
        text: apiAyah.text,
        translation: "",
        juz: apiAyah.juz,
        surah: {
            id: apiAyah.surah.number,
            name: apiAyah.surah.name,
            englishName: apiAyah.surah.englishName,
            transliteration: apiAyah.surah.englishName,
            verses_count: apiAyah.surah.numberOfAyahs,
            revelation_place: apiAyah.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'
        }
      }));
      const surahs: { [key: number]: Surah } = {};
      ayahs.forEach(ayah => { if (ayah.surah && !surahs[ayah.surah.id]) surahs[ayah.surah.id] = ayah.surah; });
      return { number: pageNumber, ayahs, surahs };
    }
    return null;
  } catch (error) { return null; }
};

function constructPageFromOffline(pageNumber: number, verses: Verse[]): QuranPage {
    const surahs: { [key: number]: Surah } = {};
    verses.forEach(v => {
        if (v.surah && !surahs[v.surah.id]) {
             surahs[v.surah.id] = {
                 ...v.surah,
                 name: getSurahNameById(v.surah.id),
                 englishName: '', transliteration: '', verses_count: 0, revelation_place: '', startPage: 0
             };
        }
    });
    return { number: pageNumber, ayahs: verses, surahs };
}

function getSurahNameById(id: number): string {
    const names: Record<number, string> = {
        1: "الفاتحة", 18: "الكهف", 36: "يس", 67: "الملك", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
    };
    return names[id] || `سورة ${id}`;
}

// Validator to ensure text is primarily Arabic
function isArabicContent(text: string): boolean {
    if (!text) return false;
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    // Reject if it looks like English text (more than 3 english words sequence)
    const isEnglish = /[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(text); 
    return hasArabic && !isEnglish;
}

export const fetchTafseer = async (surahId: number, verseNumber: number, edition: string): Promise<string> => {
  const surahKey = `${edition}:${surahId}`;
  
  // 1. Check Offline DB (Only for Muyassar currently)
  if (edition === 'ar.muyassar') {
      const offlineText = await getOfflineTafseerText(surahId, verseNumber);
      if (offlineText) return offlineText;
  }

  // 2. Check Memory Cache
  if (tafseerCache[surahKey] && tafseerCache[surahKey][verseNumber]) {
      return tafseerCache[surahKey][verseNumber];
  }

  // Helper function to update cache and return
  const cacheAndReturn = (text: string) => {
      if (!tafseerCache[surahKey]) tafseerCache[surahKey] = {};
      tafseerCache[surahKey][verseNumber] = text;
      return text;
  };

  // 3. Try AlQuran.Cloud First (Most reliable for Arabic Text: Muyassar, Jalalayn, IbnKathir)
  try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${verseNumber}/${edition}`);
      if (response.ok) {
          const json = await response.json();
          if (json.status === 'OK' && json.data && json.data.text) {
             return cacheAndReturn(json.data.text);
          }
      }
  } catch (e) {
      // Ignore and try fallback
  }

  // 4. Fallback: Quran.com API
  const targetId = QURAN_COM_IDS[edition] || 169;
  try {
      const url = `https://api.quran.com/api/v4/tafsirs/${targetId}/by_ayah/${surahId}:${verseNumber}`;
      const response = await fetch(url);
      
      if (response.ok) {
          const data = await response.json();
          if (data && data.tafsir && data.tafsir.text) {
              const cleanedText = data.tafsir.text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
              if (isArabicContent(cleanedText)) {
                  return cacheAndReturn(cleanedText);
              }
          }
      }
  } catch (e) {
      console.error("All Tafseer sources failed", e);
  }

  return "عذراً، التفسير يتطلب اتصالاً بالإنترنت.";
};
