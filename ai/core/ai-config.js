/* =========================================================
   AI-CONFIG.JS — Global AI Settings & Thresholds
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_ai_config_v1';

  const DEFAULTS = {
    // Prediction confidence threshold (0.0–1.0)
    confidenceThreshold: 0.65,
    // How many hours ahead to predict (24/72/168/720)
    predictionWindow: 72,
    // Risk sensitivity: 'low' | 'medium' | 'high'
    riskSensitivity: 'medium',
    // Alert sensitivity: 'low' | 'medium' | 'high'
    alertSensitivity: 'medium',
    // Demo simulation speed multiplier
    simulationSpeed: 1,
    // Auto-generate alerts on anomaly detection
    autoAlerts: true,
    // Include XAI factor breakdown in all outputs
    explainability: true,
    // Anomaly spike threshold (standard deviations above baseline)
    anomalySigmaThreshold: 2.0,
    // Minimum cluster size for hotspot detection
    hotspotMinCluster: 5,
    // Emerging hotspot growth threshold (%)
    emergingHotspotGrowthPct: 30,
    // Network relationship minimum confidence
    networkMinConfidence: 0.5,
    // Reoffending probability decay rate (days)
    recidivismDecayDays: 90,
    // Max recommendations to show
    maxRecommendations: 6,
    // Report sections to include
    reportSections: ['executive', 'district', 'trend', 'prediction', 'hotspot', 'offender', 'recommendations'],
  };

  const KSPAIConfig = {
    _settings: {},

    /** Load settings from localStorage, falling back to defaults */
    load: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this._settings = Object.assign({}, DEFAULTS, JSON.parse(stored));
        } else {
          this._settings = Object.assign({}, DEFAULTS);
        }
      } catch (e) {
        this._settings = Object.assign({}, DEFAULTS);
      }
      return this;
    },

    /** Get a config value */
    get: function (key) {
      return this._settings.hasOwnProperty(key) ? this._settings[key] : DEFAULTS[key];
    },

    /** Set a config value and persist */
    set: function (key, value) {
      this._settings[key] = value;
      this._persist();
      if (window.KSPAIBus) {
        KSPAIBus.emit('config:change', { key, value, all: this._settings });
      }
      return this;
    },

    /** Bulk update settings */
    update: function (partialSettings) {
      Object.assign(this._settings, partialSettings);
      this._persist();
      if (window.KSPAIBus) {
        KSPAIBus.emit('config:change', { all: this._settings });
      }
      return this;
    },

    /** Reset to defaults */
    reset: function () {
      this._settings = Object.assign({}, DEFAULTS);
      this._persist();
      if (window.KSPAIBus) {
        KSPAIBus.emit('config:reset', { all: this._settings });
      }
      return this;
    },

    /** Get all settings */
    getAll: function () {
      return Object.assign({}, this._settings);
    },

    /** Get sensitivity multiplier (low=0.7, medium=1.0, high=1.4) */
    getSensitivityMultiplier: function (type) {
      const val = this.get(type === 'alert' ? 'alertSensitivity' : 'riskSensitivity');
      return val === 'low' ? 0.7 : val === 'high' ? 1.4 : 1.0;
    },

    _persist: function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
      } catch (e) { /* quota exceeded — in-memory only */ }
    }
  };

  KSPAIConfig.load();
  window.KSPAIConfig = KSPAIConfig;

})();
