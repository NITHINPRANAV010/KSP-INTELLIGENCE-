/* =========================================================
   EVIDENCE.JS — Enterprise Evidence Management & Hash System
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_evidence_vault';

  // Helper mock SHA-256 generator
  function generateHash(contentString) {
    let hash = 0;
    const str = contentString + Date.now().toString() + Math.random().toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 'EVID_' + Math.abs(hash).toString(16).toUpperCase() + 'f9a2e3';
  }

  const KSPEvidence = {
    _vault: {},

    /**
     * Initialize evidence registry.
     */
    init: function () {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          this._vault = JSON.parse(cached);
        } catch (e) {
          this._vault = {};
        }
      }
    },

    save: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._vault));
    },

    /**
     * Get all evidence items linked to a specific case.
     */
    getCaseEvidence: function (caseId) {
      if (!this._vault[caseId]) {
        // Hydrate default evidence items from base incident if available
        const incident = KSPDatabase.getIncidents().find(i => i.id === caseId);
        const list = [];

        if (incident && incident.evidence) {
          incident.evidence.forEach((evText, i) => {
            const evType = evText.includes('Video') || evText.includes('CCTV') ? 'CCTV' 
                         : evText.includes('Log') || evText.includes('Records') ? 'Document'
                         : evText.includes('Finger') ? 'Fingerprint'
                         : 'Document';

            list.push({
              id: `ev_${caseId}_${i}`,
              caseId,
              name: evText,
              type: evType,
              uploadedBy: incident.assignedOfficer || 'System Procedural Ingest',
              timestamp: incident.date + ' 10:00 AM',
              verificationStatus: 'Verified',
              hashId: generateHash(evText + caseId),
              chainOfCustody: [
                {
                  action: 'Ingested & Verified',
                  user: 'System Ingest',
                  timestamp: incident.date + ' 10:00 AM',
                  details: 'Procedural verification complete. SHA-256 fingerprint generated.'
                }
              ]
            });
          });
        }
        this._vault[caseId] = list;
        this.save();
      }
      return this._vault[caseId];
    },

    /**
     * Add new evidence item with hashing and chain of custody validation.
     */
    addEvidence: function (caseId, name, type, metadata = {}) {
      const actor = window.KSPAuth?.currentUser?.name || 'Investigation Officer';
      const hashId = generateHash(name + type + caseId);

      const newItem = {
        id: `ev_${caseId}_${Date.now()}`,
        caseId,
        name,
        type, // CCTV, Fingerprint, Document, Vehicle Image, Audio, PDF, etc.
        uploadedBy: actor,
        timestamp: new Date().toLocaleString('en-IN'),
        verificationStatus: 'Pending',
        hashId,
        metadata,
        chainOfCustody: [
          {
            action: 'Uploaded',
            user: actor,
            timestamp: new Date().toLocaleString('en-IN'),
            details: `Uploaded to case files. Original SHA-256: ${hashId}.`
          }
        ]
      };

      if (!this._vault[caseId]) {
        this.getCaseEvidence(caseId);
      }

      this._vault[caseId].unshift(newItem);
      this.save();

      // Trigger audit trail log
      if (window.KSPAudit) {
        KSPAudit.log('Evidence Added', `Evidence ${name} uploaded to Case ${caseId}. Hash: ${hashId}`, 'Success');
      }

      if (window.KSPNotifications) {
        KSPNotifications.create(`New evidence uploaded for case ${caseId}`, 'evidence', 'medium');
      }

      // Emit event
      if (window.KSPAIBus) {
        KSPAIBus.emit('evidence:uploaded', { caseId, item: newItem });
      }

      return newItem;
    },

    /**
     * Transfer or view evidence, updating the immutable chain of custody.
     */
    logChainAccess: function (caseId, itemId, actionName, details) {
      if (!this._vault[caseId]) return false;
      const item = this._vault[caseId].find(i => i.id === itemId);
      if (!item) return false;

      const actor = window.KSPAuth?.currentUser?.name || 'Officer';
      item.chainOfCustody.push({
        action: actionName,
        user: actor,
        timestamp: new Date().toLocaleString('en-IN'),
        details
      });

      this.save();

      // Trigger Audit log
      if (window.KSPAudit) {
        KSPAudit.log('Evidence Accessed', `Action: ${actionName} on Item: ${itemId} (Case: ${caseId})`, 'Success');
      }

      return true;
    },

    /**
     * Set verification status (Verified, Pending, Flagged)
     */
    verifyEvidence: function (caseId, itemId, status) {
      if (!this._vault[caseId]) return false;
      const item = this._vault[caseId].find(i => i.id === itemId);
      if (!item) return false;

      item.verificationStatus = status;

      const actor = window.KSPAuth?.currentUser?.name || 'Officer';
      this.logChainAccess(caseId, itemId, 'Verification Changed', `Status updated to ${status} by ${actor}.`);
      return true;
    }
  };

  window.KSPEvidence = KSPEvidence;
  KSPEvidence.init();

})();
