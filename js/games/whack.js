// 打地鼠 - 點擊冒出動物得分
const GameLogic = {
  fw: null,
  container: null,
  holes: [],
  activeHoles: new Set(),
  spawnInterval: null,
  spawnRate: 1000,
  animals: ['🐹', '🐰', '🐻', '🐵', '🐸', '🐷'],
  rareAnimal: '🌟',
  dangerAnimal: '🐼', // 保育類，不能打

  start(canvas, ctx, fw) {
    this.fw = fw;
    canvas.style.display = 'none';
    const parent = canvas.parentElement;

    this.container = document.createElement('div');
    this.container.style.cssText = `
      display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr);
      gap:12px; padding:16px; width:100%; height:100%; align-content:center;
    `;
    parent.appendChild(this.container);

    // 建立 9 個洞
    this.holes = [];
    for (let i = 0; i < 9; i++) {
      const hole = document.createElement('div');
      hole.style.cssText = `
        background: #795548; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; font-size: 48px;
        position: relative; overflow: hidden; cursor: pointer;
        border: 4px solid #5D4037; aspect-ratio: 1;
      `;
      hole.dataset.idx = i;
      hole.innerHTML = '<div style="opacity:0.3;font-size:32px;">🕳️</div>';
      hole.addEventListener('click', () => this.whackHole(i));
      this.container.appendChild(hole);
      this.holes.push(hole);
    }

    this.spawnRate = 1000;
    this.startSpawning();
  },

  stop() {
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    if (this.container) this.container.remove();
  },

  startSpawning() {
    this.spawnAnimal();
    this.spawnInterval = setInterval(() => {
      this.spawnAnimal();
      // 逐漸加速
      if (this.spawnRate > 400) {
        this.spawnRate -= 15;
        clearInterval(this.spawnInterval);
        this.spawnInterval = setInterval(() => this.spawnAnimal(), this.spawnRate);
      }
    }, this.spawnRate);
  },

  spawnAnimal() {
    // 選擇空的洞
    const available = [];
    for (let i = 0; i < 9; i++) {
      if (!this.activeHoles.has(i)) available.push(i);
    }
    if (available.length === 0) return;

    const idx = available[Math.floor(Math.random() * available.length)];
    let emoji, type;

    const rand = Math.random();
    if (rand < 0.05) {
      emoji = this.rareAnimal;
      type = 'rare';
    } else if (rand < 0.15) {
      emoji = this.dangerAnimal;
      type = 'danger';
    } else {
      emoji = this.animals[Math.floor(Math.random() * this.animals.length)];
      type = 'normal';
    }

    this.activeHoles.add(idx);
    const hole = this.holes[idx];
    hole.dataset.type = type;
    hole.innerHTML = `
      <div style="font-size:48px;animation:fadeIn 0.2s ease;${type === 'danger' ? 'border:3px solid red;border-radius:50%;padding:4px;' : ''}">${emoji}</div>
    `;
    if (type === 'rare') {
      hole.style.background = '#FFD700';
    } else if (type === 'danger') {
      hole.style.background = '#FFCDD2';
    } else {
      hole.style.background = '#A1887F';
    }

    AudioEngine.animalPop();

    // 自動消失
    const duration = type === 'rare' ? 1200 : 1800;
    setTimeout(() => {
      if (this.activeHoles.has(idx)) {
        this.activeHoles.delete(idx);
        hole.innerHTML = '<div style="opacity:0.3;font-size:32px;">🕳️</div>';
        hole.style.background = '#795548';
        hole.dataset.type = '';
      }
    }, duration);
  },

  whackHole(idx) {
    if (!this.activeHoles.has(idx)) return;

    const hole = this.holes[idx];
    const type = hole.dataset.type;

    this.activeHoles.delete(idx);

    if (type === 'danger') {
      // 打到保育類 扣分
      this.fw.addScore(-30);
      this.fw.breakCombo();
      AudioEngine.penalty();
      hole.innerHTML = '<div style="font-size:32px;">❌</div>';
      hole.style.background = '#F44336';
    } else if (type === 'rare') {
      // 打到稀有
      this.fw.addScore(50);
      this.fw.addCombo();
      AudioEngine.bonusItem();
      hole.innerHTML = '<div style="font-size:32px;">💫</div>';
      hole.style.background = '#FFD700';
    } else {
      // 普通
      this.fw.addScore(10);
      this.fw.addCombo();
      AudioEngine.whack();
      hole.innerHTML = '<div style="font-size:32px;">💥</div>';
      hole.style.background = '#FF9800';
    }

    setTimeout(() => {
      hole.innerHTML = '<div style="opacity:0.3;font-size:32px;">🕳️</div>';
      hole.style.background = '#795548';
      hole.dataset.type = '';
    }, 300);
  }
};
