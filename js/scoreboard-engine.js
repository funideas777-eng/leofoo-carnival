// ============================================================
// 排行榜引擎 - 團隊排名 + 個人遊戲排行
// ============================================================

const ScoreboardEngine = {
  pollTimer: null,
  currentTab: 'team',
  currentGame: 'snake',
  rankings: [],
  maxPoints: 0,

  init() {
    this.startPolling();
    this.fetchTeamRankings();
  },

  startPolling() {
    const interval = CONFIG.POLL.scoreboardBase + Math.random() * CONFIG.POLL.scoreboardJitter;
    this.pollTimer = setInterval(() => {
      if (!document.hidden) {
        if (this.currentTab === 'team') this.fetchTeamRankings();
        else this.fetchGameScores(this.currentGame);
      }
    }, interval);
  },

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  },

  async fetchTeamRankings() {
    try {
      const data = await API.get('getTeamRankings', { action: 'getTeamRankings' }, CONFIG.CACHE_TTL.teamRankings);
      if (data && data.rankings) {
        this.rankings = data.rankings;
        this.maxPoints = Math.max(...data.rankings.map(r => r.totalPoints), 1);
        this.renderTeamRankings(data.rankings);
      }
    } catch (e) {
      console.warn('排行榜載入失敗', e);
    }
  },

  renderTeamRankings(rankings) {
    const container = document.getElementById('rankingList');
    if (!container) return;

    const session = Auth.getSession();
    const myTeamId = session ? session.teamId : -1;

    container.innerHTML = rankings.map((team, idx) => {
      const rank = idx + 1;
      const rankClass = rank <= 3 ? ` top${rank}` : '';
      const isMyTeam = team.teamId === myTeamId;
      const barWidth = this.maxPoints > 0 ? (team.totalPoints / this.maxPoints * 100) : 0;
      const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

      return `
        <div class="rank-item${isMyTeam ? ' my-team' : ''}" style="animation-delay:${idx * 0.03}s">
          <div class="rank-number${rankClass}">${trophy || rank}</div>
          <div class="rank-emoji">${team.teamEmoji}</div>
          <div style="flex:1">
            <div class="rank-name">${team.teamName}${isMyTeam ? ' ⭐' : ''}</div>
            <div class="rank-bar" style="width:${barWidth}%"></div>
          </div>
          <div class="rank-score">${team.totalPoints}</div>
        </div>
      `;
    }).join('');
  },

  async fetchGameScores(gameId) {
    try {
      const data = await API.get('getGameScores', { action: 'getGameScores', gameId, limit: 20 }, CONFIG.CACHE_TTL.gameScores);
      if (data && data.scores) {
        this.renderGameScores(data.scores, gameId);
      }
    } catch (e) {
      console.warn('遊戲排行載入失敗', e);
    }
  },

  renderGameScores(scores, gameId) {
    const container = document.getElementById('rankingList');
    if (!container) return;

    const game = getGameById(gameId);
    const session = Auth.getSession();
    const myId = session ? session.playerId : '';

    if (scores.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light)">目前沒有紀錄</div>';
      return;
    }

    container.innerHTML = scores.map((s, idx) => {
      const rank = idx + 1;
      const rankClass = rank <= 3 ? ` top${rank}` : '';
      const isMe = s.playerId === myId;
      const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
      const bonus = rank <= 3 ? `<span style="font-size:11px;color:var(--secondary)">+${[300,200,100][rank-1]}隊分</span>` : '';

      return `
        <div class="rank-item${isMe ? ' my-team' : ''}">
          <div class="rank-number${rankClass}">${trophy || rank}</div>
          <div class="rank-emoji">${game.icon}</div>
          <div style="flex:1">
            <div class="rank-name">${s.playerName}${isMe ? ' (我)' : ''}</div>
            ${bonus}
          </div>
          <div class="rank-score">${s.score}</div>
        </div>
      `;
    }).join('');
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.score-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    const gameSelector = document.getElementById('gameSelector');
    if (gameSelector) gameSelector.style.display = tab === 'game' ? 'block' : 'none';

    if (tab === 'team') this.fetchTeamRankings();
    else this.fetchGameScores(this.currentGame);

    AudioEngine.tapButton();
  },

  selectGame(gameId) {
    this.currentGame = gameId;
    this.fetchGameScores(gameId);
    AudioEngine.tapButton();
  }
};
