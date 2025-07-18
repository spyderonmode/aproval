// Internationalization system for TicTac 3x5 game
// Supports Arabic, Bengali, Hindi, Spanish, and Indonesian languages

export type Language = 'en' | 'ar' | 'bn' | 'hi' | 'es' | 'id';

export const languages = {
  en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  bn: { name: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  hi: { name: 'हिंदी', flag: '🇮🇳', dir: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  id: { name: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' }
} as const;

export const translations = {
  // Navigation & Header
  appName: {
    en: 'TicTac 3x5',
    ar: 'تيك تاك 3×5',
    bn: 'টিক ট্যাক 3×5',
    hi: 'टिक टैक 3×5',
    es: 'TicTac 3x5',
    id: 'TicTac 3x5'
  },
  getStarted: {
    en: 'Get Started',
    ar: 'ابدأ الآن',
    bn: 'শুরু করুন',
    hi: 'शुरू करें',
    es: 'Comenzar',
    id: 'Mulai'
  },
  login: {
    en: 'Login',
    ar: 'تسجيل الدخول',
    bn: 'লগইন',
    hi: 'लॉग इन',
    es: 'Iniciar Sesión',
    id: 'Masuk'
  },
  logout: {
    en: 'Logout',
    ar: 'تسجيل الخروج',
    bn: 'লগআউট',
    hi: 'लॉग आउट',
    es: 'Cerrar Sesión',
    id: 'Keluar'
  },
  register: {
    en: 'Register',
    ar: 'إنشاء حساب',
    bn: 'নিবন্ধন',
    hi: 'रजिस्टर करें',
    es: 'Registrarse',
    id: 'Daftar'
  },
  
  // Game Interface
  strategicTicTacToe: {
    en: 'Strategic Tic-Tac-Toe',
    ar: 'لعبة إكس أو الاستراتيجية',
    bn: 'কৌশলগত টিক ট্যাক টো',
    hi: 'रणनीतिक टिक टैक टो',
    es: 'Tic-Tac-Toe Estratégico',
    id: 'Tic-Tac-Toe Strategis'
  },
  game: {
    en: 'Game',
    ar: 'لعبة',
    bn: 'গেম',
    hi: 'गेम',
    es: 'Juego',
    id: 'Permainan'
  },
  startPlayingNow: {
    en: 'Start Playing Now',
    ar: 'ابدأ اللعب الآن',
    bn: 'এখনই খেলা শুরু করুন',
    hi: 'अभी खेलना शुरू करें',
    es: 'Empezar a Jugar Ahora',
    id: 'Mulai Bermain Sekarang'
  },
  gameDescription: {
    en: 'Experience the classic game on a 3x5 grid with strategic gameplay.',
    ar: 'استمتع باللعبة الكلاسيكية على شبكة 3×5 مع لعب استراتيجي.',
    bn: 'কৌশলগত গেমপ্লে সহ 3×5 গ্রিডে ক্লাসিক গেমটি অনুভব করুন।',
    hi: 'रणनीतिक गेमप्ले के साथ 3×5 ग्रिड पर क्लासिक गेम का अनुभव करें।',
    es: 'Experimenta el juego clásico en una cuadrícula de 3x5 con jugabilidad estratégica.',
    id: 'Rasakan permainan klasik di grid 3x5 dengan gameplay strategis.'
  },
  
  // Game Modes
  gameMode: {
    en: 'Game Mode',
    ar: 'وضع اللعبة',
    bn: 'গেম মোড',
    hi: 'गेम मोड',
    es: 'Modo de Juego',
    id: 'Mode Permainan'
  },
  aiMode: {
    en: 'AI Mode',
    ar: 'وضع الذكاء الاصطناعي',
    bn: 'এআই মোড',
    hi: 'एआई मोड',
    es: 'Modo IA',
    id: 'Mode AI'
  },
  passPlayMode: {
    en: 'Pass & Play',
    ar: 'تناوب اللعب',
    bn: 'পাস এবং প্লে',
    hi: 'पास और प्ले',
    es: 'Pasar y Jugar',
    id: 'Pass & Play'
  },
  onlineMode: {
    en: 'Online Mode',
    ar: 'وضع الإنترنت',
    bn: 'অনলাইন মোড',
    hi: 'ऑनलाइन मोड',
    es: 'Modo Online',
    id: 'Mode Online'
  },
  
  // Game Rules
  gameRules: {
    en: 'Game Rules',
    ar: 'قواعد اللعبة',
    bn: 'গেমের নিয়ম',
    hi: 'गेम नियम',
    es: 'Reglas del Juego',
    id: 'Aturan Permainan'
  },
  horizontalWin: {
    en: 'Horizontal Win: Get 4 symbols in a row horizontally',
    ar: 'الفوز الأفقي: احصل على 4 رموز في صف أفقي',
    bn: 'অনুভূমিক জয়: একটি সারিতে 4টি চিহ্ন পান',
    hi: 'क्षैतिज जीत: एक पंक्ति में 4 प्रतीक प्राप्त करें',
    es: 'Victoria Horizontal: Consigue 4 símbolos en una fila horizontal',
    id: 'Kemenangan Horizontal: Dapatkan 4 simbol dalam baris horizontal'
  },
  verticalWin: {
    en: 'Vertical Win: Get 3 symbols in a column vertically',
    ar: 'الفوز العمودي: احصل على 3 رموز في عمود عمودي',
    bn: 'উল্লম্ব জয়: একটি কলামে 3টি চিহ্ন পান',
    hi: 'ऊर्ध्वाधर जीत: एक कॉलम में 3 प्रतीक प्राप्त करें',
    es: 'Victoria Vertical: Consigue 3 símbolos en una columna vertical',
    id: 'Kemenangan Vertikal: Dapatkan 3 simbol dalam kolom vertikal'
  },
  diagonalWin: {
    en: 'Diagonal Win: Get 3 symbols diagonally (positions 5, 10, 15 restricted)',
    ar: 'الفوز القطري: احصل على 3 رموز قطرياً (المواضع 5، 10، 15 محظورة)',
    bn: 'কর্ণ জয়: কর্ণভাবে 3টি চিহ্ন পান (অবস্থান 5, 10, 15 সীমিত)',
    hi: 'विकर्ण जीत: विकर्ण में 3 प्रतीक प्राप्त करें (स्थिति 5, 10, 15 प्रतिबंधित)',
    es: 'Victoria Diagonal: Consigue 3 símbolos en diagonal (posiciones 5, 10, 15 restringidas)',
    id: 'Kemenangan Diagonal: Dapatkan 3 simbol secara diagonal (posisi 5, 10, 15 terbatas)'
  },
  gridLayout: {
    en: 'Grid Layout: 3 rows × 5 columns (positions 1-15)',
    ar: 'تخطيط الشبكة: 3 صفوف × 5 أعمدة (المواضع 1-15)',
    bn: 'গ্রিড লেআউট: 3 সারি × 5 কলাম (অবস্থান 1-15)',
    hi: 'ग्रिड लेआउट: 3 पंक्तियाँ × 5 कॉलम (स्थिति 1-15)',
    es: 'Diseño de Cuadrícula: 3 filas × 5 columnas (posiciones 1-15)',
    id: 'Tata Letak Grid: 3 baris × 5 kolom (posisi 1-15)'
  },
  
  // Quick Chat Messages
  quickChat: {
    en: 'Quick Chat',
    ar: 'دردشة سريعة',
    bn: 'দ্রুত চ্যাট',
    hi: 'त्वरित चैट',
    es: 'Chat Rápido',
    id: 'Chat Cepat'
  },
  goodLuck: {
    en: 'Good luck!',
    ar: 'حظ سعيد!',
    bn: 'শুভকামনা!',
    hi: 'शुभकामनाएँ!',
    es: '¡Buena suerte!',
    id: 'Semoga beruntung!'
  },
  wellPlayed: {
    en: 'Well played!',
    ar: 'لعب جيد!',
    bn: 'ভাল খেলেছেন!',
    hi: 'अच्छा खेला!',
    es: '¡Bien jugado!',
    id: 'Permainan bagus!'
  },
  niceMove: {
    en: 'Nice move!',
    ar: 'حركة جيدة!',
    bn: 'চমৎকার চাল!',
    hi: 'अच्छी चाल!',
    es: '¡Buen movimiento!',
    id: 'Gerakan bagus!'
  },
  greatStrategy: {
    en: 'Great strategy!',
    ar: 'استراتيجية رائعة!',
    bn: 'দুর্দান্ত কৌশল!',
    hi: 'बेहतरीन रणनीति!',
    es: '¡Gran estrategia!',
    id: 'Strategi hebat!'
  },
  playFaster: {
    en: 'Play faster!',
    ar: 'العب بسرعة أكبر!',
    bn: 'আরো দ্রুত খেলুন!',
    hi: 'तेज़ खेलें!',
    es: '¡Juega más rápido!',
    id: 'Main lebih cepat!'
  },
  takeYourTime: {
    en: 'Take your time',
    ar: 'خذ وقتك',
    bn: 'সময় নিন',
    hi: 'अपना समय लें',
    es: 'Tómate tu tiempo',
    id: 'Ambil waktu Anda'
  },
  goodGame: {
    en: 'Good game!',
    ar: 'لعبة جيدة!',
    bn: 'ভাল গেম!',
    hi: 'अच्छा गेम!',
    es: '¡Buen juego!',
    id: 'Permainan bagus!'
  },
  thanksForGame: {
    en: 'Thanks for the game!',
    ar: 'شكرا على اللعبة!',
    bn: 'গেমের জন্য ধন্যবাদ!',
    hi: 'गेम के लिए धन्यवाद!',
    es: '¡Gracias por el juego!',
    id: 'Terima kasih untuk permainannya!'
  },
  oneMore: {
    en: 'One more?',
    ar: 'واحدة أخرى؟',
    bn: 'আরো একটি?',
    hi: 'एक और?',
    es: '¿Una más?',
    id: 'Satu lagi?'
  },
  impressive: {
    en: 'Impressive!',
    ar: 'مثير للإعجاب!',
    bn: 'চমৎকার!',
    hi: 'प्रभावशाली!',
    es: '¡Impresionante!',
    id: 'Mengesankan!'
  },
  thinking: {
    en: 'Thinking...',
    ar: 'أفكر...',
    bn: 'ভাবছি...',
    hi: 'सोच रहा हूं...',
    es: 'Pensando...',
    id: 'Berpikir...'
  },
  readyToPlay: {
    en: 'Ready to play!',
    ar: 'جاهز للعب!',
    bn: 'খেলার জন্য প্রস্তুত!',
    hi: 'खेलने के लिए तैयार!',
    es: '¡Listo para jugar!',
    id: 'Siap bermain!'
  },
  
  // UI Elements
  close: {
    en: 'Close',
    ar: 'إغلاق',
    bn: 'বন্ধ',
    hi: 'बंद',
    es: 'Cerrar',
    id: 'Tutup'
  },
  chat: {
    en: 'Chat',
    ar: 'دردشة',
    bn: 'চ্যাট',
    hi: 'चैट',
    es: 'Chat',
    id: 'Chat'
  },
  resetGame: {
    en: 'Reset Game',
    ar: 'إعادة تعيين اللعبة',
    bn: 'গেম রিসেট',
    hi: 'गेम रीसेट',
    es: 'Reiniciar Juego',
    id: 'Reset Permainan'
  },
  
  // Auth Forms
  username: {
    en: 'Username',
    ar: 'اسم المستخدم',
    bn: 'ব্যবহারকারীর নাম',
    hi: 'उपयोगकर्ता नाम',
    es: 'Nombre de Usuario',
    id: 'Nama Pengguna'
  },
  password: {
    en: 'Password',
    ar: 'كلمة المرور',
    bn: 'পাসওয়ার্ড',
    hi: 'पासवर्ड',
    es: 'Contraseña',
    id: 'Kata Sandi'
  },
  email: {
    en: 'Email',
    ar: 'البريد الإلكتروني',
    bn: 'ইমেইল',
    hi: 'ईमेल',
    es: 'Correo Electrónico',
    id: 'Email'
  },
  
  // Game Status
  playerTurn: {
    en: "Player %s's Turn",
    ar: 'دور اللاعب %s',
    bn: 'খেলোয়াড় %s এর পালা',
    hi: 'खिलाड़ी %s की बारी',
    es: 'Turno del Jugador %s',
    id: 'Giliran Pemain %s'
  },
  winner: {
    en: 'Winner: %s',
    ar: 'الفائز: %s',
    bn: 'বিজয়ী: %s',
    hi: 'विजेता: %s',
    es: 'Ganador: %s',
    id: 'Pemenang: %s'
  },
  draw: {
    en: 'Draw!',
    ar: 'تعادل!',
    bn: 'ড্র!',
    hi: 'ड्रॉ!',
    es: '¡Empate!',
    id: 'Seri!'
  },
  
  // Settings
  settings: {
    en: 'Settings',
    ar: 'الإعدادات',
    bn: 'সেটিংস',
    hi: 'सेटिंग्स',
    es: 'Configuración',
    id: 'Pengaturan'
  },
  theme: {
    en: 'Theme',
    ar: 'المظهر',
    bn: 'থিম',
    hi: 'थीम',
    es: 'Tema',
    id: 'Tema'
  },
  language: {
    en: 'Language',
    ar: 'اللغة',
    bn: 'ভাষা',
    hi: 'भाषा',
    es: 'Idioma',
    id: 'Bahasa'
  },
  
  // AI Difficulty Levels
  difficulty: {
    en: 'Difficulty',
    ar: 'مستوى الصعوبة',
    bn: 'কঠিনতা',
    hi: 'कठिनाई',
    es: 'Dificultad',
    id: 'Tingkat Kesulitan'
  },
  easy: {
    en: 'Easy',
    ar: 'سهل',
    bn: 'সহজ',
    hi: 'आसान',
    es: 'Fácil',
    id: 'Mudah'
  },
  medium: {
    en: 'Medium',
    ar: 'متوسط',
    bn: 'মাঝারি',
    hi: 'मध्यम',
    es: 'Medio',
    id: 'Sedang'
  },
  hard: {
    en: 'Hard',
    ar: 'صعب',
    bn: 'কঠিন',
    hi: 'कठिन',
    es: 'Difícil',
    id: 'Sulit'
  },
  
  // Game Mode Descriptions
  challengeComputer: {
    en: 'Challenge the computer',
    ar: 'تحدي الحاسوب',
    bn: 'কম্পিউটারকে চ্যালেঞ্জ করুন',
    hi: 'कंप्यूटर को चुनौती दें',
    es: 'Desafía a la computadora',
    id: 'Tantang komputer'
  },
  localMultiplayer: {
    en: 'Local multiplayer',
    ar: 'متعدد اللاعبين المحلي',
    bn: 'স্থানীয় বহুখেলোয়াড়',
    hi: 'स्थानीय मल्टीप्लेयर',
    es: 'Multijugador local',
    id: 'Multiplayer lokal'
  },
  playWithFriends: {
    en: 'Play with friends online',
    ar: 'العب مع الأصدقاء عبر الإنترنت',
    bn: 'অনলাইনে বন্ধুদের সাথে খেলুন',
    hi: 'दोस्तों के साथ ऑनलाइन खेलें',
    es: 'Juega con amigos en línea',
    id: 'Bermain dengan teman secara online'
  }
} as const;

// Type for translation keys
export type TranslationKey = keyof typeof translations;

// Get the current language from localStorage or default to English
export function getCurrentLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as Language;
    if (saved && saved in languages) {
      return saved;
    }
  }
  return 'en';
}

// Set the current language
export function setCurrentLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = languages[lang].dir;
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  }
}

// Get translation for a key
export function t(key: TranslationKey): string {
  const lang = getCurrentLanguage();
  return translations[key][lang] || translations[key].en;
}

// Initialize language settings
export function initializeLanguage(): void {
  const lang = getCurrentLanguage();
  setCurrentLanguage(lang);
}