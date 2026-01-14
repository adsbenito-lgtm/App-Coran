
import { Reciter } from '../types';

export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'مشاري راشد العفاسي', subfolder: 'Alafasy_128kbps' },
  { id: 'husary', name: 'محمود خليل الحصري', subfolder: 'Husary_128kbps_Mujawwad' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد', subfolder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'minshawi', name: 'محمد صديق المنشاوي', subfolder: 'Minshawy_Murattal_128kbps' },
  { id: 'shuraym', name: 'سعود الشريم', subfolder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'sudais', name: 'عبد الرحمن السديس', subfolder: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'ghamadi', name: 'سعد الغامدي', subfolder: 'Ghamadi_40kbps' },
];

export const getAudioUrl = (reciterId: string, surahNumber: number, verseNumber: number): string => {
  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  
  // Pad numbers with leading zeros (e.g., 1 -> 001)
  const paddedSurah = surahNumber.toString().padStart(3, '0');
  const paddedVerse = verseNumber.toString().padStart(3, '0');
  
  return `https://everyayah.com/data/${reciter.subfolder}/${paddedSurah}${paddedVerse}.mp3`;
};

export const getReciterName = (id: string): string => {
    return RECITERS.find(r => r.id === id)?.name || 'قارئ';
};
