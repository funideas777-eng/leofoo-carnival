// ============================================================
// 六福村動物嘉年華 - Google Apps Script 後端
// 部署方式：Google Apps Script → 網頁應用程式 → 所有人都能存取
// ============================================================

const SPREADSHEET_ID = '1hbYc-taIXFmo3u_MQwMp-g8HVh6I5SdjH5k4t8h7pPg';
const DRIVE_FOLDER_ID = '1hD5DPCXNAi1_Y4zoWwibiyEOgiwg8Kjg';
const ADMIN_PASSWORD = 'leofoo2026admin';

// === 快取 ===
const scriptCache = CacheService.getScriptCache();

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

// ============================================================
// doGet - 所有讀取端點
// ============================================================
function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getTeams':
        result = handleGetTeams();
        break;
      case 'getPlayer':
        result = handleGetPlayer(e.parameter.playerId);
        break;
      case 'getGameScores':
        result = handleGetGameScores(e.parameter.gameId, parseInt(e.parameter.limit) || 20);
        break;
      case 'getTeamRankings':
        result = handleGetTeamRankings();
        break;
      case 'getBroadcasts':
        result = handleGetBroadcasts(e.parameter.since);
        break;
      case 'getGameLocations':
        result = handleGetGameLocations();
        break;
      case 'getAdventureTasks':
        result = handleGetAdventureTasks();
        break;
      case 'getUnlocks':
        result = handleGetUnlocks(e.parameter.playerId);
        break;
      case 'getAdventureStatus':
        result = handleGetAdventureStatus(e.parameter.playerId);
        break;
      case 'getConfig':
        result = handleGetConfig();
        break;
      case 'getPendingPhotos':
        result = handleGetPendingPhotos();
        break;
      case 'getDashboard':
        result = handleGetDashboard();
        break;
      default:
        result = { error: '未知的 action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// doPost - 所有寫入端點
// ============================================================
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return jsonResponse({ error: '無效的 JSON' });
  }

  let result;
  try {
    switch (body.action) {
      case 'register':
        result = handleRegister(body);
        break;
      case 'unlockGame':
        result = handleUnlockGame(body);
        break;
      case 'submitScore':
        result = handleSubmitScore(body);
        break;
      case 'completeAdventure':
        result = handleCompleteAdventure(body);
        break;
      case 'uploadPhoto':
        result = handleUploadPhoto(body);
        break;
      case 'broadcast':
        result = handleBroadcast(body);
        break;
      case 'verifyPhoto':
        result = handleVerifyPhoto(body);
        break;
      case 'addManualPoints':
        result = handleAddManualPoints(body);
        break;
      case 'recalcTeamPoints':
        result = handleRecalcTeamPoints();
        break;
      default:
        result = { error: '未知的 action: ' + body.action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return jsonResponse(result);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// GET 處理函數
// ============================================================

function handleGetTeams() {
  const cached = scriptCache.get('teams');
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('Teams');
  const data = sheet.getDataRange().getValues();
  const teams = data.slice(1).map(row => ({
    teamId: row[0],
    teamName: row[1],
    teamEmoji: row[2],
    totalPoints: row[3] || 0
  }));

  scriptCache.put('teams', JSON.stringify({ teams }), 30);
  return { teams };
}

function handleGetPlayer(playerId) {
  const sheet = getSheet('Players');
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === playerId);
  if (!row) return { error: '找不到玩家' };
  return { player: { playerId: row[0], name: row[1], teamId: row[2], registeredAt: row[3] } };
}

function handleGetGameScores(gameId, limit) {
  const cacheKey = 'scores_' + gameId;
  const cached = scriptCache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('GameScores');
  const data = sheet.getDataRange().getValues();
  const scores = data.slice(1)
    .filter(row => row[3] === gameId)
    .map(row => ({ playerId: row[0], playerName: row[1], teamId: row[2], gameId: row[3], score: row[4], timestamp: row[5] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const result = { scores };
  scriptCache.put(cacheKey, JSON.stringify(result), 15);
  return result;
}

function handleGetTeamRankings() {
  const cached = scriptCache.get('teamRankings');
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('Teams');
  const data = sheet.getDataRange().getValues();
  const rankings = data.slice(1)
    .map(row => ({
      teamId: row[0],
      teamName: row[1],
      teamEmoji: row[2],
      totalPoints: row[3] || 0
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const result = { rankings };
  scriptCache.put('teamRankings', JSON.stringify(result), 30);
  return result;
}

function handleGetBroadcasts(since) {
  const cacheKey = 'broadcasts_' + (since || '0');
  const cached = scriptCache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('Broadcasts');
  const data = sheet.getDataRange().getValues();
  const sinceDate = since ? new Date(since) : new Date(0);

  const broadcasts = data.slice(1)
    .map(row => ({
      broadcastId: row[0],
      type: row[1],
      content: row[2],
      timestamp: row[3],
      lat: row[4] || null,
      lng: row[5] || null
    }))
    .filter(b => new Date(b.timestamp) > sinceDate)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const result = { broadcasts };
  scriptCache.put(cacheKey, JSON.stringify(result), 10);
  return result;
}

function handleGetGameLocations() {
  const cached = scriptCache.get('gameLocations');
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('GameLocations');
  const data = sheet.getDataRange().getValues();
  const locations = data.slice(1).map(row => ({
    gameId: row[0], gameName: row[1], lat: row[2], lng: row[3], radiusMeters: row[4], description: row[5]
  }));

  const result = { locations };
  scriptCache.put('gameLocations', JSON.stringify(result), 300);
  return result;
}

function handleGetAdventureTasks() {
  const cached = scriptCache.get('adventureTasks');
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('AdventureTasks');
  const data = sheet.getDataRange().getValues();
  const tasks = data.slice(1).map(row => ({
    taskId: row[0], taskName: row[1], lat: row[2], lng: row[3],
    radiusMeters: row[4], dwellSeconds: row[5], points: row[6]
  }));

  const result = { tasks };
  scriptCache.put('adventureTasks', JSON.stringify(result), 300);
  return result;
}

function handleGetUnlocks(playerId) {
  const sheet = getSheet('GameUnlocks');
  const data = sheet.getDataRange().getValues();
  const unlocks = data.slice(1)
    .filter(row => row[0] === playerId)
    .map(row => ({ gameId: row[1], unlockedAt: row[2] }));
  return { unlocks };
}

function handleGetAdventureStatus(playerId) {
  const sheet = getSheet('AdventureCompletions');
  const data = sheet.getDataRange().getValues();
  const completions = data.slice(1)
    .filter(row => row[0] === playerId)
    .map(row => ({
      taskId: row[2], completedAt: row[3], verificationType: row[4],
      photoUrl: row[5], verified: row[6]
    }));
  return { completions };
}

function handleGetConfig() {
  const cached = scriptCache.get('config');
  if (cached) return JSON.parse(cached);

  const sheet = getSheet('Config');
  const data = sheet.getDataRange().getValues();
  const config = {};
  data.slice(1).forEach(row => { config[row[0]] = row[1]; });

  const result = { config };
  scriptCache.put('config', JSON.stringify(result), 600);
  return result;
}

function handleGetPendingPhotos() {
  const sheet = getSheet('AdventureCompletions');
  const data = sheet.getDataRange().getValues();
  const pending = data.slice(1)
    .map((row, i) => ({
      rowIndex: i + 2,
      playerId: row[0], teamId: row[1], taskId: row[2],
      completedAt: row[3], photoUrl: row[5], verified: row[6], adminNotes: row[7]
    }))
    .filter(r => r.photoUrl && r.verified !== true && r.verified !== 'TRUE');
  return { pending };
}

function handleGetDashboard() {
  const players = getSheet('Players').getDataRange().getValues().length - 1;
  const scores = getSheet('GameScores').getDataRange().getValues().length - 1;
  const unlocks = getSheet('GameUnlocks').getDataRange().getValues().length - 1;
  const completions = getSheet('AdventureCompletions').getDataRange().getValues().length - 1;
  const pendingPhotos = handleGetPendingPhotos().pending.length;

  return {
    dashboard: {
      totalPlayers: players,
      totalGamePlays: scores,
      totalUnlocks: unlocks,
      totalAdventureCompletions: completions,
      pendingPhotos: pendingPhotos,
      timestamp: new Date().toISOString()
    }
  };
}

// ============================================================
// POST 處理函數
// ============================================================

function handleRegister(body) {
  const sheet = getSheet('Players');
  sheet.appendRow([
    body.playerId,
    body.name,
    body.teamId,
    new Date().toISOString()
  ]);
  return { success: true, playerId: body.playerId };
}

function handleUnlockGame(body) {
  const sheet = getSheet('GameUnlocks');
  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => row[0] === body.playerId && row[1] === body.gameId);
  if (exists) return { success: true, message: '已解鎖' };

  sheet.appendRow([
    body.playerId,
    body.gameId,
    new Date().toISOString(),
    body.lat,
    body.lng
  ]);
  return { success: true };
}

function handleSubmitScore(body) {
  const sheet = getSheet('GameScores');
  const session = body;
  sheet.appendRow([
    session.playerId,
    session.playerName || '',
    session.teamId,
    session.gameId,
    session.score,
    new Date().toISOString()
  ]);

  // 清除相關快取
  scriptCache.remove('scores_' + session.gameId);
  scriptCache.remove('teamRankings');

  return { success: true };
}

function handleCompleteAdventure(body) {
  const sheet = getSheet('AdventureCompletions');
  sheet.appendRow([
    body.playerId,
    body.teamId,
    body.taskId,
    new Date().toISOString(),
    'gps',
    '',
    false,
    ''
  ]);
  return { success: true };
}

function handleUploadPhoto(body) {
  // 解碼 Base64 照片並存入 Google Drive
  const blob = Utilities.newBlob(
    Utilities.base64Decode(body.photoBase64),
    'image/jpeg',
    'team' + body.teamId + '_' + body.taskId + '_' + Date.now() + '.jpg'
  );

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const photoUrl = file.getUrl();

  // 記錄到試算表
  const sheet = getSheet('AdventureCompletions');
  sheet.appendRow([
    body.playerId,
    body.teamId,
    body.taskId,
    new Date().toISOString(),
    'photo',
    photoUrl,
    false,
    ''
  ]);

  return { success: true, photoUrl };
}

function handleBroadcast(body) {
  if (body.password !== ADMIN_PASSWORD) return { error: '密碼錯誤' };

  const sheet = getSheet('Broadcasts');
  const lastRow = sheet.getLastRow();
  const broadcastId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;

  sheet.appendRow([
    broadcastId,
    body.type || 'text',
    body.content,
    new Date().toISOString(),
    body.lat || '',
    body.lng || ''
  ]);

  // 清除快取
  scriptCache.remove('broadcasts_0');

  return { success: true, broadcastId };
}

function handleVerifyPhoto(body) {
  if (body.password !== ADMIN_PASSWORD) return { error: '密碼錯誤' };

  const sheet = getSheet('AdventureCompletions');
  const row = body.completionRow;
  sheet.getRange(row, 7).setValue(body.verified ? true : false);
  sheet.getRange(row, 8).setValue(body.adminNotes || '');

  if (body.verified && body.points) {
    const teamId = sheet.getRange(row, 2).getValue();
    const taskId = sheet.getRange(row, 3).getValue();
    addTeamPoints(teamId, 'photo', body.points, '照片驗證: ' + taskId);
  }

  return { success: true };
}

function handleAddManualPoints(body) {
  if (body.password !== ADMIN_PASSWORD) return { error: '密碼錯誤' };
  addTeamPoints(body.teamId, 'manual', body.points, body.detail || '管理員手動加分');
  return { success: true };
}

function addTeamPoints(teamId, source, points, detail) {
  const sheet = getSheet('TeamPoints');
  sheet.appendRow([teamId, source, points, detail, new Date().toISOString()]);

  // 更新 Teams 表的 totalPoints
  updateTeamTotal(teamId);
  scriptCache.remove('teamRankings');
  scriptCache.remove('teams');
}

function updateTeamTotal(teamId) {
  const pointsSheet = getSheet('TeamPoints');
  const data = pointsSheet.getDataRange().getValues();
  let total = 0;
  data.slice(1).forEach(row => {
    if (row[0] === teamId) total += (row[2] || 0);
  });

  const teamsSheet = getSheet('Teams');
  const teamsData = teamsSheet.getDataRange().getValues();
  for (let i = 1; i < teamsData.length; i++) {
    if (teamsData[i][0] === teamId) {
      teamsSheet.getRange(i + 1, 4).setValue(total);
      break;
    }
  }
}

function handleRecalcTeamPoints() {
  // 1. 計算每款遊戲的 Top 3 獎勵
  const scoresSheet = getSheet('GameScores');
  const scoresData = scoresSheet.getDataRange().getValues().slice(1);

  const games = ['snake', 'racing', 'memory', 'rhythm', 'whack', 'puzzle', 'catch', 'quiz', 'runner', 'bubble'];
  const bonusPoints = [300, 200, 100];

  // 清除舊的 game_bonus 紀錄
  const tpSheet = getSheet('TeamPoints');
  const tpData = tpSheet.getDataRange().getValues();
  for (let i = tpData.length - 1; i >= 1; i--) {
    if (tpData[i][1] === 'game_bonus') {
      tpSheet.deleteRow(i + 1);
    }
  }

  // 重新計算 game_bonus
  games.forEach(gameId => {
    const gameScores = scoresData
      .filter(row => row[3] === gameId)
      .sort((a, b) => b[4] - a[4]);

    // 取得每個玩家的最高分
    const bestScores = {};
    gameScores.forEach(row => {
      const pid = row[0];
      if (!bestScores[pid] || row[4] > bestScores[pid].score) {
        bestScores[pid] = { score: row[4], teamId: row[2], playerName: row[1] };
      }
    });

    const sorted = Object.entries(bestScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 3);

    sorted.forEach(([pid, info], idx) => {
      tpSheet.appendRow([
        info.teamId,
        'game_bonus',
        bonusPoints[idx],
        `${gameId} 第${idx + 1}名: ${info.playerName} (${info.score}分)`,
        new Date().toISOString()
      ]);
    });
  });

  // 2. 重算所有隊伍總分
  const teamsSheet = getSheet('Teams');
  const teamsData = teamsSheet.getDataRange().getValues();
  const newTpData = tpSheet.getDataRange().getValues().slice(1);

  for (let i = 1; i < teamsData.length; i++) {
    const teamId = teamsData[i][0];
    let total = 0;
    newTpData.forEach(row => {
      if (row[0] === teamId) total += (row[2] || 0);
    });
    teamsSheet.getRange(i + 1, 4).setValue(total);
  }

  // 清除快取
  scriptCache.remove('teamRankings');
  scriptCache.remove('teams');

  return { success: true, message: '重算完成' };
}

// ============================================================
// 初始化試算表 (執行一次)
// ============================================================
function initSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const sheets = {
    'Teams': ['teamId', 'teamName', 'teamEmoji', 'totalPoints'],
    'Players': ['playerId', 'name', 'teamId', 'registeredAt'],
    'GameScores': ['playerId', 'playerName', 'teamId', 'gameId', 'score', 'timestamp'],
    'GameUnlocks': ['playerId', 'gameId', 'unlockedAt', 'lat', 'lng'],
    'GameLocations': ['gameId', 'gameName', 'lat', 'lng', 'radiusMeters', 'description'],
    'AdventureTasks': ['taskId', 'taskName', 'lat', 'lng', 'radiusMeters', 'dwellSeconds', 'points'],
    'AdventureCompletions': ['playerId', 'teamId', 'taskId', 'completedAt', 'verificationType', 'photoUrl', 'verified', 'adminNotes'],
    'Broadcasts': ['broadcastId', 'type', 'content', 'timestamp', 'lat', 'lng'],
    'TeamPoints': ['teamId', 'source', 'points', 'detail', 'timestamp'],
    'Config': ['key', 'value']
  };

  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  });

  // 預填 60 隊資料
  const teamsSheet = ss.getSheetByName('Teams');
  const teamData = [
    [1,'獅子隊','🦁',0],[2,'長頸鹿隊','🦒',0],[3,'大象隊','🐘',0],[4,'熊貓隊','🐼',0],
    [5,'猴子隊','🐵',0],[6,'斑馬隊','🦓',0],[7,'黑熊隊','🐻',0],[8,'企鵝隊','🐧',0],
    [9,'紅鶴隊','🦩',0],[10,'犀牛隊','🦏',0],[11,'老虎隊','🐯',0],[12,'河馬隊','🦛',0],
    [13,'鱷魚隊','🐊',0],[14,'袋鼠隊','🦘',0],[15,'無尾熊隊','🐨',0],[16,'孔雀隊','🦚',0],
    [17,'獵豹隊','🐆',0],[18,'北極熊隊','🐻‍❄️',0],[19,'狐狸隊','🦊',0],[20,'貓頭鷹隊','🦉',0],
    [21,'海豚隊','🐬',0],[22,'鸚鵡隊','🦜',0],[23,'水獺隊','🦦',0],[24,'浣熊隊','🦝',0],
    [25,'馴鹿隊','🦌',0],[26,'白兔隊','🐰',0],[27,'蜜蜂隊','🐝',0],[28,'蝴蝶隊','🦋',0],
    [29,'獨角獸隊','🦄',0],[30,'鯨魚隊','🐳',0],[31,'海龜隊','🐢',0],[32,'松鼠隊','🐿️',0],
    [33,'刺蝟隊','🦔',0],[34,'柴犬隊','🐕',0],[35,'羊駝隊','🦙',0],[36,'變色龍隊','🦎',0],
    [37,'火烈鳥隊','🦩',0],[38,'海馬隊','🐴',0],[39,'蜂鳥隊','🐦',0],[40,'飛鼠隊','🐿️',0],
    [41,'穿山甲隊','🦔',0],[42,'石虎隊','🐱',0],[43,'黑鳶隊','🦅',0],[44,'梅花鹿隊','🦌',0],
    [45,'藍鵲隊','🐦',0],[46,'白鷺隊','🦢',0],[47,'黑面琵鷺隊','🦢',0],[48,'雲豹隊','🐆',0],
    [49,'龍蝦隊','🦞',0],[50,'海獅隊','🦭',0],[51,'紅毛猩猩隊','🦧',0],[52,'草泥馬隊','🦙',0],
    [53,'雪豹隊','🐆',0],[54,'大嘴鳥隊','🦜',0],[55,'水母隊','🪼',0],[56,'章魚隊','🐙',0],
    [57,'天鵝隊','🦢',0],[58,'鶴隊','🦩',0],[59,'鷹隊','🦅',0],[60,'小龍隊','🐉',0]
  ];
  teamsSheet.getRange(2, 1, teamData.length, 4).setValues(teamData);

  // 預填設定
  const configSheet = ss.getSheetByName('Config');
  configSheet.getRange(2, 1, 5, 2).setValues([
    ['eventStart', '10:00'],
    ['eventEnd', '14:00'],
    ['adminPassword', ADMIN_PASSWORD],
    ['gpsAccuracyThreshold', '50'],
    ['broadcastPollInterval', '15000']
  ]);
}
