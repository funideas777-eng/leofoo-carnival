// 節奏遊戲 - 雙軌落下音符，點擊左右區域
const GameLogic = {
  canvas: null, ctx: null, fw: null,
  notes: [],
  bpm: 120,
  noteSpeed: 6,
  hitLineY: 0,
  hitZone: 40,
  spawnTimer: null,
  lastSpawn: 0,
  beatInterval: 0,
  leftPressed: false,
  rightPressed: false,

  start(canvas, ctx, fw) {
    this.canvas = canvas; this.ctx = ctx; this.fw = fw;
    this.notes = [];
    this.hitLineY = canvas.height * 0.85;
    this.beatInterval = 60000 / this.bpm;
    this.lastSpawn = 0;

    this.bindControls();
    this.spawnTimer = setInterval(() => this.spawnNote(), this.beatInterval / 2);
    this.loop();
  },

  stop() {
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.unbindControls();
  },

  bindControls() {
    this._ts = (e) => {
      e.preventDefault();
      const x = e.touches[0].clientX;
      const rect = this.canvas.getBoundingClientRect();
      const relX = x - rect.left;
      const mid = rect.width / 2;

      if (relX < mid) this.hitNote('left');
      else this.hitNote('right');
    };
    this.canvas.addEventListener('touchstart', this._ts, { passive: false });
  },

  unbindControls() {
    if (this._ts) this.canvas.removeEventListener('touchstart', this._ts);
  },

  spawnNote() {
    const lane = Math.random() < 0.5 ? 'left' : 'right';
    // 偶爾同時兩邊
    if (Math.random() < 0.15) {
      this.notes.push({ lane: 'left', y: -30, hit: false, missed: false });
      this.notes.push({ lane: 'right', y: -30, hit: false, missed: false });
    } else {
      this.notes.push({ lane, y: -30, hit: false, missed: false });
    }

    // 逐漸加速
    if (this.noteSpeed < 10) this.noteSpeed += 0.02;
  },

  hitNote(side) {
    let closest = null;
    let closestDist = Infinity;

    this.notes.forEach(n => {
      if (n.lane !== side || n.hit || n.missed) return;
      const dist = Math.abs(n.y - this.hitLineY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = n;
      }
    });

    if (!closest || closestDist > this.hitZone * 2) {
      // 空擊
      return;
    }

    closest.hit = true;
    if (closestDist < this.hitZone * 0.3) {
      // Perfect
      this.fw.addScore(100);
      this.fw.addCombo();
      this.showJudgement('PERFECT!', '#FFD166');
    } else if (closestDist < this.hitZone) {
      // Good
      this.fw.addScore(50);
      this.fw.addCombo();
      this.showJudgement('GOOD', '#2EC4B6');
    } else {
      // Miss range but hit
      this.fw.addScore(20);
      this.showJudgement('OK', '#999');
    }
  },

  showJudgement(text, color) {
    this._judgement = { text, color, alpha: 1, y: this.hitLineY - 60 };
  },

  loop() {
    if (this.fw.state !== 'playing') return;
    this.update();
    this.draw();
    this.fw.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    this.notes.forEach(n => {
      if (!n.hit && !n.missed) n.y += this.noteSpeed;
      if (!n.hit && n.y > this.hitLineY + this.hitZone * 2) {
        n.missed = true;
        this.fw.breakCombo();
      }
    });
    this.notes = this.notes.filter(n => n.y < this.canvas.height + 50 && !n.hit);

    if (this._judgement) {
      this._judgement.alpha -= 0.02;
      this._judgement.y -= 1;
      if (this._judgement.alpha <= 0) this._judgement = null;
    }
  },

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const mid = cw / 2;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cw, ch);

    // 左右區域
    ctx.fillStyle = 'rgba(255,107,53,0.08)';
    ctx.fillRect(0, 0, mid, ch);
    ctx.fillStyle = 'rgba(46,196,182,0.08)';
    ctx.fillRect(mid, 0, mid, ch);

    // 中線
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mid, 0); ctx.lineTo(mid, ch); ctx.stroke();

    // 判定線
    ctx.strokeStyle = 'rgba(255,209,102,0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, this.hitLineY); ctx.lineTo(cw, this.hitLineY); ctx.stroke();

    // 判定區域
    ctx.fillStyle = 'rgba(255,209,102,0.1)';
    ctx.fillRect(0, this.hitLineY - this.hitZone, cw, this.hitZone * 2);

    // 音符
    const noteR = 24;
    this.notes.forEach(n => {
      if (n.hit || n.missed) return;
      const x = n.lane === 'left' ? mid / 2 : mid + mid / 2;

      // 漸近判定線時發光
      const dist = Math.abs(n.y - this.hitLineY);
      if (dist < this.hitZone * 2) {
        ctx.shadowColor = n.lane === 'left' ? '#FF6B35' : '#2EC4B6';
        ctx.shadowBlur = 15;
      }

      ctx.fillStyle = n.lane === 'left' ? '#FF6B35' : '#2EC4B6';
      ctx.beginPath();
      ctx.arc(x, n.y, noteR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = `${noteR}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎵', x, n.y);

      ctx.shadowBlur = 0;
    });

    // 左右提示
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👈 LEFT', mid / 2, ch - 40);
    ctx.fillText('RIGHT 👉', mid + mid / 2, ch - 40);

    // 判定文字
    if (this._judgement) {
      ctx.globalAlpha = this._judgement.alpha;
      ctx.fillStyle = this._judgement.color;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this._judgement.text, mid, this._judgement.y);
      ctx.globalAlpha = 1;
    }
  }
};
