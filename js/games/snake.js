// 貪食蛇 - 滑動控制，吃動物食物得分
const GameLogic = {
  snake: [],
  food: null,
  direction: 'right',
  nextDirection: 'right',
  gridSize: 20,
  cols: 0,
  rows: 0,
  speed: 150,
  moveTimer: null,
  canvas: null,
  ctx: null,
  fw: null,
  touchStart: null,
  foods: ['🐟', '🍌', '🎋', '🍖', '🥕', '🍎'],
  currentFoodEmoji: '🐟',
  goldenActive: false,
  goldenFood: null,
  goldenTimer: null,

  start(canvas, ctx, fw) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.fw = fw;
    this.cols = Math.floor(canvas.width / this.gridSize);
    this.rows = Math.floor(canvas.height / this.gridSize);
    this.direction = 'right';
    this.nextDirection = 'right';
    this.speed = 150;
    this.goldenActive = false;

    // 初始蛇身
    const midY = Math.floor(this.rows / 2);
    this.snake = [
      { x: 5, y: midY }, { x: 4, y: midY }, { x: 3, y: midY }
    ];

    this.spawnFood();
    this.bindControls();
    this.moveTimer = setInterval(() => this.move(), this.speed);
    this.draw();

    // 每20秒出現金色食物
    this.goldenTimer = setInterval(() => this.spawnGolden(), 20000);
  },

  stop() {
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.goldenTimer) clearInterval(this.goldenTimer);
    this.unbindControls();
  },

  bindControls() {
    this._touchStart = (e) => {
      e.preventDefault();
      this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    this._touchEnd = (e) => {
      if (!this.touchStart) return;
      const dx = e.changedTouches[0].clientX - this.touchStart.x;
      const dy = e.changedTouches[0].clientY - this.touchStart.y;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.nextDirection = dx > 0 ? 'right' : 'left';
      } else {
        this.nextDirection = dy > 0 ? 'down' : 'up';
      }
    };
    this.canvas.addEventListener('touchstart', this._touchStart, { passive: false });
    this.canvas.addEventListener('touchend', this._touchEnd);
  },

  unbindControls() {
    if (this._touchStart) this.canvas.removeEventListener('touchstart', this._touchStart);
    if (this._touchEnd) this.canvas.removeEventListener('touchend', this._touchEnd);
  },

  spawnFood() {
    let x, y;
    do {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
    } while (this.snake.some(s => s.x === x && s.y === y));
    this.food = { x, y };
    this.currentFoodEmoji = this.foods[Math.floor(Math.random() * this.foods.length)];
  },

  spawnGolden() {
    if (this.goldenActive) return;
    let x, y;
    do {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
    } while (this.snake.some(s => s.x === x && s.y === y));
    this.goldenFood = { x, y };
    this.goldenActive = true;
    setTimeout(() => { this.goldenActive = false; this.goldenFood = null; }, 5000);
  },

  move() {
    // 防止180度回頭
    const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (this.nextDirection !== opp[this.direction]) {
      this.direction = this.nextDirection;
    }

    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // 碰牆或碰自己 = 死亡
    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows ||
        this.snake.some(s => s.x === head.x && s.y === head.y)) {
      AudioEngine.snakeDie();
      this.fw.endGame();
      return;
    }

    this.snake.unshift(head);

    // 吃食物
    if (head.x === this.food.x && head.y === this.food.y) {
      const points = 10 * Math.ceil(this.snake.length / 5);
      this.fw.addScore(points);
      this.fw.addCombo();
      AudioEngine.snakeEat();
      this.spawnFood();

      // 每吃5個加速
      if (this.snake.length % 5 === 0 && this.speed > 60) {
        clearInterval(this.moveTimer);
        this.speed -= 10;
        this.moveTimer = setInterval(() => this.move(), this.speed);
      }
    } else if (this.goldenActive && this.goldenFood &&
               head.x === this.goldenFood.x && head.y === this.goldenFood.y) {
      this.fw.addScore(50);
      AudioEngine.bonusItem();
      this.goldenActive = false;
      this.goldenFood = null;
    } else {
      this.snake.pop();
    }

    this.draw();
  },

  draw() {
    const ctx = this.ctx;
    const g = this.gridSize;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 格線
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.cols; x++) {
      ctx.beginPath(); ctx.moveTo(x * g, 0); ctx.lineTo(x * g, this.canvas.height); ctx.stroke();
    }
    for (let y = 0; y < this.rows; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * g); ctx.lineTo(this.canvas.width, y * g); ctx.stroke();
    }

    // 蛇身
    this.snake.forEach((seg, i) => {
      const alpha = 1 - (i / this.snake.length) * 0.6;
      if (i === 0) {
        ctx.fillStyle = '#4CAF50';
      } else {
        ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
      }
      ctx.fillRect(seg.x * g + 1, seg.y * g + 1, g - 2, g - 2);
      if (i === 0) {
        // 蛇頭眼睛
        ctx.fillStyle = 'white';
        ctx.fillRect(seg.x * g + g * 0.6, seg.y * g + g * 0.2, 4, 4);
        ctx.fillRect(seg.x * g + g * 0.6, seg.y * g + g * 0.6, 4, 4);
      }
    });

    // 食物
    ctx.font = `${g - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.currentFoodEmoji, this.food.x * g + g / 2, this.food.y * g + g / 2);

    // 金色食物
    if (this.goldenActive && this.goldenFood) {
      ctx.font = `${g + 4}px serif`;
      ctx.fillText('⭐', this.goldenFood.x * g + g / 2, this.goldenFood.y * g + g / 2);
    }
  }
};
