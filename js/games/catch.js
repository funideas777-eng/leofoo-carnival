// 接動物 - 左右拖曳籃子接住掉落動物
const GameLogic = {
  canvas: null, ctx: null, fw: null,
  basketX: 0, basketW: 80,
  items: [], spawnTimer: null,
  fallSpeed: 3,
  animals: [
    { emoji: '🐱', points: 10 },
    { emoji: '🐶', points: 10 },
    { emoji: '🐰', points: 15 },
    { emoji: '🦊', points: 15 },
    { emoji: '🐼', points: 20 },
    { emoji: '🦁', points: 25 },
    { emoji: '⭐', points: 50 },
  ],
  bads: [
    { emoji: '💣', points: -20 },
    { emoji: '🪨', points: -10 },
  ],
  dragging: false,

  start(canvas, ctx, fw) {
    this.canvas = canvas; this.ctx = ctx; this.fw = fw;
    this.basketX = canvas.width / 2;
    this.basketW = canvas.width * 0.18;
    this.items = [];
    this.fallSpeed = 3;

    this.bindControls();
    this.spawnTimer = setInterval(() => this.spawnItem(), 600);
    this.loop();
  },

  stop() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.unbindControls();
  },

  bindControls() {
    this._tm = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      this.basketX = (e.touches[0].clientX - rect.left) * scaleX;
    };
    this.canvas.addEventListener('touchmove', this._tm, { passive: false });
    this.canvas.addEventListener('touchstart', this._tm, { passive: false });
  },

  unbindControls() {
    if (this._tm) {
      this.canvas.removeEventListener('touchmove', this._tm);
      this.canvas.removeEventListener('touchstart', this._tm);
    }
  },

  spawnItem() {
    const isBad = Math.random() < 0.2;
    const pool = isBad ? this.bads : this.animals;
    const item = pool[Math.floor(Math.random() * pool.length)];

    this.items.push({
      x: Math.random() * (this.canvas.width - 40) + 20,
      y: -30,
      ...item,
      bad: isBad,
      size: 36
    });

    if (this.fallSpeed < 8) this.fallSpeed += 0.03;
  },

  loop() {
    if (this.fw.state !== 'playing') return;
    this.update();
    this.draw();
    this.fw.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    const ch = this.canvas.height;
    const basketY = ch * 0.88;
    const bw = this.basketW;

    this.items.forEach(item => { item.y += this.fallSpeed; });

    this.items = this.items.filter(item => {
      // 掉出畫面
      if (item.y > ch + 30) {
        if (!item.bad) this.fw.breakCombo();
        return false;
      }

      // 碰到籃子
      if (item.y > basketY - 30 && item.y < basketY + 20 &&
          Math.abs(item.x - this.basketX) < bw) {
        if (item.bad) {
          this.fw.addScore(item.points);
          this.fw.breakCombo();
          AudioEngine.penalty();
        } else {
          this.fw.addScore(item.points);
          this.fw.addCombo();
          AudioEngine.coinCollect();
        }
        return false;
      }
      return true;
    });
  },

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // 背景 - 天空漸層
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#E8F5E9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // 掉落物
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.items.forEach(item => {
      ctx.fillText(item.emoji, item.x, item.y);
    });

    // 籃子
    const basketY = ch * 0.88;
    const bw = this.basketW;
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.moveTo(this.basketX - bw, basketY);
    ctx.lineTo(this.basketX - bw * 0.7, basketY + 40);
    ctx.lineTo(this.basketX + bw * 0.7, basketY + 40);
    ctx.lineTo(this.basketX + bw, basketY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 籃子 emoji
    ctx.font = '28px serif';
    ctx.fillText('🧺', this.basketX, basketY + 20);

    // 草地
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, ch * 0.95, cw, ch * 0.05);
  }
};
