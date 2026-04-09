// ============================================================
// API 客戶端 - 快取 + 請求佇列 + 重試 + 多 GAS 負載分散
// ============================================================

const API = {
  cache: {},
  queue: [],
  processing: false,

  // GET 請求 (含快取)
  async get(endpoint, params = {}, cacheTTL = 0) {
    const cacheKey = endpoint + '_' + JSON.stringify(params);

    if (cacheTTL > 0) {
      const cached = this.getCache(cacheKey);
      if (cached !== null) return cached;
    }

    const url = this.buildUrl(this.getBaseUrl(endpoint), params);

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (cacheTTL > 0) {
        this.setCache(cacheKey, data, cacheTTL);
      }
      return data;
    } catch (e) {
      console.error('API GET 失敗:', endpoint, e);
      const fallback = this.getCache(cacheKey);
      if (fallback !== null) return fallback;
      throw e;
    }
  },

  // POST 請求 (含佇列重試)
  async post(target, body) {
    const baseUrl = CONFIG.API[target] || CONFIG.API.WRITE;

    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn('POST 失敗，加入重試佇列:', body.action, e);
      this.addToQueue(target, body);
      throw e;
    }
  },

  // 快取管理
  getCache(key) {
    const entry = this.cache[key];
    if (!entry) {
      const stored = localStorage.getItem('api_cache_' + key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Date.now() < parsed.expires) {
            this.cache[key] = parsed;
            return parsed.data;
          }
          localStorage.removeItem('api_cache_' + key);
        } catch { /* ignore */ }
      }
      return null;
    }
    if (Date.now() > entry.expires) {
      delete this.cache[key];
      return null;
    }
    return entry.data;
  },

  setCache(key, data, ttl) {
    const entry = { data, expires: Date.now() + ttl };
    this.cache[key] = entry;
    try {
      localStorage.setItem('api_cache_' + key, JSON.stringify(entry));
    } catch { /* storage full */ }
  },

  // 請求佇列 (離線重試)
  addToQueue(target, body) {
    this.queue.push({ target, body, attempts: 0 });
    this.saveQueue();
  },

  saveQueue() {
    try {
      localStorage.setItem('api_queue', JSON.stringify(this.queue));
    } catch { /* ignore */ }
  },

  loadQueue() {
    try {
      const raw = localStorage.getItem('api_queue');
      if (raw) this.queue = JSON.parse(raw);
    } catch { /* ignore */ }
  },

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const pending = [...this.queue];
    this.queue = [];

    for (const item of pending) {
      try {
        await this.post(item.target, item.body);
      } catch {
        if (item.attempts < 3) {
          item.attempts++;
          this.queue.push(item);
        }
      }
    }

    this.saveQueue();
    this.processing = false;
  },

  // URL 構建
  getBaseUrl(endpoint) {
    if (endpoint === 'READ' || endpoint === 'getTeamRankings' || endpoint === 'getBroadcasts' ||
        endpoint === 'getGameLocations' || endpoint === 'getGameScores' ||
        endpoint === 'getChat' || endpoint === 'getTeamLocations' || endpoint === 'getPlayerTasks') {
      return CONFIG.API.READ;
    }
    if (endpoint === 'getPendingPhotos' || endpoint === 'getDashboard') {
      return CONFIG.API.ADMIN;
    }
    return CONFIG.API.READ;
  },

  buildUrl(base, params) {
    const url = new URL(base);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  },

  // 初始化
  init() {
    this.loadQueue();
    setInterval(() => this.processQueue(), 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.processQueue();
    });
  }
};
