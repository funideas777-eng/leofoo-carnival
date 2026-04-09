// 動物障礙跑 - 無盡跑酷，點擊跳躍
const GameLogic = {
  canvas: null, ctx: null, fw: null,
  player: { x: 0, y: 0, vy: 0, jumping: false, groundY: 0, w: 40, h: 50 },
  obstacles: [], stars: [],
  speed: 5, distance: 0, groundY: 0,
  gravity: 0.6, jumpForce: -14,
  spawnTimer: null, starTimer: null,
  groundTiles: [],

  start(canvas, ctx, fw) {
    this.canvas = canvas; this.ctx = ctx; this.fw = fw;
    this.groundY = canvas.height * 0.78;
    this.player = {
      x: canvas.width * 0.2,
      y: this.groundY,
      vy: 0, jumping: false,
      groundY: this.groundY,
      w: 40, h: 50
    };
    this.obstacles = []; this.stars = [];
    this.speed = 5; this.distance = 0;
    this.groundTiles = [];

    this.bindControls();
    this.spawnTimer = setInterval(() => this.spawnObstacle(), 1500);
    this.starTimer = setInterval(() => this.spawnStar(), 2000);
    this.loop();
  },

  stop() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    if (this.starTimer) clearInterval(this.starTimer);
    this.unbindControls();
  },

  bindControls() {
    this._ts = (e) => {
      e.preventDefault();
      this.jump();
    };
    this.canvas.addEventListener('touchstart', this._ts, { passive: false });
  },

  unbindControls() {
    if (this._ts) this.canvas.removeEventListener('touchstart', this._ts);
  },

  jump() {
    if (!this.player.jumping) {
      this.player.vy = this.jumpForce;
      this.player.jumping = true;
      AudioEngine.tapButton();
    }
  },

  spawnObstacle() {
    const types = [
      { emoji: '🪨', w: 40, h: 40 },
      { emoji: '🌵', w: 30, h: 60 },
      { emoji: '🪵', w: 60, h: 30 },
      { emoji: '💧', w: 50, h: 20 },
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    this.obstacles.push({
      x: this.canvas.width + 50,
      y: this.groundY - type.h / 2,
      ...type
    });

    if (this.speed < 12) this.speed += 0.08;
  },

  spawnStar() {
    const h = this.groundY - 60 - Math.random() * 120;
    this.stars.push({
      x: this.canvas.width + 50,
      y: h
    });
  },

  loop() {
    if (this.fw.state !== 'playing') return;
    this.update();
    this.draw();
    this.fw.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    const p = this.player;
    const cw = this.canvas.width;

    // 物理
    p.vy += this.gravity;
    p.y += p.vy;
    if (p.y >= p.groundY) {
      p.y = p.groundY;
      p.vy = 0;
      p.jumping = false;
    }

    // 移動障礙物
    this.obstacles.forEach(o => { o.x -= this.speed * 2; });
    this.stars.forEach(s => { s.x -= this.speed * 2; });

    // 碰撞 - 障礙物
    this.obstacles = this.obstacles.filter(o => {
      if (o.x < -60) return false;
      if (o.x < p.x + p.w && o.x + o.w > p.x &&
          o.y < p.y && o.y + o.h > p.y - p.h) {
        AudioEngine.crash();
        this.fw.endGame();
        return false;
      }
      return true;
    });

    // 碰撞 - 星星
    this.stars = this.stars.filter(s => {
      if (s.x < -30) return false;
      if (Math.abs(s.x - p.x) < 30 && Math.abs(s.y - p.y + p.h / 2) < 30) {
        this.fw.addScore(15);
        this.fw.addCombo();
        AudioEngine.coinCollect();
        return false;
      }
      return true;
    });

    // 距離分
    this.distance += this.speed * 0.02;
    this.fw.score = Math.floor(this.distance) * 10 + this.fw.combo;
    const hudScore = document.getElementById('hudScore');
    if (hudScore) hudScore.textContent = this.fw.score;
  },

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const p = this.player;

    // 天空
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#B3E5FC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // 地面
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, this.groundY, cw, ch - this.groundY);
    ctx.fillStyle = '#689F38';
    ctx.fillRect(0, this.groundY, cw, 6);

    // 背景雲
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 300 + this.distance * 20) % (cw + 200)) - 100;
      const cy = 80 + i * 60;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 障礙物
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    this.obstacles.forEach(o => {
      ctx.fillText(o.emoji, o.x + o.w / 2, o.y + o.h);
    });

    // 星星
    this.stars.forEach(s => {
      ctx.fillText('⭐', s.x, s.y);
    });

    // 玩家動物
    ctx.font = '48px serif';
    ctx.textBaseline = 'bottom';
    const frame = Math.floor(Date.now() / 100) % 2;
    const runEmoji = frame === 0 ? '🏃' : '🦊';
    ctx.fillText(p.jumping ? '🦘' : runEmoji, p.x, p.y);

    // 距離顯示
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(Math.floor(this.distance) + 'm', cw - 16, 16);
  }
};
