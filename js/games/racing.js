// 動物賽車 - 躲避障礙收集金幣
const GameLogic = {
  canvas: null, ctx: null, fw: null,
  playerX: 0, lanes: 3, currentLane: 1,
  obstacles: [], coins: [], powerups: [],
  speed: 4, distance: 0, lives: 3,
  roadOffset: 0, invincible: false,
  touchStartX: 0,
  animals: ['🦁', '🐘', '🦒', '🐻', '🦏'],

  start(canvas, ctx, fw) {
    this.canvas = canvas; this.ctx = ctx; this.fw = fw;
    this.currentLane = 1;
    this.obstacles = []; this.coins = []; this.powerups = [];
    this.speed = 4; this.distance = 0; this.lives = 3;
    this.roadOffset = 0; this.invincible = false;

    this.laneWidth = canvas.width / this.lanes;
    this.playerY = canvas.height * 0.8;
    this.playerW = this.laneWidth * 0.6;
    this.playerH = this.playerW * 1.2;

    this.bindControls();
    this.spawnTimer = setInterval(() => this.spawnObjects(), 800);
    this.loop();
  },

  stop() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.unbindControls();
  },

  bindControls() {
    this._ts = (e) => {
      e.preventDefault();
      this.touchStartX = e.touches[0].clientX;
    };
    this._te = (e) => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(dx) > 30) {
        if (dx > 0 && this.currentLane < this.lanes - 1) this.currentLane++;
        else if (dx < 0 && this.currentLane > 0) this.currentLane--;
        AudioEngine.tapButton();
      }
    };
    this.canvas.addEventListener('touchstart', this._ts, { passive: false });
    this.canvas.addEventListener('touchend', this._te);
  },

  unbindControls() {
    if (this._ts) this.canvas.removeEventListener('touchstart', this._ts);
    if (this._te) this.canvas.removeEventListener('touchend', this._te);
  },

  spawnObjects() {
    const lane = Math.floor(Math.random() * this.lanes);
    if (Math.random() < 0.6) {
      this.obstacles.push({
        lane, y: -80,
        emoji: this.animals[Math.floor(Math.random() * this.animals.length)]
      });
    }
    if (Math.random() < 0.4) {
      const coinLane = Math.floor(Math.random() * this.lanes);
      this.coins.push({ lane: coinLane, y: -40 });
    }
    if (Math.random() < 0.08) {
      this.powerups.push({ lane: Math.floor(Math.random() * this.lanes), y: -60 });
    }

    // 加速
    if (this.speed < 12) this.speed += 0.05;
  },

  loop() {
    if (this.fw.state !== 'playing') return;
    this.update();
    this.draw();
    this.fw.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.roadOffset = (this.roadOffset + this.speed * 2) % 40;
    this.distance += this.speed * 0.1;

    const px = this.currentLane * this.laneWidth + this.laneWidth / 2;
    const pw = this.playerW / 2;

    // 移動障礙物
    this.obstacles.forEach(o => { o.y += this.speed * 2; });
    this.coins.forEach(c => { c.y += this.speed * 2; });
    this.powerups.forEach(p => { p.y += this.speed * 2; });

    // 碰撞檢測 - 障礙物
    this.obstacles = this.obstacles.filter(o => {
      if (o.y > ch) return false;
      const ox = o.lane * this.laneWidth + this.laneWidth / 2;
      if (o.y > this.playerY - this.playerH / 2 && o.y < this.playerY + this.playerH / 2 &&
          Math.abs(ox - px) < pw + 20) {
        if (!this.invincible) {
          this.lives--;
          AudioEngine.crash();
          if (this.lives <= 0) this.fw.endGame();
        }
        return false;
      }
      return true;
    });

    // 碰撞檢測 - 金幣
    this.coins = this.coins.filter(c => {
      if (c.y > ch) return false;
      const cx = c.lane * this.laneWidth + this.laneWidth / 2;
      if (c.y > this.playerY - 40 && c.y < this.playerY + 40 &&
          Math.abs(cx - px) < pw + 20) {
        this.fw.addScore(10);
        this.fw.addCombo();
        AudioEngine.coinCollect();
        return false;
      }
      return true;
    });

    // 碰撞檢測 - 道具
    this.powerups = this.powerups.filter(p => {
      if (p.y > ch) return false;
      const ppx = p.lane * this.laneWidth + this.laneWidth / 2;
      if (p.y > this.playerY - 40 && p.y < this.playerY + 40 &&
          Math.abs(ppx - px) < pw + 20) {
        this.invincible = true;
        AudioEngine.bonusItem();
        setTimeout(() => { this.invincible = false; }, 3000);
        return false;
      }
      return true;
    });

    // 距離分數
    this.fw.score = Math.floor(this.distance) + this.fw.score % 1 === 0 ? this.fw.score : this.fw.score;
  },

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const lw = this.laneWidth;

    // 道路背景
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, cw, ch);

    // 車道線
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -this.roadOffset;
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 3;
    for (let i = 1; i < this.lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(i * lw, 0);
      ctx.lineTo(i * lw, ch);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 路邊
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 10, ch);
    ctx.fillRect(cw - 10, 0, 10, ch);

    // 障礙物
    ctx.font = `${lw * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.obstacles.forEach(o => {
      ctx.fillText(o.emoji, o.lane * lw + lw / 2, o.y);
    });

    // 金幣
    this.coins.forEach(c => {
      ctx.fillText('🪙', c.lane * lw + lw / 2, c.y);
    });

    // 道具
    this.powerups.forEach(p => {
      ctx.fillText('⭐', p.lane * lw + lw / 2, p.y);
    });

    // 玩家車
    const px = this.currentLane * lw + lw / 2;
    if (this.invincible) {
      ctx.shadowColor = '#FFD166';
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = this.invincible ? '#FFD166' : '#2196F3';
    ctx.beginPath();
    ctx.roundRect(px - this.playerW / 2, this.playerY - this.playerH / 2, this.playerW, this.playerH, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 車的emoji
    ctx.font = `${lw * 0.4}px serif`;
    ctx.fillText('🏎️', px, this.playerY);

    // 愛心
    ctx.font = '20px serif';
    for (let i = 0; i < this.lives; i++) {
      ctx.fillText('❤️', 30 + i * 28, ch - 30);
    }
  }
};
