// ============================================================
// 拍照模組 - 拍攝、縮圖、邊框疊加、上傳
// ============================================================

const PhotoModule = {
  currentPhoto: null,
  currentFrame: null,
  canvas: null,
  ctx: null,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) this.ctx = this.canvas.getContext('2d');
  },

  // 觸發拍照
  capturePhoto() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) { resolve(null); return; }
        this.loadImage(file).then(img => {
          this.currentPhoto = img;
          AudioEngine.shutter();
          resolve(img);
        });
      };
      input.click();
    });
  },

  // 從檔案選擇
  selectPhoto() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) { resolve(null); return; }
        this.loadImage(file).then(img => {
          this.currentPhoto = img;
          resolve(img);
        });
      };
      input.click();
    });
  },

  loadImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  // 繪製照片 + 邊框到 canvas
  renderPreview(frameUrl) {
    if (!this.currentPhoto || !this.canvas) return;

    const size = CONFIG.PHOTO.maxWidth;
    this.canvas.width = size;
    this.canvas.height = size;

    // 繪製照片 (裁切為正方形)
    const img = this.currentPhoto;
    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;

    this.ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

    // 繪製邊框
    if (frameUrl) {
      this.currentFrame = frameUrl;
      const frame = new Image();
      frame.crossOrigin = 'anonymous';
      frame.onload = () => {
        this.ctx.drawImage(frame, 0, 0, size, size);
      };
      frame.src = frameUrl;
    }
  },

  // 產生可上傳的 base64
  getBase64() {
    if (!this.canvas) return null;
    const dataUrl = this.canvas.toDataURL('image/jpeg', CONFIG.PHOTO.jpegQuality);
    return dataUrl.split(',')[1]; // 去掉 data:image/jpeg;base64, 前綴
  },

  // 上傳照片
  async upload(taskId) {
    const session = Auth.getSession();
    if (!session) return { error: '未登入' };

    const base64 = this.getBase64();
    if (!base64) return { error: '沒有照片' };

    try {
      const result = await API.post('PHOTO', {
        action: 'uploadPhoto',
        playerId: session.playerId,
        teamId: session.teamId,
        taskId: taskId,
        photoBase64: base64
      });
      AudioEngine.uploadSuccess();
      return result;
    } catch (e) {
      AudioEngine.error();
      return { error: '上傳失敗: ' + e.message };
    }
  },

  // 使用 CSS 繪製的邊框 (不依賴圖片檔)
  drawDefaultFrame(teamName, teamEmoji) {
    if (!this.ctx || !this.canvas) return;
    const size = this.canvas.width;
    const ctx = this.ctx;

    // 邊框
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, size - 12, size - 12);

    // 內框裝飾
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, size - 32, size - 32);

    // 底部標題區
    const barH = 80;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, size - barH, size, barH);

    // 活動名稱
    ctx.fillStyle = '#FFD166';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎪 六福村動物嘉年華', size / 2, size - barH + 30);

    // 隊伍名稱
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText(`${teamEmoji} ${teamName}`, size / 2, size - barH + 58);

    // 四角動物裝飾
    ctx.font = '28px serif';
    ctx.fillText('🦁', 30, 44);
    ctx.fillText('🐘', size - 30, 44);
    ctx.fillText('🦒', 30, size - barH - 16);
    ctx.fillText('🐼', size - 30, size - barH - 16);
  }
};
