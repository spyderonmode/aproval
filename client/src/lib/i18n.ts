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
  
  // Difficulty
  difficulty: {
    en: 'Difficulty',
    ar: 'الصعوبة',
    bn: 'অসুবিধা',
    hi: 'कठिनाई',
    es: 'Dificultad',
    id: 'Kesulitan'
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
    bn: 'মধ্যম',
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
  
  // Game Status
  yourTurn: {
    en: 'Your Turn',
    ar: 'دورك',
    bn: 'আপনার পালা',
    hi: 'आपकी बारी',
    es: 'Tu Turno',
    id: 'Giliran Anda'
  },
  opponentTurn: {
    en: "Opponent's Turn",
    ar: 'دور الخصم',
    bn: 'প্রতিপক্ষের পালা',
    hi: 'प्रतिद्वंद्वी की बारी',
    es: 'Turno del Oponente',
    id: 'Giliran Lawan'
  },
  waiting: {
    en: 'Waiting...',
    ar: 'انتظار...',
    bn: 'অপেক্ষা করছে...',
    hi: 'प्रतीक्षा...',
    es: 'Esperando...',
    id: 'Menunggu...'
  },
  
  // Game Results
  youWin: {
    en: 'You Win!',
    ar: 'لقد فزت!',
    bn: 'আপনি জিতেছেন!',
    hi: 'आप जीत गए!',
    es: '¡Ganaste!',
    id: 'Anda Menang!'
  },
  youLose: {
    en: 'You Lose!',
    ar: 'لقد خسرت!',
    bn: 'আপনি হেরেছেন!',
    hi: 'आप हार गए!',
    es: '¡Perdiste!',
    id: 'Anda Kalah!'
  },
  draw: {
    en: 'Draw!',
    ar: 'تعادل!',
    bn: 'ড্র!',
    hi: 'बराबरी!',
    es: '¡Empate!',
    id: 'Seri!'
  },
  
  // Buttons
  newGame: {
    en: 'New Game',
    ar: 'لعبة جديدة',
    bn: 'নতুন গেম',
    hi: 'नया गेम',
    es: 'Nuevo Juego',
    id: 'Permainan Baru'
  },
  playAgain: {
    en: 'Play Again',
    ar: 'العب مرة أخرى',
    bn: 'আবার খেলুন',
    hi: 'फिर से खेलें',
    es: 'Jugar de Nuevo',
    id: 'Main Lagi'
  },
  cancel: {
    en: 'Cancel',
    ar: 'إلغاء',
    bn: 'বাতিল',
    hi: 'रद्द करें',
    es: 'Cancelar',
    id: 'Batal'
  },
  close: {
    en: 'Close',
    ar: 'إغلاق',
    bn: 'বন্ধ',
    hi: 'बंद करें',
    es: 'Cerrar',
    id: 'Tutup'
  },
  
  // Room Management
  createRoom: {
    en: 'Create Room',
    ar: 'إنشاء غرفة',
    bn: 'রুম তৈরি করুন',
    hi: 'रूम बनाएं',
    es: 'Crear Sala',
    id: 'Buat Ruang'
  },
  joinRoom: {
    en: 'Join Room',
    ar: 'انضم للغرفة',
    bn: 'রুমে যোগ দিন',
    hi: 'रूम में शामिल हों',
    es: 'Unirse a Sala',
    id: 'Bergabung ke Ruang'
  },
  roomName: {
    en: 'Room Name',
    ar: 'اسم الغرفة',
    bn: 'রুমের নাম',
    hi: 'रूम का नाम',
    es: 'Nombre de Sala',
    id: 'Nama Ruang'
  },
  roomCode: {
    en: 'Room Code',
    ar: 'كود الغرفة',
    bn: 'রুম কোড',
    hi: 'रूम कोड',
    es: 'Código de Sala',
    id: 'Kode Ruang'
  },
  
  // Profile
  profile: {
    en: 'Profile',
    ar: 'الملف الشخصي',
    bn: 'প্রোফাইল',
    hi: 'प्रोफाइल',
    es: 'Perfil',
    id: 'Profil'
  },
  displayName: {
    en: 'Display Name',
    ar: 'الاسم المعروض',
    bn: 'প্রদর্শন নাম',
    hi: 'प्रदर्शन नाम',
    es: 'Nombre Mostrado',
    id: 'Nama Tampilan'
  },
  email: {
    en: 'Email',
    ar: 'البريد الإلكتروني',
    bn: 'ইমেইল',
    hi: 'ईमेल',
    es: 'Correo',
    id: 'Email'
  },
  password: {
    en: 'Password',
    ar: 'كلمة المرور',
    bn: 'পাসওয়ার্ড',
    hi: 'पासवर्ड',
    es: 'Contraseña',
    id: 'Kata Sandi'
  },
  
  // Statistics
  stats: {
    en: 'Statistics',
    ar: 'الإحصائيات',
    bn: 'পরিসংখ্যান',
    hi: 'आंकड़े',
    es: 'Estadísticas',
    id: 'Statistik'
  },
  wins: {
    en: 'Wins',
    ar: 'الانتصارات',
    bn: 'জয়',
    hi: 'जीत',
    es: 'Victorias',
    id: 'Menang'
  },
  losses: {
    en: 'Losses',
    ar: 'الهزائم',
    bn: 'পরাজয়',
    hi: 'हार',
    es: 'Derrotas',
    id: 'Kalah'
  },
  draws: {
    en: 'Draws',
    ar: 'التعادل',
    bn: 'ড্র',
    hi: 'बराबरी',
    es: 'Empates',
    id: 'Seri'
  },
  
  // Common
  loading: {
    en: 'Loading...',
    ar: 'جاري التحميل...',
    bn: 'লোড হচ্ছে...',
    hi: 'लोड हो रहा है...',
    es: 'Cargando...',
    id: 'Memuat...'
  },
  error: {
    en: 'Error',
    ar: 'خطأ',
    bn: 'ত্রুটি',
    hi: 'त्रुटि',
    es: 'Error',
    id: 'Kesalahan'
  },
  success: {
    en: 'Success',
    ar: 'نجح',
    bn: 'সফল',
    hi: 'सफल',
    es: 'Éxito',
    id: 'Berhasil'
  },
  
  // Language Selection
  language: {
    en: 'Language',
    ar: 'اللغة',
    bn: 'ভাষা',
    hi: 'भाषा',
    es: 'Idioma',
    id: 'Bahasa'
  },
  selectLanguage: {
    en: 'Select Language',
    ar: 'اختر اللغة',
    bn: 'ভাষা নির্বাচন করুন',
    hi: 'भाषा चुनें',
    es: 'Seleccionar Idioma',
    id: 'Pilih Bahasa'
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
  
  // Online Features
  onlineUsers: {
    en: 'Online Users',
    ar: 'المستخدمون المتصلون',
    bn: 'অনলাইন ব্যবহারকারী',
    hi: 'ऑनलाइन उपयोगकर्ता',
    es: 'Usuarios en Línea',
    id: 'Pengguna Online'
  },
  achievements: {
    en: 'Achievements',
    ar: 'الإنجازات',
    bn: 'অর্জন',
    hi: 'उपलब्धियां',
    es: 'Logros',
    id: 'Prestasi'
  },
  friends: {
    en: 'Friends',
    ar: 'الأصدقاء',
    bn: 'বন্ধু',
    hi: 'मित्र',
    es: 'Amigos',
    id: 'Teman'
  },
  
  // Error Messages
  connectionError: {
    en: 'Connection Error',
    ar: 'خطأ في الاتصال',
    bn: 'সংযোগ ত্রুটি',
    hi: 'कनेक्शन त्रुटि',
    es: 'Error de Conexión',
    id: 'Kesalahan Koneksi'
  },
  gameNotFound: {
    en: 'Game not found',
    ar: 'لم يتم العثور على اللعبة',
    bn: 'গেম পাওয়া যায়নি',
    hi: 'गेम नहीं मिला',
    es: 'Juego no encontrado',
    id: 'Permainan tidak ditemukan'
  },
  
  // Game Rules
  gameRules: {
    en: 'Game Rules',
    ar: 'قواعد اللعبة',
    bn: 'গেম নিয়ম',
    hi: 'गेम नियम',
    es: 'Reglas del Juego',
    id: 'Aturan Permainan'
  },
  
  // Chat
  chat: {
    en: 'Chat',
    ar: 'الدردشة',
    bn: 'চ্যাট',
    hi: 'चैट',
    es: 'Chat',
    id: 'Chat'
  },
  sendMessage: {
    en: 'Send Message',
    ar: 'إرسال رسالة',
    bn: 'বার্তা পাঠান',
    hi: 'संदेश भेजें',
    es: 'Enviar Mensaje',
    id: 'Kirim Pesan'
  },
  typeMessage: {
    en: 'Type a message...',
    ar: 'اكتب رسالة...',
    bn: 'একটি বার্তা টাইপ করুন...',
    hi: 'एक संदेश टाइप करें...',
    es: 'Escribe un mensaje...',
    id: 'Ketik pesan...'
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