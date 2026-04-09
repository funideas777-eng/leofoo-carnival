// 記憶翻牌 - DOM 翻牌配對
const GameLogic = {
  fw: null,
  cards: [],
  flipped: [],
  matched: new Set(),
  lockBoard: false,
  round: 1,
  gridCols: 4,
  gridRows: 4,
  container: null,
  animals: ['🦁', '🐘', '🦒', '🐼', '🐵', '🦓', '🐻', '🐧', '🦩', '🦏', '🐯', '🦛', '🐊', '🦘', '🐨', '🦚'],
  flips: 0,

  start(canvas, ctx, fw) {
    this.fw = fw;
    this.round = 1;
    this.flips = 0;
    // 用 DOM 取代 canvas
    canvas.style.display = 'none';
    const parent = canvas.parentElement;

    this.container = document.createElement('div');
    this.container.id = 'memoryGrid';
    this.container.style.cssText = 'display:grid;gap:8px;padding:8px;width:100%;height:100%;align-content:center;';
    parent.appendChild(this.container);

    this.setupRound();
  },

  stop() {
    if (this.container) this.container.remove();
  },

  setupRound() {
    this.matched.clear();
    this.flipped = [];
    this.lockBoard = false;

    const pairs = (this.gridCols * this.gridRows) / 2;
    const selected = this.animals.slice(0, pairs);
    this.cards = [...selected, ...selected];

    // 洗牌
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }

    this.container.style.gridTemplateColumns = `repeat(${this.gridCols}, 1fr)`;
    this.container.style.gridTemplateRows = `repeat(${this.gridRows}, 1fr)`;
    this.container.innerHTML = '';

    this.cards.forEach((emoji, idx) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #2EC4B6; border-radius: 12px; display: flex;
        align-items: center; justify-content: center; font-size: 32px;
        cursor: pointer; transition: transform 0.3s, background 0.3s;
        transform-style: preserve-3d; user-select: none; min-height: 50px;
      `;
      card.textContent = '❓';
      card.dataset.idx = idx;
      card.addEventListener('click', () => this.flipCard(idx, card));
      this.container.appendChild(card);
    });
  },

  flipCard(idx, card) {
    if (this.lockBoard || this.matched.has(idx) || this.flipped.includes(idx)) return;

    this.flips++;
    this.flipped.push(idx);
    card.textContent = this.cards[idx];
    card.style.background = '#FFF8F0';
    card.style.transform = 'scale(1.05)';
    AudioEngine.cardFlip();

    if (this.flipped.length === 2) {
      this.lockBoard = true;
      const [a, b] = this.flipped;

      if (this.cards[a] === this.cards[b]) {
        // 配對成功
        this.matched.add(a);
        this.matched.add(b);
        AudioEngine.cardMatch();
        this.fw.addScore(20 + Math.max(0, 10 - this.flips) * 2);
        this.fw.addCombo();
        this.flipped = [];
        this.lockBoard = false;

        // 標記已配對
        const cards = this.container.children;
        cards[a].style.background = '#C8E6C9';
        cards[b].style.background = '#C8E6C9';
        cards[a].style.transform = 'scale(1)';
        cards[b].style.transform = 'scale(1)';

        // 全部配對完成
        if (this.matched.size === this.cards.length) {
          const timeBonus = this.fw.timeLeft * 2;
          this.fw.addScore(timeBonus);
          AudioEngine.bonusItem();

          // 下一輪 (增加難度)
          this.round++;
          if (this.round === 2) { this.gridCols = 4; this.gridRows = 5; }
          else if (this.round >= 3) { this.gridCols = 5; this.gridRows = 4; }

          setTimeout(() => this.setupRound(), 1000);
        }
      } else {
        // 配對失敗
        AudioEngine.cardMismatch();
        this.fw.breakCombo();
        setTimeout(() => {
          const cards = this.container.children;
          cards[a].textContent = '❓';
          cards[a].style.background = '#2EC4B6';
          cards[a].style.transform = 'scale(1)';
          cards[b].textContent = '❓';
          cards[b].style.background = '#2EC4B6';
          cards[b].style.transform = 'scale(1)';
          this.flipped = [];
          this.lockBoard = false;
        }, 600);
      }
    }
  }
};
