
import { QuranPage, Verse, Surah } from '../types';
import { getAudioUrl } from './audioService';

const DB_NAME = 'AlBayanDB';
const DB_VERSION = 3; // Bump version for Audio store
const STORE_SURAHS = 'surahs';
const STORE_PAGES = 'pages';
const STORE_TAFSEER = 'tafseer';
const STORE_AUDIO = 'audio'; // New store for Audio Blobs

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Error opening database");

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_SURAHS)) {
        db.createObjectStore(STORE_SURAHS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        db.createObjectStore(STORE_PAGES, { keyPath: 'number' });
      }
      if (!db.objectStoreNames.contains(STORE_TAFSEER)) {
        db.createObjectStore(STORE_TAFSEER, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        // Key format: "reciterId:surahId:verseId"
        db.createObjectStore(STORE_AUDIO); 
      }
    };
  });
};

export const saveFullQuranOffline = async (progressCallback: (msg: string) => void): Promise<boolean> => {
  try {
    progressCallback("جاري الاتصال بقاعدة البيانات...");
    const db = await openDB();

    progressCallback("جاري تحميل المصحف كاملاً (قد يستغرق لحظات)...");
    const response = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
    if (!response.ok) throw new Error("فشل التحميل من الخادم");
    const json = await response.json();
    
    if (!json.data || !json.data.surahs) throw new Error("بيانات غير صالحة");

    const surahsRaw = json.data.surahs;
    
    progressCallback("جاري معالجة البيانات وتخزينها محلياً...");

    const tx = db.transaction([STORE_SURAHS, STORE_PAGES], 'readwrite');
    const surahStore = tx.objectStore(STORE_SURAHS);
    const pageStore = tx.objectStore(STORE_PAGES);

    const pagesMap: Record<number, Verse[]> = {};
    const surahsOnPage: Record<number, Record<number, Surah>> = {};

    for (const s of surahsRaw) {
      const surahObj: Surah = {
         id: s.number,
         name: s.name,
         englishName: s.englishName,
         transliteration: s.englishNameTranslation,
         verses_count: s.numberOfAyahs,
         revelation_place: s.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
         startPage: 0 
      };

      const verses: Verse[] = s.ayahs.map((a: any) => ({
          id: a.number,
          number: a.numberInSurah,
          text: a.text,
          translation: '',
          juz: a.juz,
          surah: surahObj
      }));
      
      surahStore.put({ id: s.number, verses: verses, info: surahObj });

      for (const a of s.ayahs) {
          const pageNum = a.page;
          if (!pagesMap[pageNum]) {
              pagesMap[pageNum] = [];
              surahsOnPage[pageNum] = {};
          }
          
          const v: Verse = {
              id: a.number,
              number: a.numberInSurah,
              text: a.text,
              translation: '',
              juz: a.juz,
              surah: surahObj
          };
          
          pagesMap[pageNum].push(v);
          surahsOnPage[pageNum][surahObj.id] = surahObj;
      }
    }

    const pageNumbers = Object.keys(pagesMap).map(Number);
    for (const pNum of pageNumbers) {
        const pageData: QuranPage = {
            number: pNum,
            ayahs: pagesMap[pNum],
            surahs: surahsOnPage[pNum]
        };
        pageStore.put(pageData);
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("خطأ في حفظ البيانات");
    });

  } catch (error) {
    console.error(error);
    return false;
  }
};

export const saveTafseerOffline = async (progressCallback: (msg: string) => void): Promise<boolean> => {
    try {
        progressCallback("جاري الاتصال بقاعدة البيانات...");
        const db = await openDB();

        progressCallback("جاري تحميل التفسير الميسر...");
        const response = await fetch('https://api.alquran.cloud/v1/quran/ar.muyassar');
        if (!response.ok) throw new Error("فشل التحميل من الخادم");
        const json = await response.json();

        if (!json.data || !json.data.surahs) throw new Error("بيانات غير صالحة");

        progressCallback("جاري تخزين التفسير...");
        const tx = db.transaction(STORE_TAFSEER, 'readwrite');
        const store = tx.objectStore(STORE_TAFSEER);

        for (const s of json.data.surahs) {
            const versesMap: Record<number, string> = {};
            s.ayahs.forEach((a: any) => {
                versesMap[a.numberInSurah] = a.text;
            });
            store.put({ id: s.number, verses: versesMap });
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject("خطأ في حفظ التفسير");
        });

    } catch (error) {
        console.error(error);
        return false;
    }
};

// New Function: Save Audio for specific Reciter (Alafasy)
export const saveReciterAudioOffline = async (reciterId: string, progressCallback: (msg: string) => void): Promise<boolean> => {
    try {
        const db = await openDB();
        
        // 1. Get Meta Data (Verse counts per Surah)
        progressCallback("جاري جلب بيانات السور...");
        const metaResponse = await fetch('https://api.alquran.cloud/v1/meta');
        const metaJson = await metaResponse.json();
        
        if (!metaJson.data || !metaJson.data.surahs) throw new Error("فشل في جلب البيانات");
        const surahsMeta = metaJson.data.surahs.references; // Array of { number, name, numberOfAyahs, ... }

        // 2. Iterate and Download
        for (const surah of surahsMeta) {
            progressCallback(`جاري تحميل ${surah.name} (${surah.numberOfAyahs} آية)...`);
            
            const promises = [];
            for (let i = 1; i <= surah.numberOfAyahs; i++) {
                promises.push(downloadAndStoreVerse(db, reciterId, surah.number, i));
            }
            
            // Wait for current Surah to finish before starting next to avoid network congestion
            await Promise.all(promises);
        }

        return true;
    } catch (error) {
        console.error("Audio download failed", error);
        return false;
    }
};

const downloadAndStoreVerse = async (db: IDBDatabase, reciterId: string, surah: number, verse: number): Promise<void> => {
    try {
        const url = getAudioUrl(reciterId, surah, verse);
        const response = await fetch(url);
        if (!response.ok) return;
        
        const blob = await response.blob();
        const key = `${reciterId}:${surah}:${verse}`;
        
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_AUDIO, 'readwrite');
            const store = tx.objectStore(STORE_AUDIO);
            store.put(blob, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve(); // Resolve anyway to continue
        });
    } catch (e) {
        // Ignore single failure to keep going
    }
};

export const checkQuranDownloaded = async (): Promise<boolean> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_SURAHS, 'readonly');
            const store = tx.objectStore(STORE_SURAHS);
            const countReq = store.count();
            countReq.onsuccess = () => resolve(countReq.result === 114);
            countReq.onerror = () => resolve(false);
        });
    } catch { return false; }
};

export const checkTafseerDownloaded = async (): Promise<boolean> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            if (!db.objectStoreNames.contains(STORE_TAFSEER)) { resolve(false); return; }
            const tx = db.transaction(STORE_TAFSEER, 'readonly');
            const countReq = tx.objectStore(STORE_TAFSEER).count();
            countReq.onsuccess = () => resolve(countReq.result === 114);
            countReq.onerror = () => resolve(false);
        });
    } catch { return false; }
};

export const checkAudioDownloaded = async (reciterId: string): Promise<boolean> => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(STORE_AUDIO)) return false;
        
        // Simple check: check if Fatiha Verse 1 and Nas Verse 6 exist
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_AUDIO, 'readonly');
            const store = tx.objectStore(STORE_AUDIO);
            const req1 = store.get(`${reciterId}:1:1`);
            
            req1.onsuccess = () => {
                if (req1.result) {
                     const req2 = store.get(`${reciterId}:114:6`);
                     req2.onsuccess = () => resolve(!!req2.result);
                     req2.onerror = () => resolve(false);
                } else {
                    resolve(false);
                }
            };
            req1.onerror = () => resolve(false);
        });
    } catch { return false; }
};

export const clearOfflineData = async (): Promise<boolean> => {
    try {
        const db = await openDB();
        const storeNames = [STORE_SURAHS, STORE_PAGES];
        if (db.objectStoreNames.contains(STORE_TAFSEER)) storeNames.push(STORE_TAFSEER);
        // Do NOT clear audio here, separate function
        const tx = db.transaction(storeNames, 'readwrite');
        storeNames.forEach(s => tx.objectStore(s).clear());
        return new Promise(resolve => { tx.oncomplete = () => resolve(true); });
    } catch { return false; }
};

export const clearOfflineTafseer = async (): Promise<boolean> => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(STORE_TAFSEER)) return true;
        const tx = db.transaction(STORE_TAFSEER, 'readwrite');
        tx.objectStore(STORE_TAFSEER).clear();
        return new Promise(resolve => { tx.oncomplete = () => resolve(true); });
    } catch { return false; }
};

export const clearOfflineAudio = async (reciterId: string): Promise<boolean> => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(STORE_AUDIO)) return true;
        
        // Since we store simple keys, clearing all audio is easier than filtering by reciter index
        // For this specific request, we assume clearing audio clears it all or we iterate keys.
        // Clearing all is safer for performance in simple app.
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        tx.objectStore(STORE_AUDIO).clear();
        return new Promise(resolve => { tx.oncomplete = () => resolve(true); });
    } catch { return false; }
};

// Getters
export const getOfflineSurah = async (id: number): Promise<Verse[] | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_SURAHS, 'readonly');
            const req = tx.objectStore(STORE_SURAHS).get(id);
            req.onsuccess = () => resolve(req.result?.verses || null);
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
};

export const getOfflinePage = async (page: number): Promise<QuranPage | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_PAGES, 'readonly');
            const req = tx.objectStore(STORE_PAGES).get(page);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
};

export const getOfflineTafseerText = async (surahId: number, verseNumber: number): Promise<string | null> => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(STORE_TAFSEER)) return null;
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_TAFSEER, 'readonly');
            const req = tx.objectStore(STORE_TAFSEER).get(surahId);
            req.onsuccess = () => resolve(req.result?.verses[verseNumber] || null);
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
};

export const getOfflineAudioBlob = async (reciterId: string, surah: number, verse: number): Promise<Blob | null> => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(STORE_AUDIO)) return null;
        return new Promise((resolve) => {
            const key = `${reciterId}:${surah}:${verse}`;
            const tx = db.transaction(STORE_AUDIO, 'readonly');
            const req = tx.objectStore(STORE_AUDIO).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
};
