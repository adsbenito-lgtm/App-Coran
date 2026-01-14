
import React, { useState } from 'react';
import { Story, AppSettings } from '../types';
import { Book, Video, PlayCircle, FileText, Bookmark, Quote, ChevronRight, ChevronLeft } from 'lucide-react';

interface StoriesViewProps {
  settings: AppSettings;
}

const PROPHET_STORIES: Story[] = [
  { 
    id: 1, 
    title: "قصة آدم عليه السلام", 
    content: `بدأت القصة حين أخبر الله ملائكته بأنه سيخلق بشراً من طين ليكون خليفة في الأرض. تعجبت الملائكة وسألت: "أتجعل فيها من يفسد فيها ويسفك الدماء ونحن نسبح بحمدك؟"، فقال الله تعالى: "إني أعلم ما لا تعلمون".
    
    خلق الله آدم من تراب، ثم نفخ فيه من روحه، وعلمه الأسماء كلها. أمر الله الملائكة بالسجود لآدم تكريماً له، فسجدوا جميعاً إلا إبليس، الذي تكبر ورفض السجود قائلاً: "أنا خير منه، خلقتني من نار وخلقته من طين".
    
    طرد الله إبليس من رحمته، فتوعد إبليس بإغواء آدم وذريته. أسكن الله آدم وزوجه حواء الجنة، وأباح لهما الأكل من كل ثمارها إلا شجرة واحدة. لكن الشيطان وسوس لهما وأقنعهما أن الأكل منها سيجعلهما خالدين أو ملكين.
    
    أكل آدم وحواء من الشجرة، فبدت لهما سوآتهما، وندما ندماً شديداً. تاب الله عليهما، لكنه أمرهما بالهبوط إلى الأرض ليعمراها وليكونا فيها خلفاء، وبدأت رحلة البشرية على الأرض في صراع دائم بين الحق والباطل، وبين اتباع هدى الله ووساوس الشيطان.`,
    source: "القرآن الكريم: سورة البقرة (30-38)، سورة الأعراف (11-25)، سورة طه (115-123)."
  },
  { 
    id: 2, 
    title: "قصة نوح عليه السلام", 
    content: `بعث الله نوحاً عليه السلام إلى قومه بعد أن انتشرت عبادة الأصنام (ود، وسواع، ويغوث، ويعوق، ونسر). دعا نوح قومه إلى عبادة الله وحده وترك الأصنام، واستمر في دعوتهم 950 عاماً، ليلاً ونهاراً، سراً وعلانية.
    
    لم يؤمن معه إلا قليل، أما الأغلبية الكافرة - بمن فيهم زوجته وابنه - فقد استهزأوا به وآذوه. أوحى الله إلى نوح أنه لن يؤمن من قومه إلا من قد آمن، وأمره بصنع سفينة عظيمة في وسط الصحراء. كان الكفار يمرون عليه ويسخرون منه: "يا نوح، صرت نجاراً بعد أن كنت نبياً؟ وتصنع سفينة ولا يوجد ماء؟".
    
    جاء أمر الله وفار التنور، وحمل نوح في السفينة من كل زوجين اثنين ومن آمن معه. انهمرت السماء بماء منهمر وتفجرت الأرض عيوناً، فالتقى الماء على أمر قد قدر. غرق الكافرون جميعاً، ونادى نوح ابنه ليركب معه، لكن الابن رفض وقال: "سآوي إلى جبل يعصمني من الماء"، فقال نوح: "لا عاصم اليوم من أمر الله"، وحال بينهما الموج فكان من المغرقين.
    
    بعد الطوفان، استوت السفينة على جبل الجودي، وهبط نوح ومن معه بسلام، لتبدأ البشرية بداية جديدة موحدة لله.`,
    source: "القرآن الكريم: سورة نوح، سورة هود (25-49)، سورة المؤمنون (23-30)."
  },
  { 
    id: 3, 
    title: "قصة إبراهيم عليه السلام", 
    content: `نشأ إبراهيم عليه السلام في بابل (العراق) وسط قوم يعبدون الكواكب والأصنام، وكان أبوه "آزر" نحاتاً للأصنام. رفض إبراهيم بفطرته السليمة عبادة التماثيل، وبدأ يحاجج قومه بالمنطق: كيف تعبدون ما لا يسمع ولا يبصر؟
    
    في يوم عيدهم، خرج الناس وتركوا أصنامهم، فجاء إبراهيم وحطمها جميعاً إلا كبيرهم، وعلق الفأس في عنقه. لما عادوا ورأوا الحطام، سألوا إبراهيم، فقال متهكماً: "بل فعله كبيرهم هذا فاسألوه". أدركوا عجز أصنامهم لكنهم كابروا وقرروا حرقه.
    
    أشعلوا ناراً عظيمة وألقوا فيها إبراهيم، لكن الله قال للنار: "كوني برداً وسلاماً على إبراهيم"، فخرج منها سالماً لم يمسه سوء.
    
    هاجر إبراهيم إلى الشام ثم مصر ومكة. ومن أعظم ابتلاءاته تركه لزوجته هاجر وابنه الرضيع إسماعيل في وادٍ غير ذي زرع (مكة) بأمر من الله، حيث تفجر ماء زمزم. ثم ابتلاه الله برؤيا ذبح ابنه إسماعيل، فلما استسلما للأمر، فداه الله بذبح عظيم. وبنى إبراهيم وإسماعيل الكعبة المشرفة لتكون مثابة للناس وأمناً.`,
    source: "القرآن الكريم: سورة الأنبياء (51-70)، سورة الصافات (83-113)، سورة إبراهيم."
  },
  { 
    id: 4, 
    title: "قصة يوسف عليه السلام", 
    content: `يوسف بن يعقوب عليهما السلام، الكريم ابن الكريم. بدأت قصته برؤيا رأى فيها أحد عشر كوكباً والشمس والقمر له ساجدين. كان أحب الأبناء إلى أبيه يعقوب، مما أثار غيرة إخوته فقرروا التخلص منه بإلقائه في البئر وادعوا أن الذئب أكله.
    
    مرت قافلة وأخذته وباعته في مصر لعزيزها. تربى في قصر العزيز، ولما بلغ أشده راودته امرأة العزيز عن نفسه فاستعصم، وسُجن ظلماً بضع سنين.
    
    في السجن، فسر رؤيا لصاحبيه، ثم فسر رؤيا للملك عن سبع بقرات سمان يأكلهن سبع عجاف، فعلم الملك بحكمته وأخرجه وجعله على خزائن الأرض.
    
    جاء إخوته إلى مصر لطلب الطعام في سنوات القحط، فعرفهم وهم له منكرون. دبر خطة لابقاء أخيه الشقيق "بنيامين" عنده، ثم كشف لهم عن نفسه بعد أن رأى ندمهم، وعفا عنهم قائلاً: "لا تثريب عليكم اليوم". جاء أبوه يعقوب وأهله جميعاً إلى مصر، وتحققت رؤياه القديمة بسجودهم له (سجود تحية وتوقير لا عبادة)، واجتمع الشمل بعد طول فراق وصبر جميل.`,
    source: "القرآن الكريم: سورة يوسف (كاملة)."
  },
  { 
    id: 5, 
    title: "قصة موسى عليه السلام", 
    content: `ولد موسى عليه السلام في عام كان فرعون يقتل فيه المواليد الذكور من بني إسرائيل. أوحى الله لأمه أن تضعه في تابوت وتلقيه في اليم (نهر النيل). التقطه آل فرعون، وأحبته آسية امرأة فرعون وأقنعت زوجها بتربيته، وحرم الله عليه المراضع حتى عاد لأمه كي تقر عينها.
    
    نشأ في القصر، ثم قتل مصرياً بالخطأ فهرب إلى "مدين"، حيث تزوج وعمل راعياً 10 سنوات. في طريق عودته لمصر، ناداه الله عند جبل الطور وكلمه، وأرسله وأخاه هارون إلى فرعون ليدعواه برفق.
    
    تحدى موسى سحرة فرعون، فألقى عصاه فإذا هي ثعبان مبين تلقف ما يأفكون، فسجد السحرة مؤمنين. طغى فرعون وتجبر، فأرسل الله عليه الطوفان والجراد والقمل والضفادع والدم.
    
    أمر الله موسى بالخروج ببني إسرائيل ليلاً. لحقهم فرعون وجنوده عند البحر الأحمر. ضرب موسى البحر بعصاه فانفلق، وعبر المؤمنون، ولما دخل فرعون انطبق البحر عليه، فغرق وهو يقول "آمنت"، لكن لم ينفعه إيمانه حينها.`,
    source: "القرآن الكريم: سورة القصص، سورة طه، سورة الشعراء (10-68)."
  },
  { 
    id: 6, 
    title: "قصة سليمان عليه السلام", 
    content: `سليمان بن داود عليهما السلام، آتاه الله ملكاً لا ينبغي لأحد من بعده. سخر الله له الريح تجري بأمره، والجن يعملون له ما يشاء، وعلمه منطق الطير والحيوان.
    
    من أشهر قصصه مع "الهدهد" الذي غاب ثم جاء بخبر مملكة سبأ في اليمن التي تحكمها ملكة (بلقيس) ويعبدون الشمس. أرسل سليمان رسالة يدعوهم للإسلام، ثم أمر بإحضار عرشها، فقام عنده "الذي عنده علم من الكتاب" بإحضاره قبل أن يرتد إليه طرفه.
    
    لما جاءت بلقيس ورأت ملك سليمان وعظمة الصرح الممرد من قوارير، أدركت أن هذا ليس ملك بشر عادي بل تأييد من الله، فأسلمت مع سليمان لله رب العالمين.
    
    مات سليمان وهو يتكأ على عصاه، ولم تعلم الجن بموته إلا حين أكلت دابة الأرض (النمل الأبيض) عصاه فخر ساقطاً، فعلم الناس أن الجن لا يعلمون الغيب.`,
    source: "القرآن الكريم: سورة النمل (15-44)، سورة سبأ (12-14)، سورة ص (30-40)."
  },
  { 
    id: 7, 
    title: "قصة يونس عليه السلام", 
    content: `أرسل الله يونس عليه السلام إلى أهل "نينوى" في العراق. دعاهم فكذبوه، فغضب وخرج من قريتهم دون إذن من الله، ظاناً أن الله لن يضيق عليه. ركب سفينة، فهاج البحر واقترعت الركاب لمن يُلقى في البحر لتخفيف الحمولة، فخرج سهم يونس ثلاث مرات.
    
    ألقى نفسه في البحر، فالتقمه حوت عظيم بأمر الله. في ظلمات ثلاث (ظلمة الليل، وظلمة البحر، وظلمة بطن الحوت)، نادى يونس ربه: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ".
    
    استجاب الله له ونجاه من الغم، فأمر الحوت أن يقذفه في العراء. أنبت الله عليه شجرة من يقطين ليستظل بها ويشفى. عاد إلى قومه فوجدهم قد آمنوا وتابوا لما رأوا بوادر العذاب، فمتعهم الله إلى حين، وكانوا مائة ألف أو يزيدون.`,
    source: "القرآن الكريم: سورة الأنبياء (87-88)، سورة الصافات (139-148)، سورة يونس (98)."
  }
];

const StoriesView: React.FC<StoriesViewProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'read' | 'watch'>('read');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  if (selectedStory) {
    return (
      <div className="p-4 pb-24">
        <button 
          onClick={() => setSelectedStory(null)} 
          className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-sm"
        >
          <ChevronRight size={16} className="transform rotate-180" /> عودة للقائمة
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="h-56 bg-gradient-to-br from-emerald-800 to-teal-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative Patterns */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white relative z-10 font-quran text-center px-4 drop-shadow-md">
                {selectedStory.title}
            </h1>
            <div className="mt-2 w-16 h-1 bg-amber-400 rounded-full relative z-10"></div>
          </div>
          
          <div className="p-6 md:p-8">
            {activeTab === 'read' ? (
              <div className="animate-fade-in">
                  <div 
                    className="prose dark:prose-invert max-w-none leading-loose text-gray-700 dark:text-gray-200 text-justify"
                    style={{ fontSize: `${16 + settings.fontSize * 2}px`, fontFamily: settings.fontFamily }}
                  >
                    {selectedStory.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-6 indent-8">{paragraph}</p>
                    ))}
                  </div>

                  {/* Sources Section */}
                  {selectedStory.source && (
                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                              <Quote className="text-emerald-500 shrink-0 mt-1" size={24} />
                              <div>
                                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1 text-sm">المصادر القرآنية</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 font-quran leading-relaxed">
                                      {selectedStory.source}
                                  </p>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Video size={40} className="text-gray-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">الفيديو غير متوفر</h3>
                 <p className="text-gray-500 text-sm max-w-xs mx-auto">نعمل على إضافة محتوى مرئي تعليمي عالي الجودة قريباً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto">
       <div className="flex items-center justify-between mb-2">
            <div>
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 font-quran">قصص الأنبياء</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">عبر ومواعظ من حياة المرسلين</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                <Bookmark size={24} />
            </div>
       </div>
       
       {/* Tabs */}
       <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl mb-6 shadow-inner">
          <button 
            onClick={() => setActiveTab('read')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'read' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Book size={18} />
            قصص مكتوبة
          </button>
          <button 
            onClick={() => setActiveTab('watch')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'watch' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Video size={18} />
            مكتبة الفيديو
          </button>
       </div>

       <div className="grid gap-4">
         {PROPHET_STORIES.map((story, index) => (
           <button 
             key={story.id}
             onClick={() => setSelectedStory(story)}
             className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-right group animate-fade-in"
             style={{ animationDelay: `${index * 50}ms` }}
           >
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
               {activeTab === 'read' ? <FileText size={24} /> : <PlayCircle size={24} />}
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{story.title}</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1 leading-relaxed opacity-80">{story.content}</p>
             </div>
             <div className="text-gray-300 group-hover:text-emerald-500 transition-colors">
                <ChevronLeft size={20} className="rtl:rotate-0 ltr:rotate-180" />
             </div>
           </button>
         ))}
       </div>
    </div>
  );
};

export default StoriesView;
