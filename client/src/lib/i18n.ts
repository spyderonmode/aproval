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
  },
  
  // Profile and Dashboard
  profile: {
    en: 'Profile',
    ar: 'الملف الشخصي',
    bn: 'প্রোফাইল',
    hi: 'प्रोफाइल',
    es: 'Perfil',
    id: 'Profil'
  },
  playerDashboard: {
    en: 'Player Dashboard',
    ar: 'لوحة تحكم اللاعب',
    bn: 'প্লেয়ার ড্যাশবোর্ড',
    hi: 'प्लेयर डैशबोर्ड',
    es: 'Panel del Jugador',
    id: 'Dashboard Pemain'
  },
  gameBoard: {
    en: 'Game Board',
    ar: 'لوحة اللعبة',
    bn: 'গেম বোর্ড',
    hi: 'गेम बोर्ड',
    es: 'Tablero de Juego',
    id: 'Papan Permainan'
  },
  playerTurnX: {
    en: "Player X's Turn",
    ar: 'دور اللاعب X',
    bn: 'প্লেয়ার X এর পালা',
    hi: 'प्लेयर X की बारी',
    es: 'Turno del Jugador X',
    id: 'Giliran Pemain X'
  },
  gameStats: {
    en: 'Game Stats',
    ar: 'إحصائيات اللعبة',
    bn: 'গেমের পরিসংখ্যান',
    hi: 'गेम आंकड़े',
    es: 'Estadísticas del Juego',
    id: 'Statistik Permainan'
  },
  wins: {
    en: 'Wins',
    ar: 'انتصارات',
    bn: 'জয়',
    hi: 'जीत',
    es: 'Victorias',
    id: 'Menang'
  },
  losses: {
    en: 'Losses',
    ar: 'هزائم',
    bn: 'পরাজয়',
    hi: 'हार',
    es: 'Derrotas',
    id: 'Kalah'
  },
  draws: {
    en: 'Draws',
    ar: 'تعادل',
    bn: 'ড্র',
    hi: 'ड्रॉ',
    es: 'Empates',
    id: 'Seri'
  },
  total: {
    en: 'Total',
    ar: 'المجموع',
    bn: 'মোট',
    hi: 'कुल',
    es: 'Total',
    id: 'Total'
  },
  
  // Profile Management
  editProfile: {
    en: 'Edit Profile',
    ar: 'تعديل الملف الشخصي',
    bn: 'প্রোফাইল সম্পাদনা',
    hi: 'प्रोफाइल संपादित करें',
    es: 'Editar Perfil',
    id: 'Edit Profil'
  },
  profilePicture: {
    en: 'Profile Picture',
    ar: 'صورة الملف الشخصي',
    bn: 'প্রোফাইল ছবি',
    hi: 'प्रोफाइल चित्र',
    es: 'Foto de Perfil',
    id: 'Foto Profil'
  },
  displayName: {
    en: 'Display Name',
    ar: 'الاسم المعروض',
    bn: 'প্রদর্শন নাম',
    hi: 'प्रदर्शन नाम',
    es: 'Nombre de Visualización',
    id: 'Nama Tampilan'
  },
  uploadPhoto: {
    en: 'Upload Photo',
    ar: 'رفع صورة',
    bn: 'ছবি আপলোড',
    hi: 'फोटो अपलोड करें',
    es: 'Subir Foto',
    id: 'Unggah Foto'
  },
  saveChanges: {
    en: 'Save Changes',
    ar: 'حفظ التغييرات',
    bn: 'পরিবর্তন সংরক্ষণ',
    hi: 'परिवर्तन सहेजें',
    es: 'Guardar Cambios',
    id: 'Simpan Perubahan'
  },
  cancel: {
    en: 'Cancel',
    ar: 'إلغاء',
    bn: 'বাতিল',
    hi: 'रद्द करें',
    es: 'Cancelar',
    id: 'Batal'
  },
  
  // Friends and Social
  friends: {
    en: 'Friends',
    ar: 'الأصدقاء',
    bn: 'বন্ধুরা',
    hi: 'मित्र',
    es: 'Amigos',
    id: 'Teman'
  },
  friendsOne: {
    en: 'Friends (1)',
    ar: 'الأصدقاء (1)',
    bn: 'বন্ধুরা (1)',
    hi: 'मित्र (1)',
    es: 'Amigos (1)',
    id: 'Teman (1)'
  },
  requests: {
    en: 'Requests',
    ar: 'الطلبات',
    bn: 'অনুরোধ',
    hi: 'अनुरोध',
    es: 'Solicitudes',
    id: 'Permintaan'
  },
  addFriend: {
    en: 'Add Friend',
    ar: 'إضافة صديق',
    bn: 'বন্ধু যোগ করুন',
    hi: 'मित्र जोड़ें',
    es: 'Agregar Amigo',
    id: 'Tambah Teman'
  },
  
  // Achievements
  achievements: {
    en: 'Achievements',
    ar: 'الإنجازات',
    bn: 'অর্জন',
    hi: 'उपलब्धियां',
    es: 'Logros',
    id: 'Pencapaian'
  },
  yourAchievements: {
    en: 'Your Achievements',
    ar: 'إنجازاتك',
    bn: 'আপনার অর্জন',
    hi: 'आपकी उपलब्धियां',
    es: 'Tus Logros',
    id: 'Pencapaian Anda'
  },
  firstVictory: {
    en: 'First Victory',
    ar: 'أول انتصار',
    bn: 'প্রথম বিজয়',
    hi: 'पहली विजय',
    es: 'Primera Victoria',
    id: 'Kemenangan Pertama'
  },
  winYourFirstGame: {
    en: 'Win your first game',
    ar: 'اربح لعبتك الأولى',
    bn: 'আপনার প্রথম গেম জিতুন',
    hi: 'अपना पहला गেม জীতें',
    es: 'Gana tu primer juego',
    id: 'Menangkan permainan pertama Anda'
  },
  speedDemonDesc: {
    en: 'Win 20 total games to unlock the Christmas theme - keep playing!',
    ar: 'اربح 20 لعبة للحصول على مظهر عيد الميلاد - استمر في اللعب!',
    bn: '২০টি গেম জিতুন ক্রিসমাস থিম আনলক করতে - খেলা চালিয়ে যান!',
    hi: 'क्रिसमस थीम अनलॉक करने के लिए 20 गेम जीतें - खेलते रहें!',
    es: 'Gana 20 juegos para desbloquear el tema navideño - ¡sigue jugando!',
    id: 'Menangkan 20 permainan untuk membuka tema Natal - terus bermain!'
  },
  legendDesc: {
    en: 'Achieve 50 total wins to become a true legend with animated border!',
    ar: 'حقق 50 فوزاً للحصول على لقب أسطورة مع حدود متحركة!',
    bn: 'অ্যানিমেটেড বর্ডার সহ প্রকৃত কিংবদন্তি হতে ৫০টি জয় অর্জন করুন!',
    hi: 'एनिमेटेड बॉर्डर के साथ सच्चे लीजेंड बनने के लिए 50 जीत हासिल करें!',
    es: '¡Consigue 50 victorias para convertirte en una verdadera leyenda con borde animado!',
    id: 'Raih 50 kemenangan untuk menjadi legenda sejati dengan border animasi!'
  },
  championDesc: {
    en: 'Achieve 100 total wins to become an ultimate champion with cosmic border!',
    ar: 'حقق 100 فوز للحصول على لقب البطل النهائي مع حدود كونية!',
    bn: 'কসমিক বর্ডার সহ চূড়ান্ত চ্যাম্পিয়ন হতে ১০০টি জয় অর্জন করুন!',
    hi: 'कॉस्मिक बॉर्डर के साथ अल्टिमेट चैंपियन बनने के लिए 100 जीत हासिल करें!',
    es: '¡Consigue 100 victorias para convertirte en el campeón definitivo con borde cósmico!',
    id: 'Raih 100 kemenangan untuk menjadi juara ultimate dengan border kosmik!'
  },
  
  // Quick Actions
  quickActions: {
    en: 'Quick Actions',
    ar: 'الإجراءات السريعة',
    bn: 'দ্রুত কর্ম',
    hi: 'त्वरित कार्य',
    es: 'Acciones Rápidas',
    id: 'Tindakan Cepat'
  },
  change: {
    en: 'Change',
    ar: 'تغيير',
    bn: 'পরিবর্তন',
    hi: 'बदलाव',
    es: 'Cambiar',
    id: 'Ubah'
  },
  view: {
    en: 'View',
    ar: 'عرض',
    bn: 'দেখুন',
    hi: 'देखें',
    es: 'Ver',
    id: 'Lihat'
  },
  menu: {
    en: 'Menu',
    ar: 'القائمة',
    bn: 'মেনু',
    hi: 'मेनू',
    es: 'Menú',
    id: 'Menu'
  },
  online: {
    en: 'Online',
    ar: 'متصل',
    bn: 'অনলাইন',
    hi: 'ऑनलाइन',
    es: 'En línea',
    id: 'Online'
  },
  players: {
    en: 'Players',
    ar: 'اللاعبون',
    bn: 'খেলোয়াড়',
    hi: 'खिलाड़ी',
    es: 'Jugadores',
    id: 'Pemain'
  },
  onePlayers: {
    en: '1 Players',
    ar: '1 لاعب',
    bn: '১ জন খেলোয়াড়',
    hi: '1 खिलाड़ी',
    es: '1 Jugador',
    id: '1 Pemain'
  },
  profileSettings: {
    en: 'Profile Settings',
    ar: 'إعدادات الملف الشخصي',
    bn: 'প্রোফাইল সেটিংস',
    hi: 'प्रोफाइल सेटिंग्स',
    es: 'Configuración de Perfil',
    id: 'Pengaturan Profil'
  },
  offline: {
    en: 'Offline',
    ar: 'غير متصل',
    bn: 'অফলাইন',
    hi: 'ऑफलाइन',
    es: 'Desconectado',
    id: 'Offline'
  },
  
  // Game Board Elements
  gameId: {
    en: 'Game ID',
    ar: 'معرف اللعبة',
    bn: 'গেম আইডি',
    hi: 'गेम आईडी',
    es: 'ID del Juego',
    id: 'ID Permainan'
  },
  room: {
    en: 'Room',
    ar: 'الغرفة',
    bn: 'রুম',
    hi: 'कमरा',
    es: 'Habitación',
    id: 'Ruang'
  },
  local: {
    en: 'Local',
    ar: 'محلي',
    bn: 'স্থানীয়',
    hi: 'स्थानीय',
    es: 'Local',
    id: 'Lokal'
  },

  
  // Player Names
  playerX: {
    en: 'Player X',
    ar: 'اللاعب X',
    bn: 'প্লেয়ার X',
    hi: 'प्लेयर X',
    es: 'Jugador X',
    id: 'Pemain X'
  },
  playerO: {
    en: 'Player O',
    ar: 'اللاعب O',
    bn: 'প্লেয়ার O',
    hi: 'प्लेयर O',
    es: 'Jugador O',
    id: 'Pemain O'
  },
  playerTurnO: {
    en: "Player O's Turn",
    ar: 'دور اللاعب O',
    bn: 'প্লেয়ার O এর পালা',
    hi: 'प्लेयर O की बारी',
    es: 'Turno del Jugador O',
    id: 'Giliran Pemain O'
  },
  aiTurn: {
    en: "AI's Turn",
    ar: 'دور الذكاء الاصطناعي',
    bn: 'এআই এর পালা',
    hi: 'AI की बारी',
    es: 'Turno de la IA',
    id: 'Giliran AI'
  },
  ai: {
    en: 'AI',
    ar: 'الذكاء الاصطناعي',
    bn: 'এআই',
    hi: 'AI',
    es: 'IA',
    id: 'AI'
  },
  
  // Achievement Categories and Details
  victoryAchievements: {
    en: 'Victory Achievements',
    ar: 'إنجازات النصر',
    bn: 'বিজয়ের অর্জন',
    hi: 'विजय की उपलब्धियां',
    es: 'Logros de Victoria',
    id: 'Pencapaian Kemenangan'
  },
  skillAchievements: {
    en: 'Skill Achievements',
    ar: 'إنجازات المهارة',
    bn: 'দক্ষতার অর্জন',
    hi: 'कौशल की उपलब्धियां',
    es: 'Logros de Habilidad',
    id: 'Pencapaian Keterampilan'
  },
  experienceAchievements: {
    en: 'Experience Achievements',
    ar: 'إنجازات الخبرة',
    bn: 'অভিজ্ঞতার অর্জন',
    hi: 'अनुभव की उपलब्धियां',
    es: 'Logros de Experiencia',
    id: 'Pencapaian Pengalaman'
  },
  playerAchievements: {
    en: 'Player Achievements',
    ar: 'إنجازات اللاعب',
    bn: 'খেলোয়াড়ের অর্জন',
    hi: 'खिलाड़ी की उपलब्धियां',
    es: 'Logros del Jugador',
    id: 'Pencapaian Pemain'
  },
  
  // Achievement Names
  firstVictoryTitle: {
    en: 'First Victory',
    ar: 'أول انتصار',
    bn: 'প্রথম বিজয়',
    hi: 'पहली विजय',
    es: 'Primera Victoria',
    id: 'Kemenangan Pertama'
  },
  winStreakMaster: {
    en: 'Win Streak Master',
    ar: 'سيد سلسلة الانتصارات',
    bn: 'জয়ের ধারা মাস্টার',
    hi: 'जीत की लकीर के मास्टर',
    es: 'Maestro de Racha Ganadora',
    id: 'Master Kemenangan Beruntun'
  },
  unstoppable: {
    en: 'Unstoppable',
    ar: 'لا يُقهر',
    bn: 'অপ্রতিরোধ্য',
    hi: 'अजेय',
    es: 'Imparable',
    id: 'Tak Terhentikan'
  },
  masterOfDiagonals: {
    en: 'Master of Diagonals',
    ar: 'سيد الأقطار',
    bn: 'কর্ণের মাস্টার',
    hi: 'विकर्ण के मास्टर',
    es: 'Maestro de Diagonales',
    id: 'Master Diagonal'
  },
  speedDemon: {
    en: 'Speed Demon',
    ar: 'شيطان السرعة',
    bn: 'গতির দানব',
    hi: 'गति के दानव',
    es: 'Demonio de la Velocidad',
    id: 'Iblis Kecepatan'
  },
  veteranPlayer: {
    en: 'Veteran Player',
    ar: 'لاعب محنك',
    bn: 'অভিজ্ঞ খেলোয়াড়',
    hi: 'अनुभवी खिलाड़ी',
    es: 'Jugador Veterano',
    id: 'Pemain Veteran'
  },
  comebackKing: {
    en: 'Comeback King',
    ar: 'ملك العودة',
    bn: 'প্রত্যাবর্তনের রাজা',
    hi: 'वापसी के राजा',
    es: 'Rey del Regreso',
    id: 'Raja Comeback'
  },
  legend: {
    en: 'Legend',
    ar: 'أسطورة',
    bn: 'কিংবদন্তি',
    hi: 'दंतकथा',
    es: 'Leyenda',
    id: 'Legenda'
  },
  champion: {
    en: 'Champion',
    ar: 'بطل',
    bn: 'চ্যাম্পিয়ন',
    hi: 'चैंपियन',
    es: 'Campeón',
    id: 'Juara'
  },
  
  // Achievement Descriptions
  winYourVeryFirstGame: {
    en: 'Win your very first game against any opponent to earn this achievement',
    ar: 'اربح لعبتك الأولى ضد أي خصم لكسب هذا الإنجاز',
    bn: 'এই অর্জন অর্জনের জন্য যেকোনো প্রতিপক্ষের বিরুদ্ধে আপনার প্রথম গেম জিতুন',
    hi: 'इस उपलब्धि को अर्जित करने के लिए किसी भी प्रतिद्वंद्वी के खिलाफ अपना पहला गेम जीतें',
    es: 'Gana tu primer juego contra cualquier oponente para obtener este logro',
    id: 'Menangkan permainan pertama Anda melawan lawan mana pun untuk mendapatkan pencapaian ini'
  },
  winFiveConsecutiveGames: {
    en: 'Win 5 consecutive games without losing to unlock the Halloween theme',
    ar: 'اربح 5 ألعاب متتالية دون خسارة لفتح موضوع الهالوين',
    bn: 'হ্যালোইন থিম আনলক করতে হার না মেনে পরপর 5টি গেম জিতুন',
    hi: 'हैलोवीन थीम अनलॉक करने के लिए बिना हारे 5 लगातार गेम जीतें',
    es: 'Gana 5 juegos consecutivos sin perder para desbloquear el tema de Halloween',
    id: 'Menangkan 5 permainan berturut-turut tanpa kalah untuk membuka tema Halloween'
  },
  winTenConsecutiveGames: {
    en: 'Win 10 consecutive games without losing - the ultimate challenge!',
    ar: 'اربح 10 ألعاب متتالية دون خسارة - التحدي الأقصى!',
    bn: 'হার না মেনে পরপর 10টি গেম জিতুন - চূড়ান্ত চ্যালেঞ্জ!',
    hi: 'बिना हारे 10 लगातार गेम जीतें - परम चुनौती!',
    es: 'Gana 10 juegos consecutivos sin perder - ¡el desafío definitivo!',
    id: 'Menangkan 10 permainan berturut-turut tanpa kalah - tantangan tertinggi!'
  },
  winThreeGamesDiagonally: {
    en: 'Win 3 games by getting three in a row diagonally (corner to corner)',
    ar: 'اربح 3 ألعاب بالحصول على ثلاثة في صف قطرياً (من زاوية إلى زاوية)',
    bn: 'কর্ণভাবে (কোণ থেকে কোণে) তিনটি পরপর পেয়ে 3টি গেম জিতুন',
    hi: 'विकर्ण रूप से (कोने से कोने तक) तीन को एक पंक्ति में प्राप्त करके 3 गेम जीतें',
    es: 'Gana 3 juegos obteniendo tres en fila diagonalmente (esquina a esquina)',
    id: 'Menangkan 3 permainan dengan mendapatkan tiga berturut-turut secara diagonal (sudut ke sudut)'
  },
  winTwentyTotalGames: {
    en: 'Win 20 total games to unlock the Christmas theme - keep playing!',
    ar: 'اربح 20 لعبة إجمالية لفتح موضوع الكريسماس - استمر في اللعب!',
    bn: 'ক্রিসমাস থিম আনলক করতে মোট 20টি গেম জিতুন - খেলা চালিয়ে যান!',
    hi: 'क्रिसमस थीम अनलॉक करने के लिए कुल 20 गेम जीतें - खेलते रहें!',
    es: 'Gana 20 juegos en total para desbloquear el tema navideño - ¡sigue jugando!',
    id: 'Menangkan 20 permainan total untuk membuka tema Natal - terus bermain!'
  },
  playOneHundredTotalGames: {
    en: 'Play 100 total games (wins + losses + draws) to unlock the Summer theme',
    ar: 'العب 100 لعبة إجمالية (انتصارات + هزائم + تعادل) لفتح موضوع الصيف',
    bn: 'গ্রীষ্মকালীন থিম আনলক করতে মোট 100টি গেম খেলুন (জয় + হার + ড্র)',
    hi: 'गर्मियों का थीम अनलॉक करने के लिए कुल 100 गेम खेलें (जीत + हार + ड्रॉ)',
    es: 'Juega 100 juegos en total (victorias + derrotas + empates) para desbloquear el tema de verano',
    id: 'Mainkan 100 permainan total (menang + kalah + seri) untuk membuka tema musim panas'
  },
  winAfterLosingFive: {
    en: 'Win a game after losing 5 games in a row - prove your resilience!',
    ar: 'اربح لعبة بعد خسارة 5 ألعاب متتالية - أثبت مرونتك!',
    bn: 'পরপর 5টি গেম হারার পর একটি গেম জিতুন - আপনার স্থিতিস্থাপকতা প্রমাণ করুন!',
    hi: 'लगातार 5 गेम हारने के बाद एक गेम जीतें - अपनी लचक साबित करें!',
    es: 'Gana un juego después de perder 5 juegos seguidos - ¡demuestra tu resistencia!',
    id: 'Menangkan permainan setelah kalah 5 permainan berturut-turut - buktikan ketahananmu!'
  },
  achieveFiftyTotalWins: {
    en: 'Achieve 50 total wins to become a true legend with animated fire border!',
    ar: 'حقق 50 انتصاراً إجمالياً لتصبح أسطورة حقيقية مع حدود النار المتحركة!',
    bn: 'অ্যানিমেটেড ফায়ার বর্ডার সহ সত্যিকারের কিংবদন্তি হতে মোট 50টি জয় অর্জন করুন!',
    hi: 'एनिमेटेड फायर बॉर्डर के साथ एक सच्चे किंवदंती बनने के लिए कुल 50 जीत हासिल करें!',
    es: '¡Logra 50 victorias totales para convertirte en una verdadera leyenda con borde de fuego animado!',
    id: 'Capai 50 kemenangan total untuk menjadi legenda sejati dengan border api beranimasi!'
  },
  achieveOneHundredTotalWins: {
    en: 'Achieve 100 total wins to become an ultimate champion with cosmic border!',
    ar: 'حقق 100 انتصار إجمالي لتصبح بطلاً نهائياً مع حدود كونية!',
    bn: 'কসমিক বর্ডার সহ চূড়ান্ত চ্যাম্পিয়ন হতে মোট 100টি জয় অর্জন করুন!',
    hi: 'कॉस्मिक बॉर्डर के साथ एक परम चैंपियन बनने के लিए कुল 100 जीत हासिল करें!',
    es: '¡Logra 100 victorias totales para convertirte en un campeón definitivo con borde cósmico!',
    id: 'Capai 100 kemenangan total untuk menjadi juara tertinggi dengan border kosmik!'
  },
  
  // Room Management
  quickMatch: {
    en: 'Quick Match',
    ar: 'مباراة سريعة',
    bn: 'দ্রুত ম্যাচ',
    hi: 'त्वरित मैच',
    es: 'Partida Rápida',
    id: 'Pertandingan Cepat'
  },
  getMatchedWithAnotherPlayer: {
    en: 'Get matched with another player instantly',
    ar: 'احصل على مباراة مع لاعب آخر فوراً',
    bn: 'তাৎক্ষণিকভাবে অন্য খেলোয়াড়ের সাথে ম্যাচ পান',
    hi: 'तुरंत दूसरे खिलाड़ी के साथ मैच हो जाएं',
    es: 'Obtén una partida con otro jugador al instante',
    id: 'Dapatkan pertandingan dengan pemain lain secara instan'
  },
  findMatch: {
    en: 'Find Match',
    ar: 'البحث عن مباراة',
    bn: 'ম্যাচ খুঁজুন',
    hi: 'मैच खोजें',
    es: 'Buscar Partida',
    id: 'Cari Pertandingan'
  },
  or: {
    en: 'or',
    ar: 'أو',
    bn: 'অথবা',
    hi: 'या',
    es: 'o',
    id: 'atau'
  },
  createOrJoinRoom: {
    en: 'Create or join a room to play with friends',
    ar: 'أنشئ أو انضم إلى غرفة للعب مع الأصدقاء',
    bn: 'বন্ধুদের সাথে খেলার জন্য একটি রুম তৈরি করুন বা যোগ দিন',
    hi: 'दोस्तों के साथ खेलने के लिए एक रूम बनाएं या शामिल हों',
    es: 'Crea o únete a una sala para jugar con amigos',
    id: 'Buat atau bergabung dengan ruang untuk bermain dengan teman'
  },
  roomManagement: {
    en: 'Room Management',
    ar: 'إدارة الغرفة',
    bn: 'রুম ব্যবস্থাপনা',
    hi: 'रूम प्रबंधन',
    es: 'Gestión de Sala',
    id: 'Manajemen Ruang'
  },
  roomCode: {
    en: 'Room code',
    ar: 'رمز الغرفة',
    bn: 'রুম কোড',
    hi: 'रूम कोड',
    es: 'Código de sala',
    id: 'Kode ruang'
  },
  joinAsPlayer: {
    en: 'Join as Player',
    ar: 'انضم كلاعب',
    bn: 'খেলোয়াড় হিসেবে যোগ দিন',
    hi: 'खिलाड़ी के रूप में शामिल हों',
    es: 'Unirse como Jugador',
    id: 'Bergabung sebagai Pemain'
  },
  joinAsSpectator: {
    en: 'Join as Spectator',
    ar: 'انضم كمشاهد',
    bn: 'দর্শক হিসেবে যোগ দিন',
    hi: 'दर्शक के रूप में शामिल हों',
    es: 'Unirse como Espectador',
    id: 'Bergabung sebagai Penonton'
  },
  createNewRoom: {
    en: 'Create New Room',
    ar: 'إنشاء غرفة جديدة',
    bn: 'নতুন রুম তৈরি করুন',
    hi: 'नया रूम बनाएं',
    es: 'Crear Nueva Sala',
    id: 'Buat Ruang Baru'
  },
  
  // Online Users
  onlineUsers: {
    en: 'Online Users',
    ar: 'المستخدمون المتصلون',
    bn: 'অনলাইন ব্যবহারকারী',
    hi: 'ऑनलाइन उपयोगकर्ता',
    es: 'Usuarios en Línea',
    id: 'Pengguna Online'
  },
  
  // Room and Matchmaking
  roomName: {
    en: 'Room Name',
    ar: 'اسم الغرفة',
    bn: 'রুমের নাম',
    hi: 'रूम का नाम',
    es: 'Nombre de la Sala',
    id: 'Nama Ruang'
  },
  enterRoomName: {
    en: 'Enter room name',
    ar: 'أدخل اسم الغرفة',
    bn: 'রুমের নাম লিখুন',
    hi: 'रूम का नाम दर्ज करें',
    es: 'Ingresa el nombre de la sala',
    id: 'Masukkan nama ruang'
  },
  maxPlayers: {
    en: 'Max Players',
    ar: 'أقصى عدد لاعبين',
    bn: 'সর্বোচ্চ খেলোয়াড়',
    hi: 'अधिकतम खिलाड़ी',
    es: 'Máximo de Jugadores',
    id: 'Pemain Maksimal'
  },
  twoPlayers: {
    en: '2 Players',
    ar: '2 لاعبين',
    bn: '2 জন খেলোয়াড়',
    hi: '2 खिलाड़ी',
    es: '2 Jugadores',
    id: '2 Pemain'
  },
  twoPlayersSpectators: {
    en: '2 Players + 50 Spectators',
    ar: '2 لاعبين + 50 مشاهد',
    bn: '2 জন খেলোয়াড় + 50 জন দর্শক',
    hi: '2 खिलाड़ी + 50 दर्शक',
    es: '2 Jugadores + 50 Espectadores',
    id: '2 Pemain + 50 Penonton'
  },
  private: {
    en: 'Private',
    ar: 'خاص',
    bn: 'ব্যক্তিগত',
    hi: 'निजी',
    es: 'Privado',
    id: 'Pribadi'
  },
  makeRoomPrivate: {
    en: 'Make room private (invite only)',
    ar: 'جعل الغرفة خاصة (بدعوة فقط)',
    bn: 'রুমটি ব্যক্তিগত করুন (শুধুমাত্র আমন্ত্রণের মাধ্যমে)',
    hi: 'रूम को निजी बनाएं (केवल आमंत्रण)',
    es: 'Hacer la sala privada (solo por invitación)',
    id: 'Buat ruang privat (hanya undangan)'
  },
  createRoom: {
    en: 'Create Room',
    ar: 'إنشاء غرفة',
    bn: 'রুম তৈরি করুন',
    hi: 'रूम बनाएं',
    es: 'Crear Sala',
    id: 'Buat Ruang'
  },
  creating: {
    en: 'Creating...',
    ar: 'جاري الإنشاء...',
    bn: 'তৈরি করা হচ্ছে...',
    hi: 'बनाया जा रहा है...',
    es: 'Creando...',
    id: 'Membuat...'
  },
  roomCreated: {
    en: 'Room Created',
    ar: 'تم إنشاء الغرفة',
    bn: 'রুম তৈরি হয়েছে',
    hi: 'रूम बनाया गया',
    es: 'Sala Creada',
    id: 'Ruang Dibuat'
  },
  roomCodeCreated: {
    en: 'Room %s created successfully',
    ar: 'تم إنشاء الغرفة %s بنجاح',
    bn: 'রুম %s সফলভাবে তৈরি হয়েছে',
    hi: 'रूम %s सफलतापूर्वक बनाया गया',
    es: 'Sala %s creada exitosamente',
    id: 'Ruang %s berhasil dibuat'
  },
  error: {
    en: 'Error',
    ar: 'خطأ',
    bn: 'ত্রুটি',
    hi: 'त्रुटि',
    es: 'Error',
    id: 'Kesalahan'
  },
  roomNameRequired: {
    en: 'Room name is required',
    ar: 'اسم الغرفة مطلوب',
    bn: 'রুমের নাম প্রয়োজন',
    hi: 'रूम का नाम आवश्यक है',
    es: 'Se requiere el nombre de la sala',
    id: 'Nama ruang diperlukan'
  },
  unauthorized: {
    en: 'Unauthorized',
    ar: 'غير مصرح',
    bn: 'অননুমোদিত',
    hi: 'अनधिकृत',
    es: 'No autorizado',
    id: 'Tidak Diotorisasi'
  },
  loggedOutLoggingIn: {
    en: 'You are logged out. Logging in again...',
    ar: 'لقد تم تسجيل خروجك. جاري تسجيل الدخول مرة أخرى...',
    bn: 'আপনি লগ আউট হয়েছেন। আবার লগ ইন করা হচ্ছে...',
    hi: 'आप लॉग आउट हैं। फिर से लॉग इन कर रहे हैं...',
    es: 'Has cerrado sesión. Iniciando sesión de nuevo...',
    id: 'Anda telah logout. Masuk lagi...'
  },
  success: {
    en: 'Success',
    ar: 'نجح',
    bn: 'সফল',
    hi: 'सफलता',
    es: 'Éxito',
    id: 'Berhasil'
  },
  joinedRoomSuccessfully: {
    en: 'Joined room successfully',
    ar: 'انضممت إلى الغرفة بنجاح',
    bn: 'সফলভাবে রুমে যোগ দিয়েছেন',
    hi: 'सफलतापूर्वक रूम में शामिल हुए',
    es: 'Se unió a la sala exitosamente',
    id: 'Berhasil bergabung dengan ruang'
  },
  gameStarted: {
    en: 'Game Started',
    ar: 'بدأت اللعبة',
    bn: 'গেম শুরু',
    hi: 'गेम शुरू',
    es: 'Juego Iniciado',
    id: 'Permainan Dimulai'
  },
  letTheBattleBegin: {
    en: 'Let the battle begin!',
    ar: 'لتبدأ المعركة!',
    bn: 'যুদ্ধ শুরু হোক!',
    hi: 'युद्ध शुरू हो!',
    es: '¡Que comience la batalla!',
    id: 'Biarkan pertempuran dimulai!'
  },
  searching: {
    en: 'Searching...',
    ar: 'جاري البحث...',
    bn: 'খোঁজা হচ্ছে...',
    hi: 'खोज रहे हैं...',
    es: 'Buscando...',
    id: 'Mencari...'
  },
  matchFound: {
    en: 'Match Found!',
    ar: 'تم العثور على مباراة!',
    bn: 'ম্যাচ পাওয়া গেছে!',
    hi: 'मैच मिल गया!',
    es: '¡Partida Encontrada!',
    id: 'Pertandingan Ditemukan!'
  },
  matchedWithOpponent: {
    en: "You've been matched with an opponent. Game starting...",
    ar: 'تم ربطك مع خصم. بدء اللعبة...',
    bn: 'আপনাকে একজন প্রতিপক্ষের সাথে ম্যাচ করা হয়েছে। গেম শুরু হচ্ছে...',
    hi: 'आपका मैच एक प्रतिद्वंद्वी के साथ हो गया है। गेम शुरू हो रहा है...',
    es: 'Has sido emparejado con un oponente. El juego está comenzando...',
    id: 'Anda telah dicocokkan dengan lawan. Permainan dimulai...'
  },
  searchingForOpponent: {
    en: 'Searching for Opponent',
    ar: 'البحث عن خصم',
    bn: 'প্রতিপক্ষ খোঁজা হচ্ছে',
    hi: 'प्रतिद्वंद्वी की खोज',
    es: 'Buscando Oponente',
    id: 'Mencari Lawan'
  },
  lookingForPlayer: {
    en: 'Looking for another player to match with...',
    ar: 'البحث عن لاعب آخر للمطابقة معه...',
    bn: 'ম্যাচ করার জন্য অন্য খেলোয়াড় খোঁজা হচ্ছে...',
    hi: 'मैच करने के लिए दूसरा खिलाड़ी खोज रहे हैं...',
    es: 'Buscando otro jugador para emparejar...',
    id: 'Mencari pemain lain untuk dicocokkan...'
  },
  leftQueue: {
    en: 'Left Queue',
    ar: 'ترك الطابور',
    bn: 'সারি ছেড়েছেন',
    hi: 'कतार छोड़ दी',
    es: 'Salió de la Cola',
    id: 'Meninggalkan Antrian'
  },
  leftMatchmakingQueue: {
    en: "You've left the matchmaking queue.",
    ar: 'لقد تركت طابور المطابقة.',
    bn: 'আপনি ম্যাচমেকিং সারি ছেড়ে দিয়েছেন।',
    hi: 'आपने मैचमेकिंग कतार छोड़ दी है।',
    es: 'Has salido de la cola de emparejamiento.',
    id: 'Anda telah meninggalkan antrian matchmaking.'
  },
  
  // Additional Room Management
  roomCode: {
    en: 'Room Code',
    ar: 'رمز الغرفة',
    bn: 'রুম কোড',
    hi: 'रूम कोड',
    es: 'Código de Sala',
    id: 'Kode Ruang'
  },
  joinAsPlayer: {
    en: 'Join as Player',
    ar: 'انضم كلاعب',
    bn: 'খেলোয়াড় হিসেবে যোগ দিন',
    hi: 'खिलाड़ी के रूप में शामिल हों',
    es: 'Unirse como Jugador',
    id: 'Bergabung sebagai Pemain'
  },
  joinAsSpectator: {
    en: 'Join as Spectator',
    ar: 'انضم كمشاهد',
    bn: 'দর্শক হিসেবে যোগ দিন',
    hi: 'दर्शक के रूप में शामिल हों',
    es: 'Unirse como Espectador',
    id: 'Bergabung sebagai Penonton'
  },
  readyToPlay: {
    en: 'Ready to Play?',
    ar: 'مستعد للعب؟',
    bn: 'খেলার জন্য প্রস্তুত?',
    hi: 'खेलने के लिए तैयार?',
    es: '¿Listo para Jugar?',
    id: 'Siap Bermain?'
  },
  findAnotherPlayerCompete: {
    en: "We'll find another player for you to compete against in real-time!",
    ar: 'سنجد لك لاعباً آخر للتنافس معه في الوقت الفعلي!',
    bn: 'আমরা আপনার জন্য রিয়েল-টাইমে প্রতিযোগিতা করার জন্য আরেকজন খেলোয়াড় খুঁজে দেব!',
    hi: 'हम आपके लिए रीयल-टाइम में प्रतिस्पर्धा करने के लिए एक और खिलाड़ी ढूंढेंगे!',
    es: '¡Te encontraremos otro jugador para competir en tiempo real!',
    id: 'Kami akan menemukan pemain lain untuk Anda lawan secara real-time!'
  },
  onlinePlayersLookingForMatches: {
    en: 'Online players looking for matches',
    ar: 'اللاعبون المتصلون يبحثون عن مباريات',
    bn: 'অনলাইন খেলোয়াড়রা ম্যাচ খুঁজছেন',
    hi: 'ऑनलाइन खिलाड़ी मैच की तलाश में हैं',
    es: 'Jugadores en línea buscando partidas',
    id: 'Pemain online mencari pertandingan'
  },
  averageMatchTime: {
    en: 'Average match time: 10-30 seconds',
    ar: 'متوسط وقت المباراة: 10-30 ثانية',
    bn: 'গড় ম্যাচ সময়: 10-30 সেকেন্ড',
    hi: 'औसत मैच समय: 10-30 सेकंड',
    es: 'Tiempo promedio de partida: 10-30 segundos',
    id: 'Waktu rata-rata pertandingan: 10-30 detik'
  },
  searchTime: {
    en: 'Search Time:',
    ar: 'وقت البحث:',
    bn: 'অনুসন্ধানের সময়:',
    hi: 'खोज का समय:',
    es: 'Tiempo de Búsqueda:',
    id: 'Waktu Pencarian:'
  },
  status: {
    en: 'Status:',
    ar: 'الحالة:',
    bn: 'স্থিতি:',
    hi: 'स्थिति:',
    es: 'Estado:',
    id: 'Status:'
  },
  findingPerfectOpponent: {
    en: 'Finding the perfect opponent...',
    ar: 'العثور على الخصم المثالي...',
    bn: 'নিখুঁত প্রতিপক্ষ খোঁজা হচ্ছে...',
    hi: 'सही प्रतिद्वंद्वी खोजा जा रहा है...',
    es: 'Encontrando el oponente perfecto...',
    id: 'Mencari lawan yang sempurna...'
  },
  expandingSearch: {
    en: 'Expanding search...',
    ar: 'توسيع البحث...',
    bn: 'অনুসন্ধান সম্প্রসারণ...',
    hi: 'खोज का विस्तार कर रहे हैं...',
    es: 'Expandiendo búsqueda...',
    id: 'Memperluas pencarian...'
  },
  almostThere: {
    en: 'Almost there...',
    ar: 'تقريباً وصلنا...',
    bn: 'প্রায় শেষ...',
    hi: 'लगभग हो गया...',
    es: 'Casi llegamos...',
    id: 'Hampir sampai...'
  },

  // Game Over Modal
  gameOver: {
    en: 'Game Over!',
    ar: 'انتهت اللعبة!',
    bn: 'খেলা শেষ!',
    hi: 'खेल समाप्त!',
    es: '¡Juego Terminado!',
    id: 'Permainan Selesai!'
  },
  playerWins: {
    en: 'Player {player} Wins!',
    ar: 'اللاعب {player} يفوز!',
    bn: 'খেলোয়াড় {player} জিতেছে!',
    hi: 'खिलाड़ी {player} जीता!',
    es: '¡Jugador {player} Gana!',
    id: 'Pemain {player} Menang!'
  },
  diagonalLine: {
    en: 'Diagonal line',
    ar: 'خط قطري',
    bn: 'কর্ণ রেখা',
    hi: 'विकर्ण रेखा',
    es: 'Línea diagonal',
    id: 'Garis diagonal'
  },
  mainMenu: {
    en: 'Main Menu',
    ar: 'القائمة الرئيسية',
    bn: 'প্রধান মেনু',
    hi: 'मुख्य मेनू',
    es: 'Menú Principal',
    id: 'Menu Utama'
  },
  playAgain: {
    en: 'Play Again',
    ar: 'العب مرة أخرى',
    bn: 'আবার খেলুন',
    hi: 'फिर से खेलें',
    es: 'Jugar de Nuevo',
    id: 'Main Lagi'
  },
  itsADraw: {
    en: "It's a Draw!",
    ar: 'إنه تعادل!',
    bn: 'এটি একটি ড্র!',
    hi: 'यह एक ड्रॉ है!',
    es: '¡Es un Empate!',
    id: 'Ini Seri!'
  },
  horizontalLine: {
    en: 'Horizontal line',
    ar: 'خط أفقي',
    bn: 'অনুভূমিক রেখা',
    hi: 'क्षैतिज रेखा',
    es: 'Línea horizontal',
    id: 'Garis horizontal'
  },

  // Achievement Descriptions
  speedDemonDesc: {
    en: 'Win 20 total games to unlock the Christmas theme - keep playing!',
    ar: 'اربح 20 لعبة إجمالية لفتح موضوع عيد الميلاد - استمر في اللعب!',
    bn: 'ক্রিসমাস থিম আনলক করতে মোট 20টি গেম জিতুন - খেলা চালিয়ে যান!',
    hi: 'क्रिसमस थीम अनलॉक करने के लिए कुल 20 गेम जीतें - खेलते रहें!',
    es: '¡Gana 20 juegos en total para desbloquear el tema navideño - sigue jugando!',
    id: 'Menangkan total 20 permainan untuk membuka tema Natal - terus bermain!'
  },
  legendDesc: {
    en: 'Achieve 50 total wins to become a true legend with animated border!',
    ar: 'حقق 50 فوزًا إجماليًا لتصبح أسطورة حقيقية مع حدود متحركة!',
    bn: 'অ্যানিমেটেড বর্ডার সহ সত্যিকারের কিংবদন্তি হতে মোট 50টি জয় অর্জন করুন!',
    hi: 'एनिमेटेड बॉर्डर के साथ सच्चे लीজेंड बनने के लिए कुल 50 जीत हासिल करें!',
    es: '¡Consigue 50 victorias totales para convertirte en una verdadera leyenda con borde animado!',
    id: 'Raih total 50 kemenangan untuk menjadi legenda sejati dengan border animasi!'
  },
  championDesc: {
    en: 'Achieve 100 total wins to become an ultimate champion with cosmic border!',
    ar: 'حقق 100 فوزًا إجماليًا لتصبح بطلاً نهائيًا مع حدود كونية!',
    bn: 'কসমিক বর্ডার সহ চূড়ান্ত চ্যাম্পিয়ন হতে মোট 100টি জয় অর্জন করুন!',
    hi: 'कॉस्मिक बॉर्डर के साथ अंतिम चैंपियन बनने के लिए कुल 100 जीत हासिल करें!',
    es: '¡Consigue 100 victorias totales para convertirte en un campeón definitivo con borde cósmico!',
    id: 'Raih total 100 kemenangan untuk menjadi juara utama dengan border kosmik!'
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