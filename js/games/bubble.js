// 動物泡泡 - 泡泡射擊消除
const GameLogic = {
  canvas: null, ctx: null, fw: null,
  bubbles: [], shooter: { angle: Math.PI / 2, color: 0 },
  projectile: null,
  colors: ['#FF6B35', '#2EC4B6', '#FFD166', '#9C27B0', '#4CAF50', '#F44336'],
  emojis: ['🦁', '🐘', '🦒', '🐼', '🐵', '🦓'],
  bubbleR: 0, cols: 8, rows: 10,
  nextColor: 0,

  start(canvas, ctx, fw) {
    this.canvas = canvas; this.ctx = ctx; this.fw = fw;
    this.bubbleR = Math.floor(canvas.width / (this.cols * 2));
    this.bubbles = [];
    this.projectile = null;
    this.shooter.angle = Math.PI / 2;

    // 初始泡泡 (前5行)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < this.cols; col++) {
        const offset = row % 2 === 1 ? this.bubbleR : 0;
        const maxCol = row % 2 === 1 ? this.cols - 1 : this.cols;
        if (col >= maxCol) continue;

        this.bubbles.push({
          row, col,
          x: col * this.bubbleR * 2 + this.bubbleR + offset,
          y: row * this.bubbleR * 1.8 + this.bubbleR + 40,
          colorIdx: Math.floor(Math.random() * 4),
          alive: true
        });
      }
    }

    this.nextColor = Math.floor(Math.random() * 4);
    this.bindControls();
    this.loop();
  },

  stop() { this.unbindControls(); },

  bindControls() {
    this._ts = (e) => {
      e.preventDefault();
      if (this.projectile) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const tx = (e.touches[0].clientX - rect.left) * scaleX;
      const ty = (e.touches[0].clientY - rect.top) * scaleY;

      const shooterX = this.canvas.width / 2;
      const shooterY = this.canvas.height - 80;
      const angle = Math.atan2(shooterY - ty, tx - shooterX);
      const clampedAngle = Math.max(0.2, Math.min(Math.PI - 0.2, Math.PI - angle));

      this.shoot(clampedAngle);
    };
    this.canvas.addEventListener('touchstart', this._ts, { passive: false });
  },

  unbindControls() {
    if (this._ts) this.canvas.removeEventListener('touchstart', this._ts);
  },

  shoot(angle) {
    const shooterX = this.canvas.width / 2;
    const shooterY = this.canvas.height - 80;
    const speed = 12;

    this.projectile = {
      x: shooterX,
      y: shooterY,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      colorIdx: this.nextColor
    };
    this.nextColor = Math.floor(Math.random() * 4);
    AudioEngine.tapButton();
  },

  loop() {
    if (this.fw.state !== 'playing') return;
    this.update();
    this.draw();
    this.fw.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    if (!this.projectile) return;

    const p = this.projectile;
    p.x += p.vx;
    p.y += p.vy;

    // 牆壁反彈
    if (p.x < this.bubbleR || p.x > this.canvas.width - this.bubbleR) {
      p.vx = -p.vx;
    }

    // 到頂部或碰到泡泡
    let snapped = false;
    if (p.y < this.bubbleR + 40) {
      snapped = true;
    } else {
      for (const b of this.bubbles) {
        if (!b.alive) continue;
        const dist = Math.sqrt((p.x - b.x) ** 2 + (p.y - b.y) ** 2);
        if (dist < this.bubbleR * 1.8) {
          snapped = true;
          break;
        }
      }
    }

    if (snapped) {
      // 放置新泡泡
      const newBubble = this.snapToGrid(p.x, p.y, p.colorIdx);
      this.bubbles.push(newBubble);

      // 檢查三連消
      const matches = this.findMatches(newBubble);
      if (matches.length >= 3) {
        matches.forEach(b => { b.alive = false; });
        const points = matches.length * 10;
        this.fw.addScore(points);
        this.fw.addCombo();
        AudioEngine.cardMatch();

        // 連鎖掉落
        const floating = this.findFloating();
        if (floating.length > 0) {
          floating.forEach(b => { b.alive = false; });
          this.fw.addScore(floating.length * 15);
          AudioEngine.bonusItem();
        }
      }

      this.bubbles = this.bubbles.filter(b => b.alive);
      this.projectile = null;

      // 檢查是否到底
      const maxY = Math.max(...this.bubbles.map(b => b.y), 0);
      if (maxY > this.canvas.height - 150) {
        this.fw.endGame();
      }
    }
  },

  snapToGrid(x, y, colorIdx) {
    const r = this.bubbleR;
    const row = Math.max(0, Math.round((y - r - 40) / (r * 1.8)));
    const offset = row % 2 === 1 ? r : 0;
    const col = Math.max(0, Math.min(this.cols - 1, Math.round((x - r - offset) / (r * 2))));

    return {
      row, col,
      x: col * r * 2 + r + offset,
      y: row * r * 1.8 + r + 40,
      colorIdx,
      alive: true
    };
  },

  findMatches(bubble) {
    const visited = new Set();
    const matches = [];
    const queue = [bubble];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.row},${current.col}`;
      if (visited.has(key)) continue;
      visited.add(key);
      matches.push(current);

      this.bubbles.filter(b =>
        b.alive && b.colorIdx === bubble.colorIdx &&
        Math.sqrt((b.x - current.x) ** 2 + (b.y - current.y) ** 2) < this.bubbleR * 2.5 &&
        !visited.has(`${b.row},${b.col}`)
      ).forEach(b => queue.push(b));
    }

    return matches;
  },

  findFloating() {
    // BFS from top row
    const connected = new Set();
    const queue = this.bubbles.filter(b => b.alive && b.row === 0);
    queue.forEach(b => connected.add(`${b.row},${b.col}`));

    while (queue.length > 0) {
      const current = queue.shift();
      this.bubbles.filter(b =>
        b.alive && !connected.has(`${b.row},${b.col}`) &&
        Math.sqrt((b.x - current.x) ** 2 + (b.y - current.y) ** 2) < this.bubbleR * 2.5
      ).forEach(b => {
        connected.add(`${b.row},${b.col}`);
        queue.push(b);
      });
    }

    return this.bubbles.filter(b => b.alive && !connected.has(`${b.row},${b.col}`));
  },

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const r = this.bubbleR;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cw, ch);

    // 泡泡
    this.bubbles.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = this.colors[b.colorIdx];
      ctx.beginPath();
      ctx.arc(b.x, b.y, r - 2, 0, Math.PI * 2);
      ctx.fill();

      // 動物 emoji
      ctx.font = `${r}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emojis[b.colorIdx], b.x, b.y);
    });

    // 射手位置
    const sx = cw / 2;
    const sy = ch - 80;

    // 下一顆預覽
    ctx.fillStyle = this.colors[this.nextColor];
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${r}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emojis[this.nextColor], sx, sy);

    // 射出中的泡泡
    if (this.projectile) {
      const p = this.projectile;
      ctx.fillStyle = this.colors[p.colorIdx];
      ctx.beginPath();
      ctx.arc(p.x, p.y, r - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(this.emojis[p.colorIdx], p.x, p.y);
    }

    // 底部提示
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '14px sans-serif';
    ctx.fillText('點擊畫面發射泡泡', sx, ch - 20);
  }
};
