
import { Reciter } from '../types';

export const RECITERS: Reciter[] = [
  // --- حفص عن عاصم (الأكثر انتشاراً) ---
  { id: 'alafasy', name: 'مشاري راشد العفاسي', subfolder: 'Alafasy_128kbps' },
  { id: 'ajmy', name: 'أحمد بن علي العجمي', subfolder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps' },
  { id: 'sudais', name: 'عبد الرحمن السديس', subfolder: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'shuraym', name: 'سعود الشريم', subfolder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'maher', name: 'ماهر المعيقلي', subfolder: 'MaherAlMuaiqly128kbps' },
  { id: 'yasser', name: 'ياسر الدوسري', subfolder: 'Yasser_Ad-Dussary_128kbps' },
  { id: 'ghamadi', name: 'سعد الغامدي', subfolder: 'Ghamadi_40kbps' },
  { id: 'fares', name: 'فارس عباد', subfolder: 'Fares_Abbad_64kbps' },
  { id: 'nasser', name: 'ناصر القطامي', subfolder: 'Nasser_Alqatami_128kbps' },
  { id: 'shatri', name: 'أبو بكر الشاطري', subfolder: 'Abu_Bakr_Ash-Shatri_128kbps' },

  // --- المصاحف المجودة والمرتلة (الجيل الذهبي) ---
  { id: 'husary', name: 'محمود خليل الحصري (مرتل)', subfolder: 'Husary_128kbps' },
  { id: 'husary_mujawwad', name: 'محمود خليل الحصري (مجود)', subfolder: 'Husary_128kbps_Mujawwad' },
  { id: 'minshawi', name: 'محمد صديق المنشاوي (مرتل)', subfolder: 'Minshawy_Murattal_128kbps' },
  { id: 'minshawi_mujawwad', name: 'محمد صديق المنشاوي (مجود)', subfolder: 'Minshawy_Mujawwad_192kbps' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد (مرتل)', subfolder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'abdulbasit_mujawwad', name: 'عبد الباسط عبد الصمد (مجود)', subfolder: 'Abdul_Basit_Mujawwad_128kbps' },

  // --- روايات أخرى (ورش وقالون) ---
  { id: 'yassin_warsh', name: 'ياسين الجزائري (ورش)', subfolder: 'Warsh_Yassin_Jazairi_64kbps' },
  { id: 'dokali_qaloon', name: 'الدكالي محمد العالم (قالون)', subfolder: 'Dookali_Mohammad_Al-Alim_128kbps' },

  // --- أئمة الحرمين والمساجد الكبرى ---
  { id: 'juhany', name: 'عبدالله الجهني', subfolder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps' },
  { id: 'hudhaify', name: 'علي الحذيفي', subfolder: 'Hudhaify_128kbps' },
  { id: 'ali_jaber', name: 'علي جابر', subfolder: 'Ali_Jaber_64kbps' },
  { id: 'ayyoub', name: 'محمد أيوب', subfolder: 'Muhammad_Ayyoub_128kbps' },
  { id: 'budair', name: 'صلاح البدير', subfolder: 'Salah_Al_Budair_128kbps' },
  
  // --- قراء آخرون ---
  { id: 'hani', name: 'هاني الرفاعي', subfolder: 'Hani_Rifai_192kbps' },
  { id: 'basfar', name: 'عبد الله بصفر', subfolder: 'Abdullah_Basfar_192kbps' },
  { id: 'bukhatir', name: 'صلاح بو خاطر', subfolder: 'Salah_Bukhatir_128kbps' },
  { id: 'suwayd', name: 'أيمن سويد', subfolder: 'Ayman_Sowaid_64kbps' },
  { id: 'jibreel', name: 'محمد جبريل', subfolder: 'Muhammad_Jibreel_128kbps' },
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
