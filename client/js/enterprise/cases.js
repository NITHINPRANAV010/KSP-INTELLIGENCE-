/* =========================================================
   CASES.JS — Case Workflow & Investigation Management
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const WORKFLOW_STATES = [
    'New', 'Assigned', 'Evidence Collection', 'Under Investigation',
    'Suspect Identified', 'Charge Sheet', 'Closed', 'Archived'
  ];

  const STORAGE_KEY = 'ksp_cases_extended';

  const KSPCases = {
    _caseStore: {},

    /**
     * Initialize case engine, loading extended details from storage.
     */
    init: function () {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          this._caseStore = JSON.parse(cached);
        } catch (e) {
          this._caseStore = {};
        }
      }
    },

    save: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._caseStore));
    },

    /**
     * Get or create extended case records.
     * @param {string} caseId
     */
    getCaseDetails: function (caseId) {
      if (!this._caseStore[caseId]) {
        // Find base incident
        const base = KSPDatabase.getIncidents().find(i => i.id === caseId);
        if (!base) return null;

        this._caseStore[caseId] = {
          id: caseId,
          caseNumber: base.caseNumber || `KSP-2024-${caseId.replace(/\D/g, '')}`,
          title: `${base.crimeType} at ${base.policeStation}`,
          status: base.status || 'New',
          priority: base.severity || 'medium',
          assignedOfficer: base.assignedOfficer || 'Unassigned',
          description: `AI-classified investigation into category: ${base.crimeType} reported at ${base.policeStation}.`,
          comments: [
            {
              id: 'c1',
              author: 'AI Intel System',
              text: `Case initialized procedurally. Risk category calculated as ${base.severity.toUpperCase()}.`,
              timestamp: base.date + ' ' + base.time
            }
          ],
          attachments: [],
          activityLog: [
            {
              action: 'Case Created',
              user: 'System Generator',
              time: base.date + ' ' + base.time,
              details: 'Incident ingested into central intelligence index.'
            }
          ]
        };
        this.save();
      }
      return this._caseStore[caseId];
    },

    /**
     * Transitions workflow status and logs audit details.
     */
    updateStatus: function (caseId, newStatus) {
      if (!WORKFLOW_STATES.includes(newStatus)) return false;
      const c = this.getCaseDetails(caseId);
      if (!c) return false;

      const oldStatus = c.status;
      c.status = newStatus;

      // Update base KSPDatabase incident status too
      KSPDatabase.updateIncident(caseId, { status: newStatus });

      const actor = window.KSPAuth?.currentUser?.name || 'Officer';
      c.activityLog.unshift({
        action: 'Status Transition',
        user: actor,
        time: new Date().toLocaleString('en-IN'),
        details: `Workflow progressed from [${oldStatus}] to [${newStatus}].`
      });

      this.save();

      // Trigger Audit log
      if (window.KSPAudit) {
        KSPAudit.log('Case Status Updated', `Case ${caseId} status changed from ${oldStatus} to ${newStatus}`, 'Success');
      }

      // Notify Event Bus
      if (window.KSPAIBus) {
        KSPAIBus.emit('case:status_changed', { caseId, oldStatus, newStatus });
      }

      if (window.KSPNotifications) {
        KSPNotifications.create(`Case ${caseId} progressed to ${newStatus}`, 'case', 'medium');
      }

      return true;
    },

    /**
     * Assign / Reassign investigation officers.
     */
    assignOfficer: function (caseId, officerName) {
      const c = this.getCaseDetails(caseId);
      if (!c) return false;

      const prevOfficer = c.assignedOfficer;
      c.assignedOfficer = officerName;

      // Sync to base database
      KSPDatabase.updateIncident(caseId, { assignedOfficer: officerName });

      const actor = window.KSPAuth?.currentUser?.name || 'Officer';
      c.activityLog.unshift({
        action: 'Officer Assigned',
        user: actor,
        time: new Date().toLocaleString('en-IN'),
        details: `Case assignment reassigned from [${prevOfficer}] to [${officerName}].`
      });

      this.save();

      if (window.KSPAudit) {
        KSPAudit.log('Case Reassigned', `Case ${caseId} assigned to ${officerName}`, 'Success');
      }

      if (window.KSPNotifications) {
        KSPNotifications.create(`You have been assigned to case ${caseId}`, 'case', 'high');
      }

      return true;
    },

    /**
     * Post comment to case feed.
     */
    addComment: function (caseId, text) {
      const c = this.getCaseDetails(caseId);
      if (!c) return false;

      const actor = window.KSPAuth?.currentUser?.name || 'Intelligence Analyst';
      const comment = {
        id: `com_${Date.now()}`,
        author: actor,
        text,
        timestamp: new Date().toLocaleString('en-IN')
      };

      c.comments.push(comment);

      c.activityLog.unshift({
        action: 'Comment Added',
        user: actor,
        time: comment.timestamp,
        details: `New briefing note added to feed.`
      });

      this.save();

      if (window.KSPAudit) {
        KSPAudit.log('Case Comment Added', `Briefing comment posted to Case ${caseId}`, 'Success');
      }

      // Emit event for team collaboration
      if (window.KSPAIBus) {
        KSPAIBus.emit('case:comment_added', { caseId, comment });
      }

      return comment;
    },

    /**
     * Link attachment.
     */
    addAttachment: function (caseId, file) {
      const c = this.getCaseDetails(caseId);
      if (!c) return false;

      c.attachments.push(file);

      const actor = window.KSPAuth?.currentUser?.name || 'Officer';
      c.activityLog.unshift({
        action: 'Attachment Uploaded',
        user: actor,
        time: new Date().toLocaleString('en-IN'),
        details: `Linked file: ${file.name} (Type: ${file.type.toUpperCase()}).`
      });

      this.save();
      return true;
    }
  };

  window.KSPCases = KSPCases;
  KSPCases.init();

})();
