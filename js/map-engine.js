// ============================================================
// 地圖引擎 - 渲染互動樂園地圖
// ============================================================

const MapEngine = {
  container: null,
  viewport: null,
  canvas: null,
  mapWidth: 1080,
  mapHeight: 1920,
  scale: 1,
  pins: [],
  playerDot: null,
  playerRange: null,
  unlocked: new Set(),

  init(containerId) {
    this.container = document.getElementById(containerId);
    this.viewport = this.container.querySelector('.map-viewport');
    this.canvas = this.container.querySelector('.map-canvas');

    this.fitMap();
    this.renderPins();
    this.initPlayerDot();
    this.loadUnlocks();

    window.addEventListener('resize', () => this.fitMap());
  },

  fitMap() {
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    this.scale = Math.max(cw / this.mapWidth, ch / this.mapHeight);
    const w = this.mapWidth * this.scale;
    const h = this.mapHeight * this.scale;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  },

  // GPS 座標轉換為地圖像素位置
  gpsToPixel(lat, lng) {
    const bounds = {
      north: 24.8430, south: 24.8350,
      west: 121.2310, east: 121.2400
    };
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * this.mapWidth * this.scale;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * this.mapHeight * this.scale;
    return { x: Math.max(0, Math.min(x, this.mapWidth * this.scale)),
             y: Math.max(0, Math.min(y, this.mapHeight * this.scale)) };
  },

  renderPins() {
    // 清除舊圖釘
    this.canvas.querySelectorAll('.map-pin').forEach(el => el.remove());
    this.pins = [];

    // 遊戲旗幟圖釘
    CONFIG.GAMES.forEach(game => {
      const pos = this.gpsToPixel(game.location.lat, game.location.lng);
      const isUnlocked = this.unlocked.has(game.id);
      const pin = this.createPin(pos, game.icon, game.name, isUnlocked ? 'unlocked' : 'locked', () => {
        this.onGamePinClick(game);
      });
      pin.dataset.gameId = game.id;
      this.pins.push(pin);
    });

    // 冒險設施圖釘
    CONFIG.ADVENTURES.forEach(adv => {
      const pos = this.gpsToPixel(adv.lat, adv.lng);
      const pin = this.createPin(pos, adv.icon, adv.name, 'adventure', () => {
        this.onAdventurePinClick(adv);
      });
      pin.dataset.adventureId = adv.id;
      this.pins.push(pin);
    });
  },

  createPin(pos, icon, label, type, onClick) {
    const pin = document.createElement('div');
    pin.className = 'map-pin map-pin-' + type;
    pin.style.left = pos.x + 'px';
    pin.style.top = pos.y + 'px';

    pin.innerHTML = `
      <div class="map-pin-icon">${icon}</div>
      <div class="map-pin-label">${label}</div>
    `;

    if (type === 'locked') {
      pin.style.opacity = '0.5';
      pin.style.filter = 'grayscale(0.8)';
    }

    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      AudioEngine.tapButton();
      if (onClick) onClick();
    });

    this.canvas.appendChild(pin);
    return pin;
  },

  initPlayerDot() {
    this.playerDot = document.createElement('div');
    this.playerDot.className = 'player-dot';
    this.playerDot.style.display = 'none';
    this.canvas.appendChild(this.playerDot);

    this.playerRange = document.createElement('div');
    this.playerRange.className = 'player-dot-range';
    this.playerRange.style.display = 'none';
    this.canvas.appendChild(this.playerRange);

    GPS.onUpdate((pos) => this.updatePlayerPosition(pos));
  },

  updatePlayerPosition(pos) {
    if (!pos) return;
    const pixel = this.gpsToPixel(pos.lat, pos.lng);

    this.playerDot.style.display = 'block';
    this.playerDot.style.left = pixel.x + 'px';
    this.playerDot.style.top = pixel.y + 'px';

    // 精度範圍圈
    const rangeSize = (pos.accuracy / 0.5) * this.scale; // 粗略換算
    this.playerRange.style.display = 'block';
    this.playerRange.style.left = pixel.x + 'px';
    this.playerRange.style.top = pixel.y + 'px';
    this.playerRange.style.width = rangeSize + 'px';
    this.playerRange.style.height = rangeSize + 'px';

    // 更新各遊戲圖釘的距離
    this.updatePinDistances(pos);
  },

  updatePinDistances(pos) {
    CONFIG.GAMES.forEach(game => {
      const dist = GPS.distanceBetween(pos.lat, pos.lng, game.location.lat, game.location.lng);
      const pin = this.canvas.querySelector(`[data-game-id="${game.id}"]`);
      if (!pin) return;

      let label = pin.querySelector('.map-pin-label');
      const isNear = dist <= game.location.radius;
      const isUnlocked = this.unlocked.has(game.id);

      if (isNear && !isUnlocked) {
        label.textContent = game.name + ' 🔓';
        pin.style.opacity = '1';
        pin.style.filter = 'none';
        pin.classList.add('pulse');
      } else if (isUnlocked) {
        label.textContent = game.name + ' ✅';
      } else {
        label.textContent = game.name + ' ' + GPS.formatDistance(dist);
      }
    });
  },

  onGamePinClick(game) {
    const dist = GPS.distanceTo(game.location.lat, game.location.lng);
    const isUnlocked = this.unlocked.has(game.id);
    const isNear = dist <= game.location.radius;

    let content = '';
    if (isUnlocked) {
      content = `
        <div class="popup-header">${game.icon} ${game.name}</div>
        <p>${game.description}</p>
        <p class="popup-status">✅ 已解鎖</p>
        <button class="btn btn-primary btn-block" onclick="window.location.href='game.html?id=${game.id}'">
          開始遊戲
        </button>
      `;
    } else if (isNear) {
      content = `
        <div class="popup-header">${game.icon} ${game.name}</div>
        <p>${game.description}</p>
        <p class="popup-status pulse" style="color:var(--secondary)">🔓 你在範圍內！可以解鎖</p>
        <button class="btn btn-accent btn-block" onclick="MapEngine.unlockGameAction('${game.id}')">
          解鎖遊戲
        </button>
      `;
    } else {
      content = `
        <div class="popup-header">${game.icon} ${game.name}</div>
        <p>${game.description}</p>
        <p class="popup-status">🔒 距離 ${GPS.formatDistance(dist)}，請靠近旗幟位置</p>
      `;
    }

    this.showPopup(content);
  },

  onAdventurePinClick(adv) {
    const dist = GPS.distanceTo(adv.lat, adv.lng);
    const content = `
      <div class="popup-header">${adv.icon} ${adv.name}</div>
      <p>距離: ${GPS.formatDistance(dist)}</p>
      <p>獎勵: ${adv.points} 分</p>
      ${adv.requirePhoto ? '<p>📸 需要上傳團隊照片</p>' : `<p>⏱️ 需停留 ${adv.dwellSeconds}秒 驗證搭乘</p>`}
      <button class="btn btn-secondary btn-block" onclick="window.location.href='adventure.html?id=${adv.id}'">
        前往任務
      </button>
    `;
    this.showPopup(content);
  },

  async unlockGameAction(gameId) {
    const session = Auth.getSession();
    const pos = GPS.getPosition();
    if (!pos) { alert('GPS 定位中，請稍候'); return; }

    try {
      await API.post('WRITE', {
        action: 'unlockGame',
        playerId: session.playerId,
        gameId: gameId,
        lat: pos.lat,
        lng: pos.lng
      });
    } catch { /* 離線模式 */ }

    this.unlocked.add(gameId);
    localStorage.setItem('gameUnlocks', JSON.stringify([...this.unlocked]));
    AudioEngine.unlockGame();
    this.renderPins();
    this.closePopup();

    // 直接前往遊戲
    window.location.href = 'game.html?id=' + gameId;
  },

  loadUnlocks() {
    try {
      const saved = JSON.parse(localStorage.getItem('gameUnlocks') || '[]');
      this.unlocked = new Set(saved);
    } catch { this.unlocked = new Set(); }
  },

  showPopup(content) {
    let popup = document.getElementById('mapPopup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'mapPopup';
      popup.style.cssText = `
        position:fixed; bottom:0; left:0; right:0;
        background:white; border-radius:24px 24px 0 0;
        padding:24px 20px calc(24px + var(--safe-bottom));
        box-shadow:0 -10px 40px rgba(0,0,0,0.2);
        z-index:200; transition:transform 0.3s ease;
        transform:translateY(100%);
      `;
      document.body.appendChild(popup);
    }
    popup.innerHTML = `
      <button onclick="MapEngine.closePopup()" style="position:absolute;top:12px;right:16px;border:none;background:none;font-size:24px;cursor:pointer;">✕</button>
      ${content}
    `;
    requestAnimationFrame(() => popup.style.transform = 'translateY(0)');
  },

  closePopup() {
    const popup = document.getElementById('mapPopup');
    if (popup) popup.style.transform = 'translateY(100%)';
  },

  panTo(lat, lng) {
    const pixel = this.gpsToPixel(lat, lng);
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    this.viewport.scrollTo({
      left: pixel.x - cw / 2,
      top: pixel.y - ch / 2,
      behavior: 'smooth'
    });
  }
};
