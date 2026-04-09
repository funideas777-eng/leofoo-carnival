// ============================================================
// 聊天系統 - 團隊聊天 + 世界聊天 + 彈幕
// ============================================================

const Chat = {
  channel: 'team', // 'team' or 'world'
  messages: { team: [], world: [] },
  lastTimestamp: { team: null, world: null },
  pollTimer: null,
  isOpen: false,
  danmakuQueue: [],
  danmakuActive: false,

  init() {
    this.startPolling();
  },

  startPolling() {
    const poll = () => {
      if (document.hidden) return;
      this.fetchMessages('team');
      this.fetchMessages('world');
    };
    poll();
    // 聊天每 3-5 秒輪詢
    const interval = 3000 + Math.random() * 2000;
    this.pollTimer = setInterval(poll, interval);
  },

  async fetchMessages(channel) {
    const session = Auth.getSession();
    if (!session) return;
    try {
      const params = {
        action: 'getChat',
        channel: channel,
        teamId: session.teamId,
        since: this.lastTimestamp[channel] || ''
      };
      // 不使用客戶端快取，確保即時性
      const data = await API.get('getChat_' + channel, params, 0);
      if (data && data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
          const exists = this.messages[channel].some(m => m.msgId === msg.msgId);
          if (!exists) {
            this.messages[channel].push(msg);
            // 世界頻道新訊息 → 推入彈幕佇列
            if (channel === 'world') {
              this.danmakuQueue.push(msg);
            }
          }
        });
        // 只保留最近 200 筆
        if (this.messages[channel].length > 200) {
          this.messages[channel] = this.messages[channel].slice(-200);
        }
        const last = data.messages[data.messages.length - 1];
        this.lastTimestamp[channel] = last.timestamp;

        if (this.isOpen && this.channel === channel) this.renderMessages();
      }
    } catch { /* ignore */ }
  },

  async send(content) {
    if (!content.trim()) return;
    const session = Auth.getSession();
    const team = CONFIG.TEAMS.find(t => t.id === session.teamId);

    try {
      await API.post('WRITE', {
        action: 'sendChat',
        channel: this.channel,
        teamId: session.teamId,
        playerId: session.playerId,
        playerName: session.name,
        teamName: team ? team.name : '',
        teamEmoji: team ? team.emoji : '',
        content: content.trim().substring(0, 200)
      });
      // 立即本地顯示
      const localMsg = {
        msgId: Date.now(),
        channel: this.channel,
        teamId: session.teamId,
        playerId: session.playerId,
        playerName: session.name,
        teamName: team ? team.name : '',
        teamEmoji: team ? team.emoji : '',
        content: content.trim(),
        timestamp: new Date().toISOString()
      };
      this.messages[this.channel].push(localMsg);
      if (this.channel === 'world') this.danmakuQueue.push(localMsg);
      if (this.isOpen) this.renderMessages();
    } catch { /* queue retry */ }
  },

  open() {
    this.isOpen = true;
    const panel = document.getElementById('chat-panel');
    if (panel) {
      panel.classList.add('open');
      this.renderMessages();
    }
  },

  close() {
    this.isOpen = false;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.remove('open');
  },

  switchChannel(ch) {
    this.channel = ch;
    document.querySelectorAll('.chat-ch-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-channel="${ch}"]`);
    if (btn) btn.classList.add('active');
    this.renderMessages();
  },

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const session = Auth.getSession();
    const msgs = this.messages[this.channel];

    container.innerHTML = msgs.map(m => {
      const isMe = m.playerId === session.playerId;
      return `<div class="chat-msg ${isMe ? 'chat-msg-me' : ''}">
        <div class="chat-msg-head">${m.teamEmoji} ${m.playerName}${this.channel === 'world' ? ' · ' + m.teamName : ''}</div>
        <div class="chat-msg-body">${this.escapeHtml(m.content)}</div>
      </div>`;
    }).join('') || '<div style="text-align:center;color:#999;padding:40px">還沒有訊息</div>';

    container.scrollTop = container.scrollHeight;
  },

  escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  // === 彈幕系統 ===
  initDanmaku(containerId) {
    this.danmakuContainer = document.getElementById(containerId);
    if (!this.danmakuContainer) return;
    this.danmakuActive = true;
    this.processDanmaku();
  },

  stopDanmaku() {
    this.danmakuActive = false;
  },

  processDanmaku() {
    if (!this.danmakuActive) return;

    if (this.danmakuQueue.length > 0) {
      const msg = this.danmakuQueue.shift();
      this.spawnDanmaku(msg);
    }

    setTimeout(() => this.processDanmaku(), 2000 + Math.random() * 1500);
  },

  spawnDanmaku(msg) {
    if (!this.danmakuContainer) return;
    const el = document.createElement('div');
    el.className = 'danmaku-item';
    el.textContent = `${msg.teamEmoji} ${msg.playerName}: ${msg.content}`;
    // 隨機高度
    const top = 10 + Math.random() * 60;
    el.style.top = top + '%';
    this.danmakuContainer.appendChild(el);

    // 動畫結束移除
    el.addEventListener('animationend', () => el.remove());
  }
};
