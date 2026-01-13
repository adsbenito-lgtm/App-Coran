import { Verse, QuranPage, Surah } from '../types';

interface ApiVerse {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
  };
}

// Fetch all verses for a specific Surah
export const fetchSurahVerses = async (surahId: number): Promise<Verse[]> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
    const data = await response.json();

    if (data.code === 200 && data.data && data.data.ayahs) {
      return data.data.ayahs.map((ayah: ApiVerse) => ({
        id: ayah.number,
        number: ayah.numberInSurah,
        text: ayah.text,
        translation: "",
        juz: ayah.juz
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch surah:", error);
    return [];
  }
};

// Fetch a specific page (1-604) matching standard Mushaf layout
export const fetchQuranPage = async (pageNumber: number): Promise<QuranPage | null> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
    const data = await response.json();

    if (data.code === 200 && data.data && data.data.ayahs) {
      const ayahs: Verse[] = data.data.ayahs.map((apiAyah: ApiVerse) => ({
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
      
      // Extract unique surahs on this page for headers
      const surahs: { [key: number]: Surah } = {};
      ayahs.forEach(ayah => {
          if (ayah.surah && !surahs[ayah.surah.id]) {
              surahs[ayah.surah.id] = ayah.surah;
          }
      });

      return {
        number: pageNumber,
        ayahs,
        surahs
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return null;
  }
};