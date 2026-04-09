// 動物知識問答 - 選擇題，答越快分越高
const GameLogic = {
  fw: null, container: null,
  questions: [], currentIdx: 0,
  streak: 0, totalCorrect: 0,
  questionTimer: null, timePerQ: 8, timeLeft: 8,
  answered: false,

  start(canvas, ctx, fw) {
    this.fw = fw;
    this.currentIdx = 0;
    this.streak = 0;
    this.totalCorrect = 0;

    canvas.style.display = 'none';
    const parent = canvas.parentElement;

    this.container = document.createElement('div');
    this.container.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;padding:16px;justify-content:center;';
    parent.appendChild(this.container);

    // 隨機選15題
    this.questions = [...CONFIG.QUIZ_QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);

    this.showQuestion();
  },

  stop() {
    if (this.questionTimer) clearInterval(this.questionTimer);
    if (this.container) this.container.remove();
  },

  showQuestion() {
    if (this.currentIdx >= this.questions.length) {
      this.fw.endGame();
      return;
    }

    const q = this.questions[this.currentIdx];
    this.timeLeft = this.timePerQ;
    this.answered = false;

    this.container.innerHTML = `
      <div style="color:white;text-align:center;margin-bottom:8px;font-size:13px;">
        第 ${this.currentIdx + 1} / ${this.questions.length} 題 · 連對 ${this.streak} 🔥
      </div>
      <div id="qTimer" style="
        height:6px; background:var(--accent); border-radius:3px;
        margin-bottom:16px; transition:width 1s linear;
      "></div>
      <div style="
        background:rgba(255,255,255,0.1); border-radius:16px; padding:24px;
        color:white; font-size:18px; font-weight:600; text-align:center;
        margin-bottom:20px; line-height:1.5;
      ">${q.q}</div>
      <div id="optionsList" style="display:flex;flex-direction:column;gap:10px;">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-idx="${i}" onclick="GameLogic.answer(${i})" style="
            padding:16px; border-radius:12px; border:2px solid rgba(255,255,255,0.2);
            background:rgba(255,255,255,0.08); color:white; font-size:16px;
            cursor:pointer; transition:all 0.2s; text-align:left;
          ">${['A','B','C','D'][i]}. ${opt}</button>
        `).join('')}
      </div>
    `;

    // 倒數計時
    setTimeout(() => {
      const timer = document.getElementById('qTimer');
      if (timer) timer.style.width = '0%';
    }, 50);

    this.questionTimer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 3) AudioEngine.timerTick();
      if (this.timeLeft <= 0) {
        clearInterval(this.questionTimer);
        if (!this.answered) this.answer(-1); // 超時
      }
    }, 1000);
  },

  answer(idx) {
    if (this.answered) return;
    this.answered = true;
    clearInterval(this.questionTimer);

    const q = this.questions[this.currentIdx];
    const correct = idx === q.answer;
    const buttons = this.container.querySelectorAll('.quiz-option');

    // 顯示正確答案
    buttons.forEach((btn, i) => {
      btn.style.pointerEvents = 'none';
      if (i === q.answer) {
        btn.style.background = '#4CAF50';
        btn.style.borderColor = '#4CAF50';
      } else if (i === idx && !correct) {
        btn.style.background = '#F44336';
        btn.style.borderColor = '#F44336';
      }
    });

    if (correct) {
      this.streak++;
      this.totalCorrect++;
      const speedBonus = Math.ceil(this.timeLeft * 5);
      const streakBonus = Math.min(this.streak * 10, 50);
      const points = 20 + speedBonus + streakBonus;
      this.fw.addScore(points);
      this.fw.addCombo();
      AudioEngine.correct();
    } else {
      this.streak = 0;
      this.fw.breakCombo();
      if (idx >= 0) AudioEngine.wrong();
    }

    this.currentIdx++;
    setTimeout(() => this.showQuestion(), 1200);
  }
};
