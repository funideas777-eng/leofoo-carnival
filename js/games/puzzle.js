// 動物拼圖 - 滑動拼塊 (3x3 → 4x4)
const GameLogic = {
  fw: null, container: null,
  grid: [], size: 3, emptyIdx: 0,
  round: 1, moves: 0,
  animalImages: ['🦁', '🐘', '🦒', '🐼', '🐵', '🦓'],

  start(canvas, ctx, fw) {
    this.fw = fw;
    this.round = 1; this.size = 3;
    canvas.style.display = 'none';
    const parent = canvas.parentElement;

    this.container = document.createElement('div');
    this.container.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;';
    parent.appendChild(this.container);

    this.setupRound();
  },

  stop() { if (this.container) this.container.remove(); },

  setupRound() {
    const n = this.size;
    const total = n * n;
    this.moves = 0;

    // 建立有序序列 (0 = 空格)
    this.grid = Array.from({ length: total }, (_, i) => i);

    // 隨機打亂 (確保可解)
    for (let i = 0; i < 200; i++) {
      const empIdx = this.grid.indexOf(0);
      const neighbors = this.getNeighbors(empIdx, n);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [this.grid[empIdx], this.grid[pick]] = [this.grid[pick], this.grid[empIdx]];
    }
    this.emptyIdx = this.grid.indexOf(0);

    this.render();
  },

  getNeighbors(idx, n) {
    const row = Math.floor(idx / n);
    const col = idx % n;
    const neighbors = [];
    if (row > 0) neighbors.push(idx - n);
    if (row < n - 1) neighbors.push(idx + n);
    if (col > 0) neighbors.push(idx - 1);
    if (col < n - 1) neighbors.push(idx + 1);
    return neighbors;
  },

  render() {
    const n = this.size;
    const animal = this.animalImages[(this.round - 1) % this.animalImages.length];

    this.container.innerHTML = `
      <div style="color:white;font-size:14px;margin-bottom:12px;">
        第 ${this.round} 關 · ${n}x${n} · 移動 ${this.moves} 次
      </div>
      <div id="puzzleGrid" style="
        display:grid; grid-template-columns:repeat(${n},1fr);
        gap:4px; width:min(90vw,360px); aspect-ratio:1;
      "></div>
    `;

    const gridEl = document.getElementById('puzzleGrid');
    this.grid.forEach((val, idx) => {
      const tile = document.createElement('div');
      if (val === 0) {
        tile.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:8px;';
      } else {
        const colors = ['#FF6B35','#2EC4B6','#FFD166','#9C27B0','#4CAF50','#F44336','#3F51B5','#E91E63',
                        '#00BCD4','#795548','#FF9800','#673AB7','#8BC34A','#CDDC39','#FFC107'];
        tile.style.cssText = `
          background:${colors[val % colors.length]}; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-size:${n <= 3 ? '28' : '20'}px; font-weight:bold; color:white;
          cursor:pointer; user-select:none; transition:transform 0.15s;
        `;
        tile.textContent = val <= 4 ? ['🦁','🐘','🦒','🐼'][val-1] || val : val;
        tile.addEventListener('click', () => this.moveTile(idx));
      }
      gridEl.appendChild(tile);
    });
  },

  moveTile(idx) {
    const n = this.size;
    const neighbors = this.getNeighbors(idx, n);
    if (!neighbors.includes(this.emptyIdx)) return;

    // 交換
    [this.grid[idx], this.grid[this.emptyIdx]] = [this.grid[this.emptyIdx], this.grid[idx]];
    this.emptyIdx = idx;
    this.moves++;

    AudioEngine.cardFlip();
    this.render();

    // 檢查是否完成
    if (this.isSolved()) {
      const points = Math.max(10, 100 - this.moves * 2) + this.fw.timeLeft;
      this.fw.addScore(points);
      AudioEngine.bonusItem();

      this.round++;
      if (this.round === 2) this.size = 3;
      else if (this.round >= 3) this.size = 4;

      setTimeout(() => this.setupRound(), 800);
    }
  },

  isSolved() {
    for (let i = 0; i < this.grid.length - 1; i++) {
      if (this.grid[i] !== i + 1) return false;
    }
    return this.grid[this.grid.length - 1] === 0;
  }
};
