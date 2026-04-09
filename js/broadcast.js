// ============================================================
// 廣播訊息接收 + 通知系統
// ============================================================

const Broadcast = {
  lastTimestamp: null,
  messages: [],
  pollTimer: null,
  unreadCount: 0,
  onNewMessage: null,
  onUnreadChange: null,

  init() {
    this.lastTimestamp = localStorage.getItem('lastBroadcastTs') || new Date(0).toISOString();
    this.loadHistory();
    this.startPolling();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopPolling();
      } else {
        this.startPolling();
      }
    });
  },

  startPolling() {
    if (this.pollTimer) return;
    this.poll();
    // 廣播通知每 5-8 秒輪詢一次
    this.pollTimer = setInterval(() => this.poll(), 5000 + Math.random() * 3000);
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },

  async poll() {
    try {
      // 不使用客戶端快取，確保廣播即時送達
      const data = await API.get('getBroadcasts', {
        action: 'getBroadcasts',
        since: this.lastTimestamp
      }, 0);

      if (data && data.broadcasts && data.broadcasts.length > 0) {
        data.broadcasts.forEach(msg => this.handleNewMessage(msg));
      }
    } catch (e) {
      // 靜默失敗，下次輪詢重試
    }
  },

  handleNewMessage(msg) {
    if (this.messages.some(m => m.broadcastId === msg.broadcastId)) return;

    this.messages.unshift(msg);
    this.lastTimestamp = msg.timestamp;
    localStorage.setItem('lastBroadcastTs', msg.timestamp);
    this.saveHistory();

    this.unreadCount++;
    if (this.onUnreadChange) this.onUnreadChange(this.unreadCount);

    AudioEngine.broadcastAlert();
    this.showNotification(msg);

    if (this.onNewMessage) this.onNewMessage(msg);
  },

  showNotification(msg) {
    const bar = document.getElementById('notification-bar');
    if (!bar) return;

    const icon = this.getTypeIcon(msg.type);
    let content = '';

    switch (msg.type) {
      case 'text':
        content = msg.content;
        break;
      case 'image':
        content = '📷 收到一張圖片';
        break;
      case 'voice':
        content = '🎤 收到一則語音';
        break;
      case 'location':
        content = `📍 ${msg.content}`;
        break;
    }

    bar.innerHTML = `
      <div class="notification-content" onclick="Broadcast.openMessages()">
        <span class="notification-icon">${icon}</span>
        <span class="notification-text">${content}</span>
        <span class="notification-time">${this.formatTime(msg.timestamp)}</span>
      </div>
    `;
    bar.classList.add('show');

    setTimeout(() => bar.classList.remove('show'), 8000);
  },

  getTypeIcon(type) {
    const icons = { text: '📢', image: '📷', voice: '🎤', location: '📍' };
    return icons[type] || '📢';
  },

  formatTime(ts) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  },

  openMessages() {
    this.unreadCount = 0;
    if (this.onUnreadChange) this.onUnreadChange(0);
    const panel = document.getElementById('message-panel');
    if (panel) {
      panel.innerHTML = `
        <div class="top-bar" style="position:sticky;top:0;z-index:10;">
          <button class="top-bar-back" onclick="Broadcast.closeMessages()">← 返回</button>
          <div class="top-bar-title">📢 活動訊息</div>
          <div style="width:40px;"></div>
        </div>
        <div style="padding:16px;">
          ${this.renderMessages()}
        </div>
      `;
      panel.classList.add('show');
    }
  },

  closeMessages() {
    const panel = document.getElementById('message-panel');
    if (panel) panel.classList.remove('show');
  },

  renderMessages() {
    if (this.messages.length === 0) {
      return '<div class="msg-empty" style="text-align:center;color:#999;padding:60px 20px;">目前沒有訊息<br><span style="font-size:13px;">管理員發送的廣播會顯示在這裡</span></div>';
    }
    return this.messages.map(msg => `
      <div class="msg-item msg-${msg.type}">
        <div class="msg-header">
          <span class="msg-icon">${this.getTypeIcon(msg.type)}</span>
          <span class="msg-time">${this.formatTime(msg.timestamp)}</span>
        </div>
        <div class="msg-body">
          ${msg.type === 'image' ? `<img src="${msg.content}" class="msg-image" alt="廣播圖片">` : ''}
          ${msg.type === 'text' ? `<p>${msg.content}</p>` : ''}
          ${msg.type === 'voice' ? `<audio controls src="${msg.content}"></audio>` : ''}
          ${msg.type === 'location' ? `
            <p>${msg.content}</p>
            <button class="btn btn-sm" onclick="MapEngine.panTo(${msg.lat},${msg.lng})">查看位置</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  },

  loadHistory() {
    try {
      const raw = localStorage.getItem('broadcast_history');
      if (raw) this.messages = JSON.parse(raw).slice(0, 50);
    } catch { /* ignore */ }
  },

  saveHistory() {
    try {
      localStorage.setItem('broadcast_history', JSON.stringify(this.messages.slice(0, 50)));
    } catch { /* ignore */ }
  },

  destroy() {
    this.stopPolling();
  }
};
