Al-Bayan Islamic Companion (البيان - رفيق المسلم)
![alt text](https://via.placeholder.com/1200x600?text=Al-Bayan+Islamic+App)
<!-- يمكنك استبدال هذا برابط لصورة حقيقية من التطبيق -->
Al-Bayan is a comprehensive, modern Islamic web application designed to be your daily spiritual companion. Built with React, TypeScript, and Tailwind CSS, it offers a seamless and aesthetically pleasing experience for reading the Quran, listening to recitations, tracking prayer times, and more—completely offline-capable.
✨ Key Features
📖 Noble Quran (Mushaf & List Mode)
Two Reading Modes:
Mushaf Mode: Experience the traditional feel of a physical Mushaf with page-flip animations and standard Madani pagination (604 pages).
List Mode: A continuous scrolling list of verses for quick reading and easy access.
Tafseer (Interpretation): Instant access to Tafseer Al-Muyassar, Al-Jalalayn, and Al-Qurtubi for any verse.
AI-Powered Insights: (Optional) Integration with Google Gemini API to provide concise, AI-generated explanations and lessons from verses.
Bookmark & Last Read: Automatically saves your last read page or verse to resume exactly where you left off.
🎧 Audio Recitations
Diverse Reciters: Listen to the Quran in the voices of over 15 world-renowned reciters (e.g., Al-Afasy, Al-Sudais, Al-Minshawi, Al-Husary).
Offline Support: Download full Surahs or the entire Quran for offline listening.
Verse-by-Verse Playback: Audio is synchronized with text; verses highlight as they are recited.
🕌 Prayer Times & Qibla
Accurate Timings: Automatic prayer times calculation based on your geographical location (using Umm Al-Qura standard).
Qibla Compass: A visual compass to help you find the Qibla direction from anywhere.
Hijri Calendar: View the current Hijri date and a monthly prayer timetable.
🤲 Azkar & Dua (Remembrances)
Dynamic Daily Azkar: The home screen automatically suggests relevant Azkar based on the time of day (Morning, Evening, Sleep).
Comprehensive Library: Access a wide range of Azkar from Hisn Al-Muslim (Fortress of the Muslim), categorized for easy navigation.
Counters: Built-in digital tasbeeh counters for each Zikr with progress tracking.
📺 Islamic Stories & Media
Video Series: Watch curated educational series like "Stories of the Prophets" and "Seerah" directly within the app.
Progress Tracking: Remembers the last episode and timestamp you watched, so you can continue seamlessly.
⚙️ Customization & Accessibility
Dark/Light Mode: Full support for dark mode to reduce eye strain at night.
Font Customization: Choose from multiple beautiful Arabic fonts (Amiri, Noto Naskh, Uthmani) and adjust font sizes.
Offline First: Designed to work without an internet connection after initial content download.
PWA Ready: Can be installed on mobile devices as a Progressive Web App.
🛠️ Technology Stack
Frontend: React 18, TypeScript, Vite (or Create React App)
Styling: Tailwind CSS, Lucide React (Icons)
State Management: React Hooks (useState, useEffect, useContext)
Storage: IndexedDB (for offline audio/text), LocalStorage (for settings/preferences)
APIs:
api.alquran.cloud (Quran Text & Metadata)
api.aladhan.com (Prayer Times & Calendar)
everyayah.com (Audio Recitations)
Google Gemini API (AI Features)
🚀 How It Works
Initialization: Upon first load, the app attempts to fetch prayer times based on location.
Navigation: Use the bottom navigation bar to switch between the Dashboard, Quran, Prayer Times, Azkar, Stories, and Settings.
Reading: Select a Surah or Page. In Mushaf mode, swipe or click to flip pages. Click any verse to see Tafseer or play audio.
Offline Mode: Go to Settings > Offline Management to download Quran text, Tafseer, and Audio files. Once downloaded, the app switches to local IndexedDB data automatically when offline.
📦 Installation & Setup
To run this project locally:
Clone the repository:
code
Bash
git clone https://github.com/your-username/al-bayan-app.git
cd al-bayan-app
Install dependencies:
code
Bash
npm install
# or
yarn install
Set up Environment Variables:
Create a .env file in the root directory and add your Google Gemini API key (optional, for AI features):
code
Env
VITE_API_KEY=your_gemini_api_key_here
Start the development server:
code
Bash
npm start
# or
npm run dev
Open in Browser:
Navigate to http://localhost:3000 (or the port shown in your terminal).
🤝 Contributing
Contributions are welcome! Whether it's reporting bugs, suggesting features, or submitting pull requests, your help is appreciated to make this app better for everyone.
📄 License
This project is open-source and available under the MIT License.
Made with ❤️ for the Ummah.
