// ============================================================
// 登入 / Session 管理
// ============================================================

const Auth = {
  STORAGE_KEY: 'leofoo_session',

  generateId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  },

  async register(name, teamId) {
    const playerId = this.generateId();
    const session = {
      playerId,
      name: name.trim(),
      teamId: parseInt(teamId),
      teamName: getTeamById(parseInt(teamId)).name,
      teamEmoji: getTeamById(parseInt(teamId)).emoji,
      registeredAt: new Date().toISOString()
    };

    try {
      await API.post('WRITE', {
        action: 'register',
        playerId: session.playerId,
        name: session.name,
        teamId: session.teamId
      });
    } catch (e) {
      console.warn('註冊 API 失敗，使用本地模式', e);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  getSession() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return this.getSession() !== null;
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
};
