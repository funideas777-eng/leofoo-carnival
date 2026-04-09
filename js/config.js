// ============================================================
// 六福村動物嘉年華 - 核心設定檔
// ============================================================

const CONFIG = {
  // === 活動設定 ===
  eventName: '六福村動物嘉年華',
  eventDate: '2026-04-18',
  eventStart: '10:00',
  eventEnd: '14:00',

  // === GAS API URLs (部署後填入) ===
  API: {
    READ: 'https://script.google.com/macros/s/AKfycbw01BnJfsIJ_-UkML6t4zojLAHoozl5NXP71DAj4vgGO55UblenTzsdh02UcNcYpqz-/exec',
    WRITE: 'https://script.google.com/macros/s/AKfycbw01BnJfsIJ_-UkML6t4zojLAHoozl5NXP71DAj4vgGO55UblenTzsdh02UcNcYpqz-/exec',
    PHOTO: 'https://script.google.com/macros/s/AKfycbw01BnJfsIJ_-UkML6t4zojLAHoozl5NXP71DAj4vgGO55UblenTzsdh02UcNcYpqz-/exec',
    ADMIN: 'https://script.google.com/macros/s/AKfycbw01BnJfsIJ_-UkML6t4zojLAHoozl5NXP71DAj4vgGO55UblenTzsdh02UcNcYpqz-/exec'
  },

  // === 快取 TTL (毫秒) ===
  CACHE_TTL: {
    teamRankings: 30000,
    gameLocations: 600000,
    adventureTasks: 600000,
    broadcasts: 10000,
    gameScores: 15000,
    config: 600000
  },

  // === 輪詢間隔 (毫秒) ===
  POLL: {
    broadcastBase: 15000,
    broadcastJitter: 10000,
    scoreboardBase: 30000,
    scoreboardJitter: 15000
  },

  // === GPS 設定 ===
  GPS: {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
    accuracyThreshold: 50,
    gameUnlockRadius: 30,
    rideVerifyRadius: 50,
    defaultDwellSeconds: 180
  },

  // === 照片設定 ===
  PHOTO: {
    maxWidth: 1024,
    jpegQuality: 0.7,
    maxSizeKB: 800
  },

  // === 六福村中心座標 ===
  PARK_CENTER: { lat: 24.8389, lng: 121.2352 },

  // === 60 隊動物隊名 ===
  TEAMS: [
    { id: 1, name: '獅子隊', emoji: '🦁' },
    { id: 2, name: '長頸鹿隊', emoji: '🦒' },
    { id: 3, name: '大象隊', emoji: '🐘' },
    { id: 4, name: '熊貓隊', emoji: '🐼' },
    { id: 5, name: '猴子隊', emoji: '🐵' },
    { id: 6, name: '斑馬隊', emoji: '🦓' },
    { id: 7, name: '黑熊隊', emoji: '🐻' },
    { id: 8, name: '企鵝隊', emoji: '🐧' },
    { id: 9, name: '紅鶴隊', emoji: '🦩' },
    { id: 10, name: '犀牛隊', emoji: '🦏' },
    { id: 11, name: '老虎隊', emoji: '🐯' },
    { id: 12, name: '河馬隊', emoji: '🦛' },
    { id: 13, name: '鱷魚隊', emoji: '🐊' },
    { id: 14, name: '袋鼠隊', emoji: '🦘' },
    { id: 15, name: '無尾熊隊', emoji: '🐨' },
    { id: 16, name: '孔雀隊', emoji: '🦚' },
    { id: 17, name: '獵豹隊', emoji: '🐆' },
    { id: 18, name: '北極熊隊', emoji: '🐻‍❄️' },
    { id: 19, name: '狐狸隊', emoji: '🦊' },
    { id: 20, name: '貓頭鷹隊', emoji: '🦉' },
    { id: 21, name: '海豚隊', emoji: '🐬' },
    { id: 22, name: '鸚鵡隊', emoji: '🦜' },
    { id: 23, name: '水獺隊', emoji: '🦦' },
    { id: 24, name: '浣熊隊', emoji: '🦝' },
    { id: 25, name: '馴鹿隊', emoji: '🦌' },
    { id: 26, name: '白兔隊', emoji: '🐰' },
    { id: 27, name: '蜜蜂隊', emoji: '🐝' },
    { id: 28, name: '蝴蝶隊', emoji: '🦋' },
    { id: 29, name: '獨角獸隊', emoji: '🦄' },
    { id: 30, name: '鯨魚隊', emoji: '🐳' },
    { id: 31, name: '海龜隊', emoji: '🐢' },
    { id: 32, name: '松鼠隊', emoji: '🐿️' },
    { id: 33, name: '刺蝟隊', emoji: '🦔' },
    { id: 34, name: '柴犬隊', emoji: '🐕' },
    { id: 35, name: '羊駝隊', emoji: '🦙' },
    { id: 36, name: '變色龍隊', emoji: '🦎' },
    { id: 37, name: '火烈鳥隊', emoji: '🦩' },
    { id: 38, name: '海馬隊', emoji: '🐴' },
    { id: 39, name: '蜂鳥隊', emoji: '🐦' },
    { id: 40, name: '飛鼠隊', emoji: '🐿️' },
    { id: 41, name: '穿山甲隊', emoji: '🦔' },
    { id: 42, name: '石虎隊', emoji: '🐱' },
    { id: 43, name: '黑鳶隊', emoji: '🦅' },
    { id: 44, name: '梅花鹿隊', emoji: '🦌' },
    { id: 45, name: '藍鵲隊', emoji: '🐦' },
    { id: 46, name: '白鷺隊', emoji: '🦢' },
    { id: 47, name: '黑面琵鷺隊', emoji: '🦢' },
    { id: 48, name: '雲豹隊', emoji: '🐆' },
    { id: 49, name: '龍蝦隊', emoji: '🦞' },
    { id: 50, name: '海獅隊', emoji: '🦭' },
    { id: 51, name: '紅毛猩猩隊', emoji: '🦧' },
    { id: 52, name: '草泥馬隊', emoji: '🦙' },
    { id: 53, name: '雪豹隊', emoji: '🐆' },
    { id: 54, name: '大嘴鳥隊', emoji: '🦜' },
    { id: 55, name: '水母隊', emoji: '🪼' },
    { id: 56, name: '章魚隊', emoji: '🐙' },
    { id: 57, name: '天鵝隊', emoji: '🦢' },
    { id: 58, name: '鶴隊', emoji: '🦩' },
    { id: 59, name: '鷹隊', emoji: '🦅' },
    { id: 60, name: '小龍隊', emoji: '🐉' }
  ],

  // === 10 款小遊戲定義 ===
  GAMES: [
    {
      id: 'snake', name: '貪食蛇', icon: '🐍',
      description: '滑動方向控制蛇身，吃下動物食物得分',
      duration: 60, color: '#4CAF50',
      location: { lat: 24.8405, lng: 121.2330, radius: 30 }
    },
    {
      id: 'racing', name: '動物賽車', icon: '🏎️',
      description: '傾斜手機控制賽車，躲避障礙收集金幣',
      duration: 60, color: '#F44336',
      location: { lat: 24.8395, lng: 121.2365, radius: 30 }
    },
    {
      id: 'memory', name: '記憶翻牌', icon: '🃏',
      description: '翻開配對相同動物圖案',
      duration: 90, color: '#9C27B0',
      location: { lat: 24.8380, lng: 121.2340, radius: 30 }
    },
    {
      id: 'rhythm', name: '節奏遊戲', icon: '🎵',
      description: '跟著節奏點擊左右區域',
      duration: 60, color: '#FF9800',
      location: { lat: 24.8370, lng: 121.2355, radius: 30 }
    },
    {
      id: 'whack', name: '打地鼠', icon: '🔨',
      description: '點擊冒出的動物得分，別打到瀕危動物',
      duration: 45, color: '#795548',
      location: { lat: 24.8400, lng: 121.2350, radius: 30 }
    },
    {
      id: 'puzzle', name: '動物拼圖', icon: '🧩',
      description: '滑動拼塊完成動物拼圖',
      duration: 120, color: '#00BCD4',
      location: { lat: 24.8385, lng: 121.2370, radius: 30 }
    },
    {
      id: 'catch', name: '接動物', icon: '🧺',
      description: '左右移動籃子接住掉落的動物',
      duration: 60, color: '#8BC34A',
      location: { lat: 24.8375, lng: 121.2335, radius: 30 }
    },
    {
      id: 'quiz', name: '動物問答', icon: '❓',
      description: '回答動物知識問題，答越快分越高',
      duration: 0, color: '#3F51B5',
      location: { lat: 24.8390, lng: 121.2325, radius: 30 }
    },
    {
      id: 'runner', name: '障礙跑', icon: '🏃',
      description: '點擊跳躍躲避障礙，跑越遠分越高',
      duration: 0, color: '#E91E63',
      location: { lat: 24.8410, lng: 121.2345, radius: 30 }
    },
    {
      id: 'bubble', name: '動物泡泡', icon: '🫧',
      description: '發射泡泡消除相同顏色的動物',
      duration: 60, color: '#673AB7',
      location: { lat: 24.8365, lng: 121.2360, radius: 30 }
    }
  ],

  // === 冒險任務 (六福村遊樂設施) ===
  ADVENTURES: [
    { id: 'ride1', name: '笑傲飛鷹', icon: '🦅', lat: 24.8395, lng: 121.2340, radius: 50, dwellSeconds: 180, points: 200 },
    { id: 'ride2', name: '火山歷險', icon: '🌋', lat: 24.8385, lng: 121.2350, radius: 50, dwellSeconds: 150, points: 200 },
    { id: 'ride3', name: '急流泛舟', icon: '🚣', lat: 24.8375, lng: 121.2345, radius: 50, dwellSeconds: 180, points: 200 },
    { id: 'ride4', name: '大乙乾坤', icon: '🎡', lat: 24.8400, lng: 121.2355, radius: 50, dwellSeconds: 120, points: 150 },
    { id: 'ride5', name: '風火輪', icon: '🎢', lat: 24.8390, lng: 121.2360, radius: 50, dwellSeconds: 120, points: 150 },
    { id: 'ride6', name: '海盜船', icon: '🏴‍☠️', lat: 24.8380, lng: 121.2330, radius: 50, dwellSeconds: 120, points: 150 },
    { id: 'ride7', name: '非洲乘車探險', icon: '🦁', lat: 24.8410, lng: 121.2340, radius: 80, dwellSeconds: 300, points: 300 },
    { id: 'ride8', name: '猴子行大運', icon: '🐒', lat: 24.8370, lng: 121.2365, radius: 50, dwellSeconds: 120, points: 150 },
    { id: 'photo1', name: '團隊動物合照', icon: '📸', lat: 24.8389, lng: 121.2352, radius: 100, dwellSeconds: 0, points: 500, requirePhoto: true },
    { id: 'photo2', name: '最佳動物模仿', icon: '🎭', lat: 24.8389, lng: 121.2352, radius: 200, dwellSeconds: 0, points: 300, requirePhoto: true }
  ],

  // === 動物知識問答題庫 ===
  QUIZ_QUESTIONS: [
    { q: '長頸鹿的舌頭大約有多長？', options: ['20公分', '35公分', '45公分', '60公分'], answer: 2 },
    { q: '企鵝是哪種類型的動物？', options: ['哺乳類', '爬蟲類', '鳥類', '兩棲類'], answer: 2 },
    { q: '哪種動物的心臟最大？', options: ['大象', '藍鯨', '長頸鹿', '河馬'], answer: 1 },
    { q: '變色龍變色的主要原因是？', options: ['偽裝', '溫度調節', '情緒與溝通', '以上皆是'], answer: 3 },
    { q: '哪種動物睡覺時只閉一隻眼？', options: ['貓頭鷹', '海豚', '鱷魚', '蛇'], answer: 1 },
    { q: '台灣特有種「台灣黑熊」胸前的標誌是什麼形狀？', options: ['圓形', 'V字形', '星形', '三角形'], answer: 1 },
    { q: '蜂鳥每秒鐘可以拍翅膀幾次？', options: ['10次', '30次', '50次', '80次'], answer: 3 },
    { q: '章魚有幾顆心臟？', options: ['1顆', '2顆', '3顆', '4顆'], answer: 2 },
    { q: '哪種動物的指紋跟人類最相似？', options: ['猴子', '無尾熊', '黑猩猩', '大猩猩'], answer: 1 },
    { q: '石虎是台灣的什麼級保育類動物？', options: ['一般類', '珍貴稀有', '瀕臨絕種', '不是保育類'], answer: 2 },
    { q: '大象用什麼部位喝水？', options: ['嘴巴', '鼻子', '鼻子吸再送到嘴巴', '舌頭'], answer: 2 },
    { q: '世界上最快的陸地動物是？', options: ['獅子', '獵豹', '羚羊', '老虎'], answer: 1 },
    { q: '紅鶴為什麼是粉紅色的？', options: ['天生的', '陽光照射', '食物中的蝦紅素', '基因突變'], answer: 2 },
    { q: '哪種動物可以倒著飛？', options: ['老鷹', '蜂鳥', '蝴蝶', '蜻蜓'], answer: 1 },
    { q: '梅花鹿身上的白斑點有什麼作用？', options: ['散熱', '求偶', '保護色偽裝', '純裝飾'], answer: 2 },
    { q: '海龜可以活多少年？', options: ['20年', '50年', '100年以上', '200年以上'], answer: 2 },
    { q: '袋鼠寶寶出生時大約多大？', options: ['跟橘子一樣', '跟花生一樣', '跟葡萄一樣', '跟西瓜一樣'], answer: 1 },
    { q: '哪種動物的記憶力最好？', options: ['海豚', '大象', '烏鴉', '猴子'], answer: 1 },
    { q: '世界上最大的蛇是？', options: ['眼鏡王蛇', '蟒蛇', '森蚺', '黑曼巴蛇'], answer: 2 },
    { q: '熊貓一天大約花多少時間吃竹子？', options: ['4小時', '8小時', '12小時', '16小時'], answer: 2 }
  ]
};

// 工具函數：根據 teamId 取得隊伍資訊
function getTeamById(teamId) {
  return CONFIG.TEAMS.find(t => t.id === teamId);
}

// 工具函數：根據 gameId 取得遊戲資訊
function getGameById(gameId) {
  return CONFIG.GAMES.find(g => g.id === gameId);
}

// 工具函數：根據 adventureId 取得冒險任務資訊
function getAdventureById(adventureId) {
  return CONFIG.ADVENTURES.find(a => a.id === adventureId);
}
