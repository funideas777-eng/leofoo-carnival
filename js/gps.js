// ============================================================
// GPS 模組 - 地理圍欄、距離計算、停留計時
// ============================================================

const GPS = {
  watchId: null,
  position: null,
  callbacks: [],
  zones: [],
  dwellTimers: {},
  activeZones: new Set(),

  init() {
    if (!navigator.geolocation) {
      console.warn('Geolocation API 不支援');
      return false;
    }
    this.startWatch();
    return true;
  },

  startWatch() {
    if (this.watchId) return;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onPosition(pos),
      (err) => this.onError(err),
      {
        enableHighAccuracy: CONFIG.GPS.enableHighAccuracy,
        maximumAge: CONFIG.GPS.maximumAge,
        timeout: CONFIG.GPS.timeout
      }
    );
  },

  stopWatch() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  },

  onPosition(pos) {
    this.position = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp
    };
    this.checkZones();
    this.callbacks.forEach(cb => cb(this.position));
  },

  onError(err) {
    console.warn('GPS 錯誤:', err.message);
  },

  onUpdate(callback) {
    this.callbacks.push(callback);
  },

  removeCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  },

  getPosition() {
    return this.position;
  },

  isAccurate() {
    return this.position && this.position.accuracy <= CONFIG.GPS.accuracyThreshold;
  },

  // Haversine 公式計算兩點距離 (公尺)
  distanceBetween(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  distanceTo(lat, lng) {
    if (!this.position) return Infinity;
    return this.distanceBetween(this.position.lat, this.position.lng, lat, lng);
  },

  isNear(lat, lng, radius) {
    return this.distanceTo(lat, lng) <= radius;
  },

  // 地理圍欄管理
  registerZone(id, lat, lng, radius, onEnter, onExit) {
    this.zones.push({ id, lat, lng, radius, onEnter, onExit });
  },

  clearZones() {
    this.zones = [];
    this.activeZones.clear();
    this.dwellTimers = {};
  },

  checkZones() {
    if (!this.position) return;

    this.zones.forEach(zone => {
      const inside = this.isNear(zone.lat, zone.lng, zone.radius);
      const wasInside = this.activeZones.has(zone.id);

      if (inside && !wasInside) {
        this.activeZones.add(zone.id);
        this.dwellTimers[zone.id] = Date.now();
        if (zone.onEnter) zone.onEnter(zone);
      } else if (!inside && wasInside) {
        this.activeZones.delete(zone.id);
        delete this.dwellTimers[zone.id];
        if (zone.onExit) zone.onExit(zone);
      }
    });
  },

  getDwellTime(zoneId) {
    const start = this.dwellTimers[zoneId];
    if (!start) return 0;
    return Math.floor((Date.now() - start) / 1000);
  },

  isInZone(zoneId) {
    return this.activeZones.has(zoneId);
  },

  // 格式化距離顯示
  formatDistance(meters) {
    if (meters < 1000) return Math.round(meters) + 'm';
    return (meters / 1000).toFixed(1) + 'km';
  }
};
