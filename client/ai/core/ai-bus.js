/* =========================================================
   AI-BUS.JS — Cross-Module Event Bus
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  /**
   * Lightweight publish/subscribe event bus.
   * All KSP AI modules communicate through this bus to stay decoupled.
   *
   * Events emitted by each module:
   *  config:change           — KSPAIConfig setting changed
   *  config:reset            — KSPAIConfig reset to defaults
   *  prediction:ready        — CrimePredictor finished computation
   *  hotspot:ready           — HotspotEngine clusters computed
   *  hotspot:emerging        — New emerging hotspot detected
   *  anomaly:detected        — AnomalyDetector found an anomaly
   *  network:discovered      — NetworkIntelligence found new edge
   *  offender:profiled       — OffenderProfiler computed a profile
   *  report:ready            — ReportGenerator finished a report
   *  decision:updated        — DecisionSupport refreshed recommendations
   *  demo:incident           — DemoOrchestrator injected a new incident
   *  demo:ai_event           — DemoOrchestrator injected an AI event
   *  chat:response           — EnhancedChat produced a response
   */

  const _listeners = {};

  const KSPAIBus = {
    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} callback
     */
    on: function (event, callback) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(callback);
      return this;
    },

    /**
     * Unsubscribe from an event.
     * @param {string} event
     * @param {Function} callback
     */
    off: function (event, callback) {
      if (!_listeners[event]) return this;
      _listeners[event] = _listeners[event].filter(cb => cb !== callback);
      return this;
    },

    /**
     * Subscribe to an event once (auto-unsubscribes after first trigger).
     * @param {string} event
     * @param {Function} callback
     */
    once: function (event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
      return this;
    },

    /**
     * Emit an event with optional payload data.
     * @param {string} event
     * @param {*} data
     */
    emit: function (event, data) {
      if (!_listeners[event]) return this;
      _listeners[event].forEach(cb => {
        try { cb(data); } catch (e) {
          console.warn(`[KSPAIBus] Error in listener for "${event}":`, e);
        }
      });
      return this;
    },

    /**
     * Remove all listeners for an event, or all events if no event specified.
     * @param {string} [event]
     */
    clear: function (event) {
      if (event) delete _listeners[event];
      else Object.keys(_listeners).forEach(k => delete _listeners[k]);
      return this;
    },

    /** List all currently registered event names */
    events: function () {
      return Object.keys(_listeners);
    }
  };

  window.KSPAIBus = KSPAIBus;

})();
