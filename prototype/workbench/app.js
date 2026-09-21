/* ==========================================================================
   app.js — PDRIFT-UX0.2 Current-State Product Calibration Prototype.
   Vanilla JavaScript renderer for the fixture snapshots in fixtures.js.

   IMPORTANT
   ---------
   * This is prototype-only UI state. Nothing is persisted and no Domain truth
     is created or changed.
   * The real AdaptiveDiscoveryStrategyEngine and D4-A projection are implemented
     in the repository. This static prototype does not execute Domain/Application
     code; Scenario switching still selects pre-authored R1-aligned snapshots.
   * The prototype performs zero network activity and never touches real
     industrial equipment.
   ========================================================================== */

(function () {
  "use strict";

  var FX = window.WORKBENCH_FIXTURES;

  /* Prototype-only UI state (disposable, in-memory). */
  var state = {
    mode: "workbench",     // "project-hub" | "workbench"
    stage: "overview",
    scenarioId: "A",
    deviceId: "plc-01",
    expanded: {},          // method -> true when its detail body is open
    fixtureResolved: {},   // investigation field -> true (prototype visual only)
    decisions: {},         // candidate id -> "accepted" | "rejected" | "needs-more"
    selectedCandidateId: "CAND-001",
    deliveryPreviewed: false,
    currentProject: null,  // prototype-only current project (in-memory)
    recentProjects: [],    // prototype-only recent projects (in-memory)
    projectSettings: {},   // prototype-only project metadata edits
    temporaryDevices: {},  // prototype-only extra devices (in-memory)
    temporaryRequirements: [], // prototype-only extra requirements (in-memory)
    temporaryEvidence: [],     // prototype-only extra evidence cards (in-memory)
    requirementEdits: {},  // prototype-only requirement edits (in-memory)
    rejectedKnowledge: {}, // prototype-only knowledge rejections (in-memory)
    knowledgeApplicability: null,
    selectedRequirementId: "req-1"
  };

  var tmpSeq = 0;

  state.recentProjects = FX.RECENT_PROJECTS.map(function (p) {
    return { id: p.id, name: p.name, site: p.site, description: p.description, targets: p.targets.slice(), areas: p.areas.slice(), lines: p.lines.slice() };
  });
  state.currentProject = state.recentProjects[0];

  /* Fixture prerequisites text per method (presentation copy only). */
  var METHOD_PREREQUISITES = {
    "Engineering File": "Engineering source / project file; address table.",
    "Existing System / HMI": "Existing system access.",
    "Passive Capture": "Passive observation point (non-invasive).",
    "Controlled Active Read": "Active Read authorization; Ethernet path.",
    "Manual / Human Supplement": "Field access / engineer availability."
  };

  /* ---------------------------------------------------------------- helpers */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function $(id) { return document.getElementById(id); }

  function scenario() {
    for (var i = 0; i < FX.SCENARIOS.length; i++) {
      if (FX.SCENARIOS[i].id === state.scenarioId) return FX.SCENARIOS[i];
    }
    return FX.SCENARIOS[0];
  }

  function device() {
    if (state.temporaryDevices[state.deviceId]) return state.temporaryDevices[state.deviceId];
    var devs = projectDevices();
    if (devs[state.deviceId]) return devs[state.deviceId];
    var first = Object.keys(devs)[0];
    return first ? devs[first] : null;
  }

  function calibrationCase() {
    return FX.CALIBRATION_CASES && FX.CALIBRATION_CASES[state.deviceId]
      ? FX.CALIBRATION_CASES[state.deviceId]
      : null;
  }

  function findRequirement(id) {
    var all = FX.REQUIREMENTS.concat(state.temporaryRequirements);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function firstRequirement() {
    var all = FX.REQUIREMENTS.concat(state.temporaryRequirements);
    return all[0] || null;
  }

  function selectedRequirement() {
    var r = findRequirement(state.selectedRequirementId);
    if (!r) {
      var first = firstRequirement();
      state.selectedRequirementId = first ? first.id : null;
      r = first;
    }
    return r;
  }

  function chipClass(value) {
    var v = String(value || "").toLowerCase();
    if (["available", "present", "ready", "done", "accepted"].indexOf(v) >= 0) return "chip chip-available";
    if (["conditional", "conditionally available", "partiallyready", "partially ready", "preview", "preview / unresolved"].indexOf(v) >= 0) return "chip chip-conditional";
    if (["blocked", "absent", "rejected"].indexOf(v) >= 0) return "chip chip-blocked";
    if (["unknown", "unassigned", "unresolved"].indexOf(v) >= 0) return "chip chip-unknown";
    if (["future", "not implemented", "not frozen"].indexOf(v) >= 0) return "chip chip-future";
    return "chip chip-unknown";
  }

  function chip(value) {
    return '<span class="' + chipClass(value) + '">' + esc(value) + "</span>";
  }

  function primaryChip(value) {
    return '<span class="chip chip-primary">' + esc(value) + "</span>";
  }

  function fixtureChip() {
    return '<span class="chip chip-fixture">Fixture</span>';
  }

  /* Presentation-only tag formatting. This is UI formatting only — no delivery
     logic is implemented. */
  function deliveryTagFor(d, meaning) {
    var line = String(d && d.line ? d.line : "").replace(/[^A-Za-z0-9]/g, "");
    var dev = String(d && d.label ? d.label : "").replace(/[^A-Za-z0-9]/g, "");
    var m = String(meaning || "").replace(/[^A-Za-z0-9]/g, "");
    return line + "_" + dev + "_" + m;
  }

  /* Clear disposable UI state that is context-local to the current Device /
     Scenario. Prototype-only; no persistence or per-device history. */
  function resetContextLocalState() {
    state.expanded = {};
    state.fixtureResolved = {};
    state.decisions = {};
    state.selectedCandidateId = "CAND-001";
    state.deliveryPreviewed = false;
  }

  /* Clear prototype-only project-local workspace state. Switching projects or
     creating a new project resets unsaved workspace state so it never leaks
     across projects. */
  function resetProjectLocalState() {
    resetContextLocalState();
    state.temporaryDevices = {};
    state.temporaryRequirements = [];
    state.temporaryEvidence = [];
    state.requirementEdits = {};
    state.rejectedKnowledge = {};
    state.knowledgeApplicability = null;
    state.selectedRequirementId = "req-1";
    state.deviceId = defaultDeviceId();
  }

  /* ------------------------------------------------------- project shell */
  function currentProjectName() {
    return state.currentProject ? state.currentProject.name : FX.DEFAULT_PROJECT.name;
  }

  function currentProjectMeta() {
    return state.currentProject || FX.DEFAULT_PROJECT;
  }

  function projectWorkspace() {
    var id = state.currentProject ? state.currentProject.id : FX.DEFAULT_PROJECT.id;
    return FX.PROJECT_WORKSPACES[id] || { tree: [], devices: {} };
  }

  function projectDevices() {
    var ws = projectWorkspace();
    return (ws && ws.devices) ? ws.devices : {};
  }

  function defaultDeviceId() {
    var keys = Object.keys(projectDevices());
    return keys.length ? keys[0] : null;
  }

  function findProject(id) {
    for (var i = 0; i < state.recentProjects.length; i++) {
      if (state.recentProjects[i].id === id) return state.recentProjects[i];
    }
    return null;
  }

  function actionStatusChip(status) {
    var s = String(status || "").toUpperCase();
    var cls = "action-status action-status-prototype";
    if (s.indexOf("FUTURE") >= 0) cls = "action-status action-status-future";
    else if (s.indexOf("FOUNDATION") >= 0) cls = "action-status action-status-foundation";
    else if (s.indexOf("BLOCKED") >= 0) cls = "action-status action-status-blocked";
    return '<span class="' + cls + '">' + esc(status) + "</span>";
  }

  function renderActions(stageId) {
    var actions = FX.STAGE_ACTIONS[stageId] || [];
    if (!actions.length) return "";
    var html = '<div class="panel actions-panel"><h2 class="actions-title">Actions</h2><div class="action-grid">';
    html += actions.map(function (a) {
      return (
        '<button type="button" class="action-btn" data-action="stage-action" data-action-id="' + esc(a.id) + '" title="' + esc(a.hint || "") + '">' +
        "  <span>" + esc(a.label) + "</span>" +
        actionStatusChip(a.status) +
        "</button>"
      );
    }).join("");
    html += "</div></div>";
    return html;
  }

  function futureActionDrawer(actionId, label) {
    var d = FX.FUTURE_ACTION_DETAILS[actionId] || {};
    var status = d.status || "FUTURE";
    openDrawer(label,
      '<div class="kv">' +
      '  <span class="k">Repository status</span><span class="v">' + chip(status) + "</span>" +
      '  <span class="k">Slice / boundary</span><span class="v">' + esc(d.slice || "future") + "</span>" +
      '  <span class="k">Product intent</span><span class="v">' + esc(d.what || "Future capability.") + "</span>" +
      '  <span class="k">What exists today</span><span class="v">' + esc(d.exists || "Foundation only.") + "</span>" +
      "</div>" +
      '<div class="divider"></div>' +
      '<p class="small muted">This static prototype did not execute the capability.</p>');
  }

  function renderShell() {
    var hub = $("project-hub");
    var app = $("app");
    if (state.mode === "project-hub") {
      app.hidden = true;
      hub.hidden = false;
      renderProjectHub();
    } else {
      hub.hidden = true;
      app.hidden = false;
    }
  }

  function renderProjectHub() {
    var host = $("project-hub");
    var recent = state.recentProjects.map(function (p) {
      return (
        '<div class="project-card" data-action="open-project" data-project-id="' + esc(p.id) + '" tabindex="0" role="button">' +
        '  <div class="pc-name">' + esc(p.name) + "</div>" +
        '  <div class="pc-meta">' + esc(p.site) + " · " + esc(p.description) + "</div>" +
        '  <div class="pc-meta">Target systems: ' + esc((p.targets || []).join(", ")) + "</div>" +
        "</div>"
      );
    }).join("");

    host.innerHTML =
      '<div class="hub-header">' +
      '  <h1 class="hub-title">Project Hub</h1>' +
      '  <span class="hub-note">Prototype only — in-memory — not persisted. Browser refresh resets everything.</span>' +
      "</div>" +

      '<div class="hub-grid">' +
      '  <div>' +
      '    <h2 class="hub-section-title">Recent Projects</h2>' +
      '    <div class="project-cards">' + recent + "</div>" +
      '    <p class="small muted">Clicking a project opens its prototype workspace. Switching Project resets prototype-only unsaved workspace state. No real file, no database, no storage is read or written.</p>' +
      "  </div>" +

      '  <div>' +
      '    <div class="hub-panel">' +
      '      <h3>Project Shell Actions</h3>' +
      '      <div class="shell-action-row" data-action="new-project" tabindex="0" role="button"><span class="sa-label">New Project</span>' + actionStatusChip("PROTOTYPE ACTION") + "</div>" +
      '      <div class="shell-action-row" data-action="open-project-list" tabindex="0" role="button"><span class="sa-label">Open Project</span>' + actionStatusChip("PROTOTYPE ACTION") + "</div>" +
      '      <div class="shell-action-row" data-action="open-project-settings" tabindex="0" role="button"><span class="sa-label">Project Settings</span>' + actionStatusChip("PROTOTYPE ACTION") + "</div>" +
      '      <div class="shell-action-row" data-action="archive-project" tabindex="0" role="button"><span class="sa-label">Archive / Close Project</span>' + actionStatusChip("PROTOTYPE ACTION") + "</div>" +
      "    </div>" +

      '    <div class="hub-panel">' +
      '      <h3>Save Semantics</h3>' +
      '      <p class="small muted"><strong>Project metadata auto-save</strong> (future R7A) <strong>≠ Engineer Accept DiscoveryPlan ≠ Engineer Confirm Candidate ≠ Issue / Publish DeliveryPackage.</strong> Engineering authority is always an explicit action.</p>' +
      "    </div>" +

      '    <div class="hub-panel">' +
      '      <h3>Close / Archive Semantics</h3>' +
      '      <p class="small muted"><strong>Close Project Workspace ≠ Archive Project ≠ Project lifecycle Close.</strong> Lifecycle Close is audited, explicit, and authoritative in the real product; this prototype only demonstrates the concept.</p>' +
      "    </div>" +
      "  </div>" +
      "</div>" +

      '<div class="stage-actions" style="justify-content:flex-start;margin-top:16px;">' +
      '  <button type="button" class="btn btn-primary" data-action="back-to-workbench">Back to Workbench</button>' +
      "</div>";
  }

  function renderEmptyProjectWorkspace() {
    return (
      '<div class="banner banner-info"><strong>No device fixture loaded for this Project.</strong> ' +
      "This project has no configured devices. Add a device to start (prototype-only, in-memory).</div>" +
      '<div class="panel">' +
      '  <h2 class="panel-title">Empty Project Workspace ' + fixtureChip() + "</h2>" +
      '  <p class="small muted">Project: <strong>' + esc(currentProjectName()) + "</strong>. No RP-01 devices are inherited for a new project.</p>" +
      '  <div class="stage-actions" style="justify-content:flex-start;">' +
      '    <button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="add-device">Add Device</button>' +
      "  </div>" +
      "</div>"
    );
  }

  /* ------------------------------------------------- stage action dispatch */
  function runStageAction(actionId) {
    switch (actionId) {
      case "project-settings": openProjectSettings(); break;
      case "edit-device": openEditDevice(); break;
      case "add-device": openAddDevice(); break;
      case "open-investigations": openInvestigationsSummary(); break;
      case "continue-discovery": state.stage = "strategy"; renderTabs(); renderStage(); break;

      case "add-requirement": openAddRequirement(); break;
      case "edit-requirement": openEditRequirement(); break;
      case "classify-requirement": openClassifyRequirement(); break;
      case "classify-direct": classifyRequirement("Direct"); break;
      case "classify-derived": classifyRequirement("Derived"); break;
      case "classify-contextual": classifyRequirement("Contextual"); break;
      case "classify-unknown": classifyRequirement("Unknown"); break;
      case "assign-to-device": openAssignToDevice(); break;
      case "import-requirement-list": futureActionDrawer("import-requirement-list", "Import Requirement List"); break;

      case "inspect-why": openInspectWhy(); break;
      case "resolve-unknowns": openResolveUnknowns(); break;
      case "re-evaluate-strategy": openReevaluateStrategy(); break;
      case "create-discovery-plan": openCreateDiscoveryPlan(); break;

      case "add-evidence": openAddEvidence(); break;
      case "add-engineer-observation": openAddEngineerObservation(); break;
      case "import-engineering-file": futureActionDrawer("import-engineering-file", "Import Engineering File"); break;
      case "add-hmi-export": futureActionDrawer("add-hmi-export", "Add HMI Export"); break;
      case "review-session-binding": openReviewSessionBinding(); break;
      case "inspect-provenance": openInspectProvenance(); break;

      case "run-identification": futureActionDrawer("run-identification", "Run Identification"); break;
      case "compare-candidates": openCompareCandidates(); break;
      case "view-evidence": openViewEvidence(); break;
      case "request-more-evidence": requestMoreEvidence(); break;
      case "send-to-confirmation": state.stage = "confirmation"; renderTabs(); renderStage(); break;

      case "accept-candidate": state.decisions[state.selectedCandidateId] = "accepted"; renderStage(); break;
      case "reject-candidate": state.decisions[state.selectedCandidateId] = "rejected"; renderStage(); break;
      case "need-more-evidence": state.decisions[state.selectedCandidateId] = "needs-more"; renderStage(); break;

      case "preview-delivery": state.deliveryPreviewed = true; renderStage(); break;
      case "validate-delivery": openValidateDelivery(); break;
      case "create-delivery-package": openCreateDeliveryPackage(); break;
      case "export": futureActionDrawer("export", "Export"); break;

      case "review-knowledge": openReviewKnowledge(); break;
      case "promote-to-knowledge": openPromoteKnowledge(); break;
      case "reject-reuse": rejectReuse(); break;
      case "set-applicability": openSetApplicability(); break;
      case "view-provenance": openViewProvenance(); break;

      case "submit-new-project": submitNewProject(); break;
      case "submit-project-settings": submitProjectSettings(); break;
      case "submit-add-device": submitAddDevice(); break;
      case "submit-edit-device": submitEditDevice(); break;
      case "submit-add-requirement": submitAddRequirement(); break;
      case "submit-edit-requirement": submitEditRequirement(); break;
      case "submit-classify-requirement": submitClassifyRequirement(); break;
      case "submit-assign-requirement": submitAssignRequirement(); break;
      case "submit-add-engineer-observation": submitAddEngineerObservation(); break;
      case "submit-set-applicability": submitSetApplicability(); break;
    }
  }

  /* ------------------------------------------------- project shell drawers */
  function openNewProject() {
    openDrawer("New Project",
      '<div class="banner banner-info"><strong>Prototype only — in-memory — not persisted.</strong> Browser refresh resets everything.</div>' +
      '<div class="kv">' +
      '  <span class="k">Project Name</span><span class="v"><input id="np-name" class="hub-input" value="New Demo Project" /></span>' +
      '  <span class="k">Site</span><span class="v"><input id="np-site" class="hub-input" value="Demo Site (fixture)" /></span>' +
      '  <span class="k">Description</span><span class="v"><input id="np-desc" class="hub-input" value="Temporary prototype project." /></span>' +
      '  <span class="k">Target Systems</span><span class="v"><input id="np-targets" class="hub-input" value="SCADA, OPC, PI, MES" /></span>' +
      '  <span class="k">Notes</span><span class="v"><input id="np-notes" class="hub-input" value="" /></span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-new-project">Create Prototype Project</button>');
  }

  function submitNewProject() {
    var name = ($("np-name") && $("np-name").value) || "New Demo Project";
    var site = ($("np-site") && $("np-site").value) || "Demo Site (fixture)";
    var desc = ($("np-desc") && $("np-desc").value) || "";
    var targets = ($("np-targets") && $("np-targets").value)
      ? $("np-targets").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      : ["SCADA", "OPC", "PI", "MES"];
    var project = {
      id: "proj-" + (++tmpSeq),
      name: name,
      site: site,
      description: desc,
      targets: targets,
      areas: [],
      lines: []
    };
    state.recentProjects.unshift(project);
    state.currentProject = project;
    state.mode = "workbench";
    resetProjectLocalState();
    closeDrawer();
    renderAll();
  }

  function openProjectSettings() {
    var p = currentProjectMeta();
    openDrawer("Project Settings",
      '<div class="banner banner-info"><strong>Prototype only — not persisted.</strong> Apply changes the in-memory prototype state only.</div>' +
      '<div class="kv">' +
      '  <span class="k">Project Name</span><span class="v"><input id="ps-name" class="hub-input" value="' + esc(p.name) + '" /></span>' +
      '  <span class="k">Site</span><span class="v"><input id="ps-site" class="hub-input" value="' + esc(p.site) + '" /></span>' +
      '  <span class="k">Description</span><span class="v"><input id="ps-desc" class="hub-input" value="' + esc(p.description) + '" /></span>' +
      '  <span class="k">Areas / Lines summary</span><span class="v muted">' + esc((p.areas || []).join(", ")) + " / " + esc((p.lines || []).join(", ")) + "</span>" +
      '  <span class="k">Target systems summary</span><span class="v muted">' + esc((p.targets || []).join(", ")) + "</span>" +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-project-settings">Apply Prototype Changes</button>');
  }

  function submitProjectSettings() {
    var p = state.currentProject || FX.DEFAULT_PROJECT;
    p.name = ($("ps-name") && $("ps-name").value) || p.name;
    p.site = ($("ps-site") && $("ps-site").value) || p.site;
    p.description = ($("ps-desc") && $("ps-desc").value) || p.description;
    for (var i = 0; i < state.recentProjects.length; i++) {
      if (state.recentProjects[i].id === p.id) {
        state.recentProjects[i].name = p.name;
        state.recentProjects[i].site = p.site;
        state.recentProjects[i].description = p.description;
      }
    }
    closeDrawer();
    renderAll();
  }

  function openArchiveProject() {
    openDrawer("Archive / Close Project",
      '<div class="banner banner-warn"><strong>Close Project Workspace ≠ Archive Project ≠ Project lifecycle Close.</strong></div>' +
      '<p class="small muted">Project lifecycle Close is audited, explicit, and authoritative in the real product. This prototype can only demonstrate the concept and does not change any Domain lifecycle.</p>' +
      '<div class="stage-actions" style="justify-content:flex-start;">' +
      '  <button type="button" class="btn btn-secondary" data-action="close-drawer">Acknowledge Prototype</button>' +
      "  </div>");
  }

  /* --------------------------------------------------- stage action drawers */
  function openEditDevice() {
    var d = device();
    openDrawer("Edit Device",
      '<div class="banner banner-info"><strong>Prototype only.</strong> Edits the in-memory prototype device identity only.</div>' +
      '<div class="kv">' +
      '  <span class="k">Device Name</span><span class="v"><input id="ed-name" class="hub-input" value="' + esc(d.label) + '" /></span>' +
      '  <span class="k">Controller Label</span><span class="v"><input id="ed-controller" class="hub-input" value="' + esc(d.controller) + '" /></span>' +
      '  <span class="k">Vendor</span><span class="v"><input id="ed-vendor" class="hub-input" value="' + esc(d.vendor) + '" /></span>' +
      '  <span class="k">Protocol</span><span class="v"><input id="ed-protocol" class="hub-input" value="' + esc(d.protocol) + '" /></span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-edit-device">Apply Prototype Changes</button>');
  }

  function submitEditDevice() {
    var d = device();
    var label = ($("ed-name") && $("ed-name").value) || d.label;
    if (!state.temporaryDevices[d.id]) {
      state.temporaryDevices[d.id] = {
        id: d.id, label: d.label, controller: d.controller, vendor: d.vendor,
        protocol: d.protocol, area: d.area, line: d.line,
        deviceState: d.deviceState
      };
    }
    var t = state.temporaryDevices[d.id];
    t.label = label;
    t.controller = ($("ed-controller") && $("ed-controller").value) || t.controller;
    t.vendor = ($("ed-vendor") && $("ed-vendor").value) || t.vendor;
    t.protocol = ($("ed-protocol") && $("ed-protocol").value) || t.protocol;
    closeDrawer();
    renderAll();
  }

  function openAddDevice() {
    var d = device();
    var line = d ? d.line : "(new line — prototype)";
    openDrawer("Add Device",
      '<div class="banner banner-info"><strong>Prototype only — in-memory — not persisted.</strong></div>' +
      '<div class="kv">' +
      '  <span class="k">Device Name</span><span class="v"><input id="ad-name" class="hub-input" value="PLC-04" /></span>' +
      '  <span class="k">Controller Label</span><span class="v"><input id="ad-controller" class="hub-input" value="PLC-04" /></span>' +
      '  <span class="k">Vendor</span><span class="v"><input id="ad-vendor" class="hub-input" value="UNKNOWN" /></span>' +
      '  <span class="k">Protocol</span><span class="v"><input id="ad-protocol" class="hub-input" value="UNKNOWN" /></span>' +
      '  <span class="k">Line</span><span class="v muted">' + esc(line) + "</span>" +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-add-device">Add Prototype Device</button>');
  }

  function submitAddDevice() {
    var name = ($("ad-name") && $("ad-name").value) || "PLC-04";
    var id = "dev-" + name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
    var d = device();
    state.temporaryDevices[id] = {
      id: id,
      label: name,
      controller: ($("ad-controller") && $("ad-controller").value) || name,
      vendor: ($("ad-vendor") && $("ad-vendor").value) || "UNKNOWN",
      protocol: ($("ad-protocol") && $("ad-protocol").value) || "UNKNOWN",
      area: d ? d.area : "Unassigned (prototype)",
      line: d ? d.line : "Unassigned (prototype)",
      deviceState: "Identified — prototype"
    };
    state.deviceId = id;
    closeDrawer();
    renderAll();
  }

  function openInvestigationsSummary() {
    var st = scenario().strategy;
    var rows = st.investigations.map(function (inv) {
      return '<div class="investigation-row"><span class="inv-field">' + esc(inv.field) + "</span>" + chip(inv.status) + "</div>";
    }).join("");
    openDrawer("Open Investigations",
      rows +
      '<p class="small muted">Investigation owners are never auto-assigned. Unknown stays Unknown until a future R2A/R2 evidence path resolves it.</p>');
  }

  function openAddRequirement() {
    openDrawer("Add Requirement",
      '<div class="banner banner-info"><strong>Prototype only.</strong> Adds a temporary in-memory DataRequirement.</div>' +
      '<div class="kv">' +
      '  <span class="k">Meaning</span><span class="v"><input id="ar-meaning" class="hub-input" value="New Requirement" /></span>' +
      '  <span class="k">Type</span><span class="v"><input id="ar-type" class="hub-input" value="Direct candidate" /></span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-add-requirement">Add Prototype Requirement</button>');
  }

  function submitAddRequirement() {
    state.temporaryRequirements.push({
      id: "req-tmp-" + (++tmpSeq),
      meaning: ($("ar-meaning") && $("ar-meaning").value) || "New Requirement",
      requirementType: ($("ar-type") && $("ar-type").value) || "Direct candidate",
      status: "Open",
      note: "Prototype-only requirement (in-memory)."
    });
    closeDrawer();
    renderStage();
  }

  function openEditRequirement() {
    var r = selectedRequirement();
    if (!r) return;
    openDrawer("Edit Requirement",
      '<div class="banner banner-info"><strong>Prototype only.</strong></div>' +
      '<div class="kv">' +
      '  <span class="k">Selected Requirement</span><span class="v">' + esc(r.meaning) + "</span>" +
      '  <span class="k">Meaning</span><span class="v"><input id="er-meaning" class="hub-input" value="' + esc(r.meaning) + '" /></span>' +
      '  <span class="k">Type</span><span class="v"><input id="er-type" class="hub-input" value="' + esc(r.requirementType) + '" /></span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-edit-requirement">Apply Prototype Changes</button>');
  }

  function submitEditRequirement() {
    var r = selectedRequirement();
    if (!r) return;
    var cur = state.requirementEdits[r.id] || {};
    cur.meaning = ($("er-meaning") && $("er-meaning").value) || r.meaning;
    cur.requirementType = ($("er-type") && $("er-type").value) || r.requirementType;
    state.requirementEdits[r.id] = cur;
    closeDrawer();
    renderStage();
  }

  function openClassifyRequirement() {
    var r = selectedRequirement();
    openDrawer("Classify Requirement",
      '<p class="small muted">Prototype visual state only — no universal business taxonomy is frozen.</p>' +
      '<div class="kv"><span class="k">Selected Requirement</span><span class="v">' + esc(r ? r.meaning : "—") + "</span></div>" +
      '<div class="pill-list">' +
      '  <button type="button" class="btn btn-secondary" data-action="stage-action" data-action-id="classify-direct">Direct</button>' +
      '  <button type="button" class="btn btn-secondary" data-action="stage-action" data-action-id="classify-derived">Derived</button>' +
      '  <button type="button" class="btn btn-secondary" data-action="stage-action" data-action-id="classify-contextual">Contextual</button>' +
      '  <button type="button" class="btn btn-secondary" data-action="stage-action" data-action-id="classify-unknown">Unknown</button>' +
      "</div>");
  }

  function classifyRequirement(type) {
    var r = selectedRequirement();
    if (!r) return;
    var cur = state.requirementEdits[r.id] || {};
    cur.requirementType = type;
    state.requirementEdits[r.id] = cur;
    closeDrawer();
    renderStage();
  }

  function openAssignToDevice() {
    var r = selectedRequirement();
    openDrawer("Assign to Device",
      '<p class="small muted">Assigns a requirement to the selected device (prototype-only).</p>' +
      '<div class="kv">' +
      '  <span class="k">Requirement</span><span class="v">' + esc(r ? r.meaning : "—") + "</span>" +
      '  <span class="k">Device</span><span class="v">' + esc(device() ? device().label : "No device") + "</span>" +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-assign-requirement">Assign (prototype)</button>');
  }

  function submitAssignRequirement() {
    var r = selectedRequirement();
    if (!r) return;
    var cur = state.requirementEdits[r.id] || {};
    cur.assigned = device() ? device().label : "No device";
    state.requirementEdits[r.id] = cur;
    closeDrawer();
    renderStage();
  }

  function openInspectWhy() {
    var m = scenario().strategy.primary;
    openDrawer("Inspect Why",
      '<div class="kv">' +
      '  <span class="k">Primary</span><span class="v">' + esc(m.method) + "</span>" +
      '  <span class="k">Why selected</span><span class="v">' + esc(m.why) + "</span>" +
      '  <span class="k">Policy basis</span><span class="v">' + esc(m.policyBasis) + "</span>" +
      '  <span class="k">Switch condition</span><span class="v">' + esc(m.switchCondition) + "</span>" +
      "</div>");
  }

  function openResolveUnknowns() {
    openInvestigationsSummary();
  }

  function openReevaluateStrategy() {
    openDrawer("Re-evaluate Strategy",
      '<div class="banner banner-info"><strong>R1 + D4-A are implemented in the repository.</strong></div>' +
      '<p class="small muted">This static prototype re-displays the current pre-authored Scenario Snapshot; it does not execute production Domain/Application code or re-derive strategy in the browser.</p>' +
      '<button type="button" class="btn btn-secondary" data-action="close-drawer">Re-display Snapshot</button>');
  }

  function openCreateDiscoveryPlan() {
    openDrawer("Create Discovery Plan",
      '<div class="banner banner-info"><strong>FOUNDATION EXISTS / PROTOTYPE PLACEHOLDER.</strong></div>' +
      '<p class="small muted">A formal DiscoveryPlan exists in the Domain foundation (Project + Device bound, versioned, Engineer-accepted). This prototype does not create authoritative Plan revisions.</p>' +
      '<button type="button" class="btn btn-secondary" data-action="close-drawer">Acknowledge Prototype</button>');
  }

  function openAddEvidence() {
    openDrawer("Add Evidence",
      '<p class="small muted">R2A canonical ingestion and bounded source paths exist in the repository. This static prototype only demonstrates placement and does not admit evidence.</p>' +
      '<div class="pill-list">' +
      '  <span class="chip chip-available">Engineering Evidence path</span>' +
      '  <span class="chip chip-available">Existing System / HMI path</span>' +
      '  <span class="chip chip-available">Replay / Passive evidence path</span>' +
      '  <span class="chip chip-available">Engineer Observation (prototype)</span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="add-engineer-observation">Add Engineer Observation</button>');
  }

  function openAddEngineerObservation() {
    openDrawer("Add Engineer Observation",
      '<div class="banner banner-info"><strong>Fixture / Prototype only — not admitted through R2A.</strong></div>' +
      '<div class="kv">' +
      '  <span class="k">Note</span><span class="v"><input id="eo-note" class="hub-input" value="Engineer field observation (prototype)" /></span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-add-engineer-observation">Add Prototype Observation</button>');
  }

  function submitAddEngineerObservation() {
    var d = device();
    state.temporaryEvidence.push({
      id: "EV-TMP-" + (++tmpSeq),
      type: "Engineer Observation",
      provenance: "Prototype — engineer observation (in-memory, not admitted through R2A)",
      observedTime: "now (prototype)",
      planRevision: "prototype-only — no authoritative Plan revision created",
      session: "prototype-only — no DiscoverySession created",
      limitation: "Prototype-only evidence card; R2A ingestion exists in the repository but is not executed by this static prototype.",
      classification: "Fixture"
    });
    closeDrawer();
    state.stage = "evidence";
    renderTabs();
    renderStage();
  }

  function openReviewSessionBinding() {
    var d = device();
    openDrawer("Review Session Binding",
      '<div class="kv">' +
      '  <span class="k">DiscoverySessionPlanBinding</span><span class="v mono">Project + Device + exact Plan revision + Session</span>' +
      '  <span class="k">Project</span><span class="v">' + esc(currentProjectName()) + "</span>" +
      '  <span class="k">Device</span><span class="v">' + esc(d.label) + "</span>" +
      '  <span class="k">exact Plan revision</span><span class="v">implemented authority concept — no runtime revision created by this prototype</span>' +
      '  <span class="k">Session</span><span class="v">implemented authority concept — no runtime Session created by this prototype</span>' +
      "</div>");
  }

  function openInspectProvenance() {
    var ev = FX.EVIDENCE.concat(state.temporaryEvidence)[0];
    if (ev) openEvidenceProvenance(ev);
  }

  function openEvidenceProvenance(ev) {
    var d = device();
    openDrawer("Evidence Provenance",
      '<div class="kv">' +
      '  <span class="k">Evidence type</span><span class="v">' + esc(ev.type) + "</span>" +
      '  <span class="k">Provenance</span><span class="v">' + esc(ev.provenance) + "</span>" +
      '  <span class="k">Observed time</span><span class="v">' + esc(ev.observedTime) + "</span>" +
      '  <span class="k">Project</span><span class="v">' + esc(currentProjectName()) + "</span>" +
      '  <span class="k">Area / Line / Device</span><span class="v">' + esc(d.area) + " / " + esc(d.line) + " / " + esc(d.label) + "</span>" +
      '  <span class="k">Plan revision</span><span class="v">' + esc(ev.planRevision) + "</span>" +
      '  <span class="k">Session</span><span class="v">' + esc(ev.session) + "</span>" +
      '  <span class="k">Limitation</span><span class="v">' + esc(ev.limitation) + "</span>" +
      '  <span class="k">Classification</span><span class="v">' + chip(ev.classification) + "</span>" +
      "</div>");
  }

  function openCompareCandidates() {
    var cs = FX.CANDIDATES;
    var rows = cs.map(function (c) {
      return (
        '<div class="method-card">' +
        '  <div class="method-card-head"><span class="method-name">' + esc(c.label) + "</span>" + chip(c.status) + "</div>" +
        '  <div class="method-card-body"><div class="kv">' +
        '    <span class="k">Address</span><span class="v mono">' + esc(c.address) + "</span>" +
        '    <span class="k">Type</span><span class="v mono">' + esc(c.dataType) + "</span>" +
        '    <span class="k">Meaning</span><span class="v">' + esc(c.meaning) + "</span>" +
        '    <span class="k">Evidence</span><span class="v mono">' + esc(c.evidence.join(", ")) + "</span>" +
        '    <span class="k">Conflict</span><span class="v">' + esc(c.conflict) + "</span>" +
        "  </div></div>" +
        "</div>"
      );
    }).join("");
    openDrawer("Compare Candidates", rows);
  }

  function openViewEvidence() {
    var c = FX.CANDIDATES.filter(function (x) { return x.id === state.selectedCandidateId; })[0] || FX.CANDIDATES[0];
    openDrawer("Candidate Evidence",
      '<div class="kv">' +
      '  <span class="k">Candidate</span><span class="v">' + esc(c.label) + "</span>" +
      '  <span class="k">Evidence</span><span class="v mono">' + esc(c.evidence.join(", ")) + "</span>" +
      '  <span class="k">Note</span><span class="v muted">Evidence is fixture-only in this browser; R2A canonical ingestion exists in the repository.</span>' +
      "</div>");
  }

  function requestMoreEvidence() {
    state.decisions[state.selectedCandidateId] = "needs-more";
    state.stage = "evidence";
    renderTabs();
    renderStage();
  }

  function openValidateDelivery() {
    openDrawer("Validate Delivery",
      '<p class="small muted">Prototype validation checklist preview (no delivery is executed).</p>' +
      '<div class="kv">' +
      '  <span class="k">Tag naming</span><span class="v">fixture preview</span>' +
      '  <span class="k">Address resolved</span><span class="v">partial (fixture)</span>' +
      '  <span class="k">Unit / scaling</span><span class="v">fixture preview</span>' +
      '  <span class="k">Source provenance</span><span class="v">fixture candidate</span>' +
      "</div>");
  }

  function openCreateDeliveryPackage() {
    openDrawer("Create Delivery Package",
      '<div class="banner banner-info"><strong>FOUNDATION / FUTURE PRODUCT ACTION.</strong></div>' +
      '<p class="small muted">DeliveryPackage is a Domain concept. This prototype does not create a real package and does not export to any target system.</p>' +
      '<button type="button" class="btn btn-secondary" data-action="close-drawer">Acknowledge Prototype</button>');
  }

  function openReviewKnowledge() {
    var items = FX.KNOWLEDGE.reusable.map(function (r) {
      var rejected = !!state.rejectedKnowledge[r.id];
      return '<div class="investigation-row"><span class="inv-field">' + esc(r.label) + "</span>" +
        (rejected ? '<span class="chip chip-blocked">rejected (prototype)</span>' : fixtureChip()) + "</div>";
    }).join("");
    openDrawer("Review Knowledge", items);
  }

  function openPromoteKnowledge() {
    openDrawer("Promote to Knowledge",
      '<div class="banner banner-info"><strong>Prototype promotion preview only.</strong></div>' +
      '<p class="small muted">Cross-project applicability remains NOT FROZEN. Promoting here does not create a universal template.</p>' +
      '<button type="button" class="btn btn-secondary" data-action="close-drawer">Acknowledge Prototype</button>');
  }

  function rejectReuse() {
    state.rejectedKnowledge["K-1"] = true;
    closeDrawer();
    renderStage();
  }

  function openSetApplicability() {
    openDrawer("Set Applicability",
      '<p class="small muted">Set applicability to Project-local / Evidence-scoped (prototype-only).</p>' +
      '<button type="button" class="btn btn-primary" data-action="stage-action" data-action-id="submit-set-applicability">Set Project-local / Evidence-scoped</button>');
  }

  function submitSetApplicability() {
    state.knowledgeApplicability = "Project-local / Evidence-scoped (prototype set)";
    closeDrawer();
    renderStage();
  }

  function openViewProvenance() {
    openDrawer("Knowledge Provenance",
      '<div class="kv">' +
      '  <span class="k">Applicability</span><span class="v">' + esc(state.knowledgeApplicability || FX.KNOWLEDGE.applicability) + "</span>" +
      '  <span class="k">Review</span><span class="v">' + esc(FX.KNOWLEDGE.review) + "</span>" +
      '  <span class="k">Cross-project status</span><span class="v">' + chip(FX.KNOWLEDGE.crossProjectStatus) + "</span>" +
      "</div>");
  }

  /* ------------------------------------------------------------- rendering */
  function renderAll() {
    renderShell();
    renderTree();
    renderContext();
    renderScenarios();
    renderCapabilityMap();
    renderTabs();
    renderStage();
    renderStatusbar();
  }

  function renderTree() {
    var host = $("project-tree");
    var ws = projectWorkspace();
    var tree = (ws && ws.tree) ? ws.tree : [];
    var html =
      '<div class="tree-node">' +
      '  <div class="tree-row" role="treeitem"><span class="tree-caret">▼</span><span class="tree-icon">P</span><span>' + esc(currentProjectName()) + "</span></div>" +
      '  <div class="tree-children">';

    if (tree.length) {
      html += tree.map(function (node) { return renderTreeNode(node, 1); }).join("");
    } else {
      html += '<div class="tree-row" role="treeitem"><span class="tree-caret"> </span><span class="tree-icon"> </span><span class="muted">No devices configured</span></div>';
    }

    var tempIds = Object.keys(state.temporaryDevices);
    if (tempIds.length) {
      html +=
        '<div class="tree-node">' +
        '  <div class="tree-row" role="treeitem"><span class="tree-caret">▼</span><span class="tree-icon">L</span><span>Temporary (prototype)</span></div>' +
        '  <div class="tree-children">' +
        tempIds.map(function (id) {
          return renderTreeNode({ id: id, label: state.temporaryDevices[id].label, icon: "D", children: [] }, 2);
        }).join("") +
        "  </div>" +
        "</div>";
    }
    html += "  </div></div>";
    host.innerHTML = html;
  }

  function renderTreeNode(node, depth) {
    var hasChildren = node.children && node.children.length > 0;
    var isDevice = node.icon === "D";
    var selected = isDevice && node.id === state.deviceId;
    var expanded = depth < 3; // project/area/line expanded by default
    var html = "";
    html += '<div class="tree-node">';
    html += '  <div class="tree-row' + (selected ? " selected" : "") + '"';
    if (isDevice) {
      html += ' data-action="select-device" data-device="' + esc(node.id) + '" tabindex="0" role="treeitem"';
    } else {
      html += ' role="treeitem"';
    }
    html += ">";
    html += '    <span class="tree-caret">' + (hasChildren ? (expanded ? "▼" : "▶") : " ") + "</span>";
    html += '    <span class="tree-icon">' + esc(node.icon || "") + "</span>";
    html += "    <span>" + esc(node.label) + "</span>";
    html += "  </div>";
    if (hasChildren && expanded) {
      html += '<div class="tree-children">';
      html += node.children.map(function (child) { return renderTreeNode(child, depth + 1); }).join("");
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function renderContext() {
    var d = device();
    var s = scenario();
    $("ctx-project").textContent = currentProjectName();
    $("ctx-area").textContent = d ? d.area : "—";
    $("ctx-line").textContent = d ? d.line : "—";
    $("ctx-device").textContent = d ? d.label : "No device";
    $("ctx-state").textContent = d ? d.deviceState : "Not configured";
    $("ctx-readiness").textContent = s.strategy.readiness.status;
  }

  function renderScenarios() {
    var host = $("scenario-buttons");
    host.innerHTML = FX.SCENARIOS.map(function (s) {
      var active = s.id === state.scenarioId ? " active" : "";
      return (
        '<button type="button" class="scenario-btn' + active + '" data-action="switch-scenario" data-scenario="' + esc(s.id) + '">' +
        '  <span class="scenario-key">Scenario ' + esc(s.key) + "</span>" +
        '  <span class="scenario-hint">' + esc(s.hint) + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function renderCapabilityMap() {
    var host = $("capability-map");
    host.innerHTML = FX.CAPABILITY_MAP.map(function (c) {
      return (
        '<div class="cap-row" title="' + esc(c.detail || "") + '">' +
        '  <span class="cap-name">' + esc(c.label) +
        (c.detail ? '<span class="cap-detail">' + esc(c.detail) + "</span>" : "") +
        "</span>" +
        '  <span class="cap-slice">' + esc(c.slice) + "</span>" +
        chip(c.status) +
        "</div>"
      );
    }).join("");
  }

  function renderTabs() {
    var host = $("workflow-tabs");
    host.innerHTML = FX.WORKFLOW_STAGES.map(function (s) {
      var active = s.id === state.stage ? " active" : "";
      return (
        '<button type="button" class="wf-tab' + active + '" data-action="switch-stage" data-stage="' + esc(s.id) + '">' +
        '  <span class="wf-index">' + esc(String(s.index)) + "</span>" +
        "  <span>" + esc(s.label) + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function renderStatusbar() {
    var s = FX.WORKFLOW_STAGES.filter(function (x) { return x.id === state.stage; })[0];
    $("status-stage").textContent = s ? s.label : state.stage;
  }

  function renderStage() {
    var s = FX.WORKFLOW_STAGES.filter(function (x) { return x.id === state.stage; })[0];
    $("stage-title").textContent = s ? s.label : "Overview";
    var body = $("workspace-body");
    var subtitle = "";
    var content = "";

    if (state.mode === "workbench" && !device()) {
      body.innerHTML = renderEmptyProjectWorkspace();
      $("stage-subtitle").textContent = "No device fixture loaded for this Project";
      renderStatusbar();
      return;
    }

    switch (state.stage) {
      case "overview":     content = renderOverview(); subtitle = "Device summary and current state"; break;
      case "requirements": content = renderRequirements(); subtitle = "Data requirements and known / unknown facts"; break;
      case "strategy":     content = renderStrategy(); subtitle = "Primary / Alternative / Supplementary routes"; break;
      case "evidence":     content = renderEvidence(); subtitle = "Canonical Evidence / provenance / EvidencePackage placement"; break;
      case "candidates":   content = renderCandidates(); subtitle = "Implemented R5 engines — static prototype proposal view"; break;
      case "confirmation": content = renderConfirmation(); subtitle = "Engineer confirmation workspace — prototype-only"; break;
      case "delivery":     content = renderDelivery(); subtitle = "R8 DeliveryPackage / deterministic export placement"; break;
      case "knowledge":    content = renderKnowledge(); subtitle = "Device knowledge reuse preview"; break;
      default:             content = renderOverview();
    }

    body.innerHTML = content + renderActions(state.stage);
    $("stage-subtitle").textContent = subtitle;
    renderStatusbar();
  }

  /* ----------------------------------------------------------------- stages */

  function renderCalibrationSummary() {
    var cc = calibrationCase();
    if (!cc) return "";

    var factRows = cc.facts.map(function (x) {
      return (
        "<tr>" +
        "  <td class='mono'>" + esc(x.fact) + "</td>" +
        "  <td>" + chip(x.state) + "</td>" +
        "  <td class='mono'>" + esc(x.observation) + "</td>" +
        "  <td class='small'>" + esc(x.evidence) + "</td>" +
        "  <td class='muted small'>" + esc(x.note) + "</td>" +
        "</tr>"
      );
    }).join("");

    var governance = cc.governance.map(function (x) {
      return '<div class="trace-step governance-step"><strong>' + esc(x.fact) + "</strong> " + chip(x.state) +
        '<div class="small muted">' + esc(x.note) + "</div></div>";
    }).join("");

    return (
      '<div class="banner banner-info"><strong>RP01 calibration view.</strong> This selected device is backed by retained repository evidence used in D2/D3/D4-A. The browser still shows a product prototype; it does not create runtime EvidenceIds or field truth.</div>' +
      '<div class="panel calibration-panel">' +
      '  <h2 class="panel-title">Calibration Truth <span class="chip chip-available">REPOSITORY-BACKED</span></h2>' +
      '  <div class="grid grid-2">' +
      '    <div class="kv">' +
      '      <span class="k">Case</span><span class="v">' + esc(cc.label) + "</span>" +
      '      <span class="k">DeviceIdentity</span><span class="v">' + esc(cc.deviceIdentity) + "</span>" +
      '      <span class="k">ControllerIdentity</span><span class="v">' + esc(cc.controllerIdentity) + "</span>" +
      '      <span class="k">Verification environment</span><span class="v mono">' + esc(cc.environment) + "</span>" +
      '      <span class="k">Canonical binding</span><span class="v">' + esc(cc.binding) + "</span>" +
      '      <span class="k">EvidencePackage</span><span class="v">' + esc(cc.package) + "</span>" +
      "    </div>" +
      '    <div><div class="small muted"><strong>Evidence basis</strong></div><p class="small">' + esc(cc.basis) + "</p>" +
      '<div class="small muted"><strong>Explicit governance / access truth</strong></div>' + governance + "</div>" +
      "  </div>" +
      '  <div class="divider"></div>' +
      '  <table class="data"><thead><tr><th>Strategy Fact</th><th>State</th><th>Canonical Observation</th><th>Evidence Basis</th><th>Why</th></tr></thead><tbody>' + factRows + "</tbody></table>" +
      "</div>"
    );
  }

  function renderCalibrationStrategyTrace() {
    var cc = calibrationCase();
    if (!cc) return "";

    var steps = cc.path.map(function (step, i) {
      return '<div class="trace-step"><span class="trace-index">' + esc(String(i + 1)) + "</span><strong>" + esc(step) + "</strong></div>";
    }).join('<div class="flow-arrow">→</div>');

    var investigations = cc.investigations.map(function (x) { return chip("Unknown") + " " + esc(x); }).join("<br />");
    var unmapped = cc.unmappedContext.map(function (x) { return '<span class="chip chip-unknown">UNMAPPED</span> ' + esc(x); }).join("<br />");

    return (
      '<div class="panel calibration-panel">' +
      '  <h2 class="panel-title">Evidence → Strategy Trace <span class="panel-title-note">D4-A product placement</span></h2>' +
      '  <div class="trace-flow">' + steps + "</div>" +
      '  <div class="grid grid-2 trace-notes">' +
      '    <div><div class="small muted"><strong>Open investigations preserved</strong></div>' + investigations + "</div>" +
      '    <div><div class="small muted"><strong>Context intentionally not promoted</strong></div>' + unmapped + "</div>" +
      "  </div>" +
      '  <p class="small muted">D4-A maps only exact project-local canonical observation shapes. It does not infer Protocol / Address / Path from Controller/model/port markings. Strategy recommendation still requires the existing formal DiscoveryPlan handoff and explicit Engineer acceptance.</p>' +
      "</div>"
    );
  }

  function renderCalibrationEvidence() {
    var cc = calibrationCase();
    if (!cc) return "";

    return (
      '<div class="panel calibration-panel">' +
      '  <h2 class="panel-title">Canonical EvidencePackage Placement <span class="panel-title-note">calibration case</span></h2>' +
      '  <div class="kv">' +
      '    <span class="k">Case</span><span class="v">' + esc(cc.label) + "</span>" +
      '    <span class="k">Verification</span><span class="v mono">' + esc(cc.environment) + "</span>" +
      '    <span class="k">Binding</span><span class="v">' + esc(cc.binding) + "</span>" +
      '    <span class="k">Package</span><span class="v">' + esc(cc.package) + "</span>" +
      '    <span class="k">Runtime EvidenceId</span><span class="v muted">generated only during real R2A admission — not invented by this prototype</span>' +
      '    <span class="k">Source basis</span><span class="v">' + esc(cc.basis) + "</span>" +
      "  </div>" +
      "</div>"
    );
  }

  function renderOverview() {
    var d = device();
    var s = scenario();
    var st = s.strategy;

    var identityRows = [
      ["Project", currentProjectName()],
      ["Area", d.area],
      ["Line", d.line],
      ["Controller", d.controller],
      ["Vendor", d.vendor],
      ["Protocol", d.protocol]
    ].map(function (row) {
      return (
        '<span class="k">' + esc(row[0]) + "</span>" +
        '<span class="v">' + esc(row[1]) + "</span>"
      );
    }).join("");

    var factRows = FX.FACT_FIELDS.map(function (f) {
      var val = s.facts[f.id] || "Unknown";
      return (
        '<span class="k">' + esc(f.label) + "</span>" +
        '<span class="v">' + chip(val) + "</span>"
      );
    }).join("");

    var openInvestigations = st.investigations.length;
    var confirmedTags = 0;

    var calibration = renderCalibrationSummary();

    return (
      calibration +
      '<div class="banner banner-info"><strong>Single fact source.</strong> ' +
      "Identity comes from the selected device; Current Discovery Facts come from the selected scenario snapshot — the same source used by Requirements and Discovery Strategy.</div>" +

      '<div class="grid grid-2">' +
      '  <div class="panel">' +
      '    <h2 class="panel-title">Identity ' + fixtureChip() + "</h2>" +
      '    <div class="kv">' + identityRows + "</div>" +
      "  </div>" +

      '  <div class="panel">' +
      '    <h2 class="panel-title">Current Discovery Facts ' + fixtureChip() + " <span class=\"panel-title-note\">Scenario " + esc(s.key) + "</span></h2>" +
      '    <div class="kv">' + factRows + "</div>" +
      "  </div>" +
      "</div>" +

      '<div class="grid grid-2">' +
      '  <div class="panel">' +
      '    <h2 class="panel-title">Current State ' + fixtureChip() + "</h2>" +
      '    <div class="kv">' +
      '      <span class="k">Route Viability</span><span class="v">' + (st.hasViableRoute ? chip("AVAILABLE") : chip("BLOCKED")) + " HasViableRoute = " + (st.hasViableRoute ? "true" : "false") + "</span>" +
      '      <span class="k">Actionable Readiness</span><span class="v">' + chip(st.readiness.status) + "</span>" +
      '      <span class="k">Open Investigations</span><span class="v mono">' + esc(String(openInvestigations)) + " (fixture)</span>" +
      '      <span class="k">Evidence Count</span><span class="v mono">' + esc(String(FX.EVIDENCE.length)) + " (fixture)</span>" +
      '      <span class="k">Candidate Count</span><span class="v mono">' + esc(String(FX.CANDIDATES.length)) + " (fixture)</span>" +
      '      <span class="k">Confirmed Tags</span><span class="v mono">' + esc(String(confirmedTags)) + " (fixture)</span>" +
      "    </div>" +
      "  </div>" +

      '  <div class="panel">' +
      '    <h2 class="panel-title">Workflow at a glance</h2>' +
      '    <div class="pill-list">' +
      FX.WORKFLOW_STAGES.map(function (x, i) {
        var arrow = i < FX.WORKFLOW_STAGES.length - 1 ? '<span class="flow-arrow">→</span>' : "";
        return '<span class="chip ' + (x.id === state.stage ? "chip-primary" : "chip-unknown") + '">' + esc(x.label) + "</span>" + arrow;
      }).join("") +
      "    </div>" +
      '    <p class="small muted">Prototype workflow: Project → Device → Data Requirement → Known / Unknown → Discovery Strategy → Evidence → Candidate Identification → Engineer Confirmation → Delivery → Knowledge Reuse.</p>' +
      "  </div>" +
      "</div>"
    );
  }

  function renderRequirements() {
    var s = scenario();

    var allReqs = FX.REQUIREMENTS.concat(state.temporaryRequirements);
    var selectedReq = selectedRequirement();
    var reqRows = allReqs.map(function (r) {
      var edit = state.requirementEdits[r.id] || {};
      var meaning = edit.meaning || r.meaning;
      var type = edit.requirementType || r.requirementType;
      var assigned = edit.assigned ? '<span class="muted small"> · assigned to ' + esc(edit.assigned) + "</span>" : "";
      var selectedCls = (selectedReq && r.id === selectedReq.id) ? ' class="req-selected"' : "";
      return (
        '<tr tabindex="0" role="button" data-action="open-requirement" data-requirement="' + esc(r.id) + '"' + selectedCls + ">" +
        "  <td>" + esc(meaning) + "</td>" +
        "  <td>" + esc(type) + assigned + "</td>" +
        "  <td>" + chip(r.status) + "</td>" +
        "  <td class='muted small'>" + esc(r.note) + "</td>" +
        "</tr>"
      );
    }).join("");

    var factRows = FX.FACT_FIELDS.map(function (f) {
      var val = s.facts[f.id] || "Unknown";
      var action = val === "Unknown" ? " data-action=\"open-investigation\" data-field=\"" + esc(f.id) + "\" tabindex=\"0\" role=\"button\"" : "";
      return (
        '<tr' + action + ">" +
        "  <td>" + esc(f.label) + "</td>" +
        "  <td>" + chip(val) + "</td>" +
        "  <td class='muted small'>" + (val === "Unknown" ? "Click to inspect — Unknown stays Unknown" : "Fixture fact") + "</td>" +
        "</tr>"
      );
    }).join("");

    return (
      '<div class="banner banner-info"><strong>No universal business taxonomy is frozen.</strong> ' +
      "Requirement semantics are project-local until PDX-001 is satisfied. <strong>MES SKU/spec context ≠ PLC point truth.</strong></div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Data Requirements ' + fixtureChip() + ' <span class="panel-title-note">Selected Requirement: ' + esc(selectedReq ? selectedReq.meaning : "—") + ' · click a row to select</span></h2>' +
      '  <table class="data">' +
      "    <thead><tr><th>Requirement</th><th>Type</th><th>Status</th><th>Note</th></tr></thead>" +
      "    <tbody>" + reqRows + "</tbody>" +
      "  </table>" +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Known / Unknown Facts ' + fixtureChip() + " <span class=\"panel-title-note\">Scenario " + esc(s.key) + "</span></h2>" +
      "  <table class=\"data\">" +
      "    <thead><tr><th>Field</th><th>State</th><th>Note</th></tr></thead>" +
      "    <tbody>" + factRows + "</tbody>" +
      "  </table>" +
      '  <p class="small muted">States are Present / Absent / Unknown. Unknown is never rendered as False.</p>' +
      "</div>"
    );
  }

  function methodDetail(method) {
    var prereq = METHOD_PREREQUISITES[method.method] || "See strategy fixture.";
    return (
      '<div class="method-card-body">' +
      '  <div class="kv">' +
      '    <span class="k">Availability</span><span class="v">' + chip(method.availability) + "</span>" +
      '    <span class="k">Prerequisites</span><span class="v">' + esc(prereq) + "</span>" +
      '    <span class="k">Rationale</span><span class="v">' + esc(method.why || "—") + "</span>" +
      (method.blocker ? '    <span class="k">Blocker</span><span class="v">' + esc(method.blocker) + "</span>" : "") +
      '    <span class="k">Evidence refs</span><span class="v muted">Scenario snapshot in this static UI; RP01 calibration views show the canonical Evidence → Fact placement now implemented by D4-A.</span>' +
      '    <span class="k">Switch condition</span><span class="v">' + esc(method.switchCondition || "—") + "</span>" +
      '    <span class="k">Policy basis</span><span class="v">' + esc(method.policyBasis || "Project-local provisional strategy (fixture).") + "</span>" +
      "  </div>" +
      "</div>"
    );
  }

  function methodCard(method, isPrimary) {
    var isOpen = !!state.expanded[method.method];
    var notAuthorized = method.blocker && method.blocker.toUpperCase().indexOf("NOT AUTHORIZED") >= 0;
    return (
      '<div class="method-card' + (isPrimary ? " primary-card" : "") + '">' +
      '  <div class="method-card-head" data-action="expand-method" data-method="' + esc(method.method) + '" tabindex="0" role="button">' +
      "    <span class=\"method-name\">" + esc(method.method) + "</span>" +
      chip(method.availability) +
      (isPrimary ? primaryChip("PRIMARY") : chip(method.role || "")) +
      (notAuthorized ? '<span class="chip chip-blocked">NOT AUTHORIZED</span>' : "") +
      '    <span class="muted small">' + (isOpen ? "▲ hide detail" : "▼ detail") + "</span>" +
      "  </div>" +
      (isOpen ? methodDetail(method) : "") +
      "</div>"
    );
  }

  function renderStrategy() {
    var s = scenario();
    var st = s.strategy;

    var banner = s.banner
      ? '<div class="banner banner-' + esc(s.banner.kind) + '"><strong>' + esc(s.banner.text) + "</strong></div>"
      : "";

    var alternatives = st.alternatives.map(function (m) { return methodCard(m, false); }).join("");
    var supplementary = st.supplementary.map(function (m) { return methodCard(m, false); }).join("");

    var investigations = st.investigations.map(function (inv) {
      var resolved = !!state.fixtureResolved[inv.field];
      return (
        '<div class="investigation-row">' +
        '  <span class="inv-field">' + esc(inv.field) + "</span>" +
        (resolved ? '<span class="chip chip-conditional">fixture-resolved (visual only)</span>' : chip(inv.status)) +
        '  <button type="button" class="btn btn-secondary inv-action" data-action="open-investigation" data-field="' + esc(inv.field) + '">Inspect</button>' +
        (resolved
          ? ""
          : '  <button type="button" class="btn btn-secondary inv-action" data-action="mark-resolved" data-field="' + esc(inv.field) + '">Mark as fixture-resolved</button>') +
        "</div>"
      );
    }).join("");

    var calibration = renderCalibrationStrategyTrace();

    return (
      banner +
      calibration +
      '<div class="banner banner-info"><strong>R1 is implemented; this browser remains a snapshot.</strong> ' +
      "Scenario switching selects pre-authored UX fixtures. For RP01 calibration devices, the trace above shows how implemented D4-A places canonical evidence before R1 without executing production code in the browser.</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Primary Route</h2>' +
      methodCard(st.primary, true) +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Alternative Routes</h2>' +
      (alternatives || '<div class="empty-state">No alternative routes in this fixture.</div>') +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Supplementary</h2>' +
      (supplementary || '<div class="empty-state">No supplementary methods in this fixture.</div>') +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Bottom Line ' + fixtureChip() + "</h2>" +
      '  <div class="kv">' +
      '    <span class="k">HasViableRoute</span><span class="v mono">' + (st.hasViableRoute ? "true" : "false") + "</span>" +
      '    <span class="k">Actionable Readiness</span><span class="v">' + chip(st.readiness.status) + "</span>" +
      '    <span class="k">Readiness note</span><span class="v muted">' + esc(st.readiness.note) + "</span>" +
      '    <span class="k">Next Action Owner</span><span class="v">' + chip(st.nextActionOwner) + "</span>" +
      "  </div>" +
      '  <div class="divider"></div>' +
      '  <h3 class="panel-title">Investigation Items ' + fixtureChip() + "</h3>" +
      investigations +
      '  <p class="small muted">Owners are never auto-assigned. Marking an item fixture-resolved changes prototype UI state only — it never claims to change Domain truth. Use Reset Fixture to restore.</p>' +
      "</div>"
    );
  }

  function renderEvidence() {
    var d = device();

    var flow = FX.EVIDENCE_AUTHORITY_PATH.map(function (step, i) {
      var arrow = i < FX.EVIDENCE_AUTHORITY_PATH.length - 1 ? '<div class="flow-arrow">↓</div>' : "";
      var detail = step.detail ? '<div class="stat-note">' + esc(step.detail) + "</div>" : "";
      return '<div class="stat-tile">' + esc(step.label) + detail + "</div>" + arrow;
    }).join("");

    var cards = FX.EVIDENCE.concat(state.temporaryEvidence).map(function (ev) {
      return (
        '<div class="method-card" data-action="open-evidence" data-evidence="' + esc(ev.id) + '" tabindex="0" role="button">' +
        '  <div class="method-card-head">' +
        '    <span class="method-name">' + esc(ev.type) + "</span>" +
        "    <span class=\"mono muted\">" + esc(ev.id) + "</span>" +
        fixtureChip() +
        "  </div>" +
        '  <div class="method-card-body">' +
        '    <div class="kv">' +
        '      <span class="k">Provenance</span><span class="v">' + esc(ev.provenance) + "</span>" +
        '      <span class="k">Observed time</span><span class="v">' + esc(ev.observedTime) + "</span>" +
        '      <span class="k">Project</span><span class="v">' + esc(currentProjectName()) + "</span>" +
        '      <span class="k">Area / Line / Device</span><span class="v">' + esc(d.area) + " / " + esc(d.line) + " / " + esc(d.label) + "</span>" +
        '      <span class="k">Plan revision</span><span class="v">' + esc(ev.planRevision) + "</span>" +
        '      <span class="k">Session</span><span class="v">' + esc(ev.session) + "</span>" +
        '      <span class="k">Classification</span><span class="v">' + chip(ev.classification) + "</span>" +
        "    </div>" +
        "  </div>" +
        "</div>"
      );
    }).join("");

    var calibration = renderCalibrationEvidence();

    return (
      '<div class="banner banner-info"><strong>R2A canonical Evidence is implemented.</strong> This static screen explains the authority path and shows fixture cards; it does not ingest files or create runtime EvidenceIds.</div>' +
      calibration +

      '<div class="panel">' +
      '  <h2 class="panel-title">Canonical Authority Path <span class="chip chip-available">IMPLEMENTED</span></h2>' +
      '  <div class="grid grid-3">' + flow + "</div>" +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Evidence Cards ' + fixtureChip() + ' <span class="panel-title-note">click a card for full provenance</span></h2>' +
      cards +
      '  <p class="small muted">The repository has canonical evidence ingestion and bounded source paths; this static prototype performs no file parsing, network IO, or evidence admission.</p>' +
      "</div>"
    );
  }

  function renderCandidates() {
    var d = device();

    var candidateCards = FX.CANDIDATES.map(function (c) {
      var selected = c.id === state.selectedCandidateId;
      return (
        '<div class="method-card' + (selected ? " primary-card" : "") + '" data-action="select-candidate" data-candidate="' + esc(c.id) + '" tabindex="0" role="button">' +
        '  <div class="method-card-head">' +
        '    <span class="method-name">' + esc(c.label) + "</span>" +
        chip(c.status) +
        fixtureChip() +
        "  </div>" +
        '  <div class="method-card-body">' +
        '    <div class="kv">' +
        '      <span class="k">Address</span><span class="v mono">' + esc(c.address) + "</span>" +
        '      <span class="k">Type</span><span class="v mono">' + esc(c.dataType) + "</span>" +
        '      <span class="k">Possible Meaning</span><span class="v">' + esc(c.meaning) + "</span>" +
        '      <span class="k">Evidence</span><span class="v mono">' + esc(c.evidence.join(", ")) + "</span>" +
        '      <span class="k">Conflict</span><span class="v">' + (c.conflict === "none" ? chip("none") : chip("conflict") + " " + esc(c.conflict)) + "</span>" +
        "    </div>" +
        "  </div>" +
        "</div>"
      );
    }).join("");

    var engines = FX.ENGINES.map(function (e) {
      return (
        '<div class="investigation-row" data-action="open-engine" data-engine="' + esc(e.id) + '" tabindex="0" role="button">' +
        '  <span class="inv-field mono">' + esc(e.label) + "</span>" +
        chip(e.status) +
        '  <button type="button" class="btn btn-secondary inv-action" data-action="open-engine" data-engine="' + esc(e.id) + '">What this will contribute</button>' +
        "</div>"
      );
    }).join("");

    return (
      '<div class="banner banner-info"><strong>R5A–R5D identification engines are implemented.</strong> ' +
      "This static prototype does not execute them, so the cards below remain pre-authored Proposal fixtures rather than runtime engine output.</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Foundation Status</h2>' +
      '  <div class="pill-list">' +
      '    <span class="chip chip-available">Candidate Management Foundation = AVAILABLE</span>' +
      '    <span class="chip chip-available">Candidate Generation = R5A–R5D DONE</span>' +
      "  </div>" +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Fixture Candidates ' + fixtureChip() + ' <span class="panel-title-note">Fixture for selected device: ' + esc(d.label) + ' — click to select for Confirmation</span></h2>' +
      candidateCards +
      "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Identification Engines <span class="panel-title-note">implemented in repository; not executed by static prototype</span></h2>' +
      engines +
      '  <p class="small muted">Each engine is bounded to Proposal/advisory output. Clicking explains its contribution; no engine runs in this browser.</p>' +
      "</div>"
    );
  }

  function renderConfirmation() {
    var d = device();
    var c = FX.CANDIDATES.filter(function (x) { return x.id === state.selectedCandidateId; })[0] || FX.CANDIDATES[0];
    var decision = state.decisions[c.id];

    var decisionNote = "";
    var confirmedPreview = "";

    if (decision === "accepted") {
      decisionNote = '<div class="banner banner-info"><strong>Accepted (prototype state).</strong></div>';
      confirmedPreview =
        '<div class="panel">' +
        '  <h2 class="panel-title">ConfirmedTag Preview ' + fixtureChip() + "</h2>" +
        '  <div class="kv">' +
        '    <span class="k">Tag</span><span class="v mono">' + esc(deliveryTagFor(d, c.meaning)) + "</span>" +
        '    <span class="k">Address</span><span class="v mono">' + esc(c.address) + "</span>" +
        '    <span class="k">Type</span><span class="v mono">' + esc(c.dataType) + "</span>" +
        '    <span class="k">Confirmation</span><span class="v">Fixture confirmation — not written to any repository or domain.</span>' +
        "  </div>" +
        "</div>";
    } else if (decision === "rejected") {
      decisionNote = '<div class="banner banner-danger"><strong>Rejected (prototype state).</strong> No domain truth changed.</div>';
    } else if (decision === "needs-more") {
      decisionNote = '<div class="banner banner-warn"><strong>Need More Evidence (prototype state).</strong> No domain truth changed.</div>';
    }

    return (
      '<div class="banner banner-info"><strong>Prototype action — no Domain persistence.</strong> Accept / Reject / Need More Evidence ' +
      "only change disposable prototype UI state. They never write to a repository or domain aggregate.</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Candidate Detail ' + fixtureChip() + "</h2>" +
      '  <div class="kv">' +
      '    <span class="k">Candidate</span><span class="v">' + esc(c.label) + "</span>" +
      '    <span class="k">Fixture for selected device</span><span class="v">' + esc(d.label) + "</span>" +
      '    <span class="k">Address</span><span class="v mono">' + esc(c.address) + "</span>" +
      '    <span class="k">Data type</span><span class="v mono">' + esc(c.dataType) + "</span>" +
      '    <span class="k">Possible meaning</span><span class="v">' + esc(c.meaning) + "</span>" +
      '    <span class="k">Evidence</span><span class="v mono">' + esc(c.evidence.join(", ")) + "</span>" +
      '    <span class="k">Provenance</span><span class="v muted">' + esc(c.provenance) + "</span>" +
      '    <span class="k">Conflict</span><span class="v">' + esc(c.conflict) + "</span>" +
      '    <span class="k">Current Unknowns</span><span class="v">' + (c.address === "UNKNOWN" ? "Address unresolved (fixture)" : "Remaining meaning confirmation (fixture)") + "</span>" +
      "  </div>" +
      decisionNote +
      confirmedPreview +
      "</div>"
    );
  }

  function renderDelivery() {
    var delivery = FX.DELIVERY;
    var d = device();

    var rows = delivery.preview.map(function (p) {
      return (
        "<tr>" +
        "  <td class='mono'>" + esc(deliveryTagFor(d, p.meaning)) + "</td>" +
        "  <td class='mono'>" + esc(p.address) + "</td>" +
        "  <td class='mono'>" + esc(p.type) + "</td>" +
        "  <td>" + esc(p.unit) + "</td>" +
        "  <td class='muted small'>" + esc(p.source) + "</td>" +
        "  <td>" + chip(p.status) + "</td>" +
        "</tr>"
      );
    }).join("");

    var targets = delivery.targets.map(function (t) {
      return '<span class="chip chip-unknown">' + esc(t) + " — mapping placeholder</span>";
    }).join(" ");

    var mapping = state.deliveryPreviewed
      ? '<div class="panel"><h2 class="panel-title">Target Mapping Preview ' + fixtureChip() + '</h2><div class="pill-list">' + targets + '</div><p class="small muted">R8 export exists, but target-specific deployment/mapping remains outside this static prototype and no target system is contacted.</p></div>'
      : "";

    return (
      '<div class="banner banner-info"><strong>' + esc(delivery.banner) + ".</strong> " + esc(delivery.note) + "</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Delivery Preview ' + fixtureChip() + ' <span class="panel-title-note">context: ' + esc(d.line) + " / " + esc(d.label) + "</span></h2>" +
      '  <table class="data">' +
      "    <thead><tr><th>Tag</th><th>Address</th><th>Type</th><th>Unit</th><th>Source</th><th>Status</th></tr></thead>" +
      "    <tbody>" + rows + "</tbody>" +
      "  </table>" +
      '  <p class="small muted">R8 deterministic offline export exists in the repository. This static prototype does not create/issue a real DeliveryPackage or contact SCADA / OPC / PI / MES.</p>' +
      mapping +
      "</div>"
    );
  }

  function renderKnowledge() {
    var k = FX.KNOWLEDGE;

    var items = k.reusable.map(function (r) {
      var rejected = !!state.rejectedKnowledge[r.id];
      return (
        '<div class="investigation-row" data-action="open-knowledge" data-knowledge="' + esc(r.id) + '" tabindex="0" role="button">' +
        '  <span class="inv-field">' + esc(r.label) + "</span>" +
        (rejected ? '<span class="chip chip-blocked">rejected (prototype)</span>' : fixtureChip()) +
        '  <button type="button" class="btn btn-secondary inv-action" data-action="open-knowledge" data-knowledge="' + esc(r.id) + '">Inspect</button>' +
        "</div>"
      );
    }).join("");

    return (
      '<div class="banner banner-info"><strong>Device Knowledge foundation exists.</strong> Reusable knowledge remains project-local and ' +
      "evidence-scoped until PDX-001 is satisfied. Universal cross-project freeze is NOT available.</div>" +

      '<div class="panel">' +
      '  <h2 class="panel-title">Device Knowledge Preview ' + fixtureChip() + "</h2>" +
      '  <div class="kv">' +
      '    <span class="k">Device Family</span><span class="v">' + esc(k.deviceFamily) + "</span>" +
      '    <span class="k">Applicability</span><span class="v">' + esc(state.knowledgeApplicability || k.applicability) + "</span>" +
      '    <span class="k">Review</span><span class="v">' + esc(k.review) + "</span>" +
      '    <span class="k">Cross-project status</span><span class="v">' + chip(k.crossProjectStatus) + "</span>" +
      "  </div>" +
      '  <div class="divider"></div>' +
      '  <h3 class="panel-title">Reusable Knowledge (fixture)</h3>' +
      items +
      '  <p class="small muted">' + esc(k.pdxNote) + "</p>" +
      "</div>"
    );
  }

  /* --------------------------------------------------------------- drawer */
  function openDrawer(title, html) {
    $("drawer-title").textContent = title;
    $("drawer-body").innerHTML = html;
    $("drawer").classList.add("open");
    $("drawer").setAttribute("aria-hidden", "false");
    $("drawer-backdrop").hidden = false;
  }

  function closeDrawer() {
    $("drawer").classList.remove("open");
    $("drawer").setAttribute("aria-hidden", "true");
    $("drawer-backdrop").hidden = true;
  }

  /* -------------------------------------------------------------- actions */
  function handleAction(action, el) {
    switch (action) {
      case "select-device":
        state.deviceId = el.getAttribute("data-device") || "plc-01";
        resetContextLocalState();
        renderTree();
        renderContext();
        renderStage();
        break;

      case "switch-stage":
        state.stage = el.getAttribute("data-stage") || "overview";
        renderTabs();
        renderStage();
        break;

      case "next-stage": {
        var ids = FX.WORKFLOW_STAGES.map(function (s) { return s.id; });
        var idx = ids.indexOf(state.stage);
        state.stage = ids[(idx + 1) % ids.length];
        renderTabs();
        renderStage();
        break;
      }

      case "switch-scenario":
        state.scenarioId = el.getAttribute("data-scenario") || "A";
        resetContextLocalState();
        renderScenarios();
        renderContext();
        renderStage();
        break;

      case "expand-method": {
        var m = el.getAttribute("data-method");
        state.expanded[m] = !state.expanded[m];
        renderStage();
        break;
      }

      case "open-investigation": {
        var fieldId = el.getAttribute("data-field");
        var label = "";
        for (var i = 0; i < FX.FACT_FIELDS.length; i++) {
          if (FX.FACT_FIELDS[i].id === fieldId) label = FX.FACT_FIELDS[i].label;
        }
        var inv = scenario().strategy.investigations.filter(function (x) { return x.field === label || x.field === fieldId; })[0];
        var html = '<div class="kv">' +
          '  <span class="k">Field</span><span class="v">' + esc(inv ? inv.field : label) + "</span>" +
          '  <span class="k">Status</span><span class="v">' + chip(inv ? inv.status : "UNKNOWN") + "</span>" +
          '  <span class="k">Why needed</span><span class="v">' + esc(inv ? inv.why : "This fact is Unknown and requires investigation.") + "</span>" +
          '  <span class="k">Affects</span><span class="v">' + esc(inv ? inv.affects : "Discovery planning") + "</span>" +
          '  <span class="k">Owner</span><span class="v">' + chip(inv ? inv.owner : "UNASSIGNED") + "</span>" +
          '  <span class="k">Evidence</span><span class="v">' + esc(inv && inv.evidence ? inv.evidence : "None") + "</span>" +
          "</div>" +
          '<div class="divider"></div>' +
          '<p class="small muted">Owners are never auto-assigned, and opening this detail does not turn an Unknown into Known. ' +
          "Use “Mark as fixture-resolved” for prototype visual state only, then Reset Fixture to restore.</p>";
        openDrawer("Investigation", html);
        break;
      }

      case "mark-resolved": {
        var f = el.getAttribute("data-field");
        if (f) state.fixtureResolved[f] = true;
        renderStage();
        break;
      }

      case "reset-fixture":
        state.scenarioId = "A";
        resetContextLocalState();
        renderAll();
        break;

      case "open-requirement": {
        var rid = el.getAttribute("data-requirement");
        var req = findRequirement(rid);
        if (req) {
          state.selectedRequirementId = req.id;
          var edit = state.requirementEdits[req.id] || {};
          renderStage();
          openDrawer("Data Requirement", '<div class="kv">' +
            '  <span class="k">Meaning</span><span class="v">' + esc(edit.meaning || req.meaning) + "</span>" +
            '  <span class="k">Type</span><span class="v">' + esc(edit.requirementType || req.requirementType) + "</span>" +
            '  <span class="k">Status</span><span class="v">' + chip(req.status) + "</span>" +
            '  <span class="k">Note</span><span class="v">' + esc(req.note) + "</span>" +
            "</div>");
        }
        break;
      }

      case "open-evidence": {
        var eid = el.getAttribute("data-evidence");
        var ev = FX.EVIDENCE.concat(state.temporaryEvidence).filter(function (e) { return e.id === eid; })[0];
        if (ev) {
          var d = device();
          openDrawer("Evidence Provenance", '<div class="kv">' +
            '  <span class="k">Evidence type</span><span class="v">' + esc(ev.type) + "</span>" +
            '  <span class="k">Provenance</span><span class="v">' + esc(ev.provenance) + "</span>" +
            '  <span class="k">Observed time</span><span class="v">' + esc(ev.observedTime) + "</span>" +
            '  <span class="k">Project</span><span class="v">' + esc(currentProjectName()) + "</span>" +
            '  <span class="k">Area / Line / Device</span><span class="v">' + esc(d.area) + " / " + esc(d.line) + " / " + esc(d.label) + "</span>" +
            '  <span class="k">Plan revision</span><span class="v">' + esc(ev.planRevision) + "</span>" +
            '  <span class="k">Session</span><span class="v">' + esc(ev.session) + "</span>" +
            '  <span class="k">Limitation</span><span class="v">' + esc(ev.limitation) + "</span>" +
            '  <span class="k">Classification</span><span class="v">' + chip(ev.classification) + "</span>" +
            "</div>");
        }
        break;
      }

      case "select-candidate":
        state.selectedCandidateId = el.getAttribute("data-candidate") || "CAND-001";
        renderStage();
        break;

      case "accept-candidate":
        state.decisions[el.getAttribute("data-candidate") || state.selectedCandidateId] = "accepted";
        renderStage();
        break;

      case "reject-candidate":
        state.decisions[el.getAttribute("data-candidate") || state.selectedCandidateId] = "rejected";
        renderStage();
        break;

      case "need-more-evidence":
        state.decisions[el.getAttribute("data-candidate") || state.selectedCandidateId] = "needs-more";
        renderStage();
        break;

      case "preview-delivery":
        state.deliveryPreviewed = true;
        renderStage();
        break;

      case "open-engine": {
        var engId = el.getAttribute("data-engine");
        var eng = FX.ENGINES.filter(function (e) { return e.id === engId; })[0];
        if (eng) {
          openDrawer("Identification Engine", '<div class="kv">' +
            '  <span class="k">Engine</span><span class="v mono">' + esc(eng.label) + "</span>" +
            '  <span class="k">Status</span><span class="v">' + chip(eng.status) + "</span>" +
            '  <span class="k">Bounded contribution</span><span class="v">' + esc(eng.contribution) + "</span>" +
            "</div>" +
            '<div class="divider"></div>' +
            '<p class="small muted">The engine is implemented in the repository, but no algorithm executes inside this static prototype.</p>');
        }
        break;
      }

      case "open-knowledge": {
        var kid = el.getAttribute("data-knowledge");
        var k = FX.KNOWLEDGE.reusable.filter(function (x) { return x.id === kid; })[0];
        if (k) {
          openDrawer("Reusable Knowledge", '<div class="kv">' +
            '  <span class="k">Item</span><span class="v">' + esc(k.label) + "</span>" +
            '  <span class="k">Note</span><span class="v">' + esc(k.note) + "</span>" +
            '  <span class="k">Applicability</span><span class="v">' + esc(state.knowledgeApplicability || FX.KNOWLEDGE.applicability) + "</span>" +
            '  <span class="k">Cross-project status</span><span class="v">' + chip(FX.KNOWLEDGE.crossProjectStatus) + "</span>" +
            "</div>");
        }
        break;
      }

      case "open-project-hub":
      case "close-project-workspace":
        state.mode = "project-hub";
        renderShell();
        break;

      case "back-to-workbench":
        state.mode = "workbench";
        renderAll();
        break;

      case "open-project": {
        var pid = el.getAttribute("data-project-id");
        var p = findProject(pid) || state.recentProjects[0] || FX.DEFAULT_PROJECT;
        state.currentProject = p;
        state.mode = "workbench";
        resetProjectLocalState();
        closeDrawer();
        renderAll();
        break;
      }

      case "open-project-list":
        openDrawer("Open Project",
          state.recentProjects.map(function (p) {
            return '<div class="project-card" data-action="open-project" data-project-id="' + esc(p.id) + '" tabindex="0" role="button">' +
              '  <div class="pc-name">' + esc(p.name) + "</div>" +
              '  <div class="pc-meta">' + esc(p.site) + "</div>" +
              "</div>";
          }).join("") + '<p class="small muted">Prototype fixture context only — no real file, no storage.</p>');
        break;

      case "new-project":
        openNewProject();
        break;

      case "open-project-settings":
        openProjectSettings();
        break;

      case "archive-project":
        openArchiveProject();
        break;

      case "stage-action":
        runStageAction(el.getAttribute("data-action-id"));
        break;

      case "close-drawer":
        closeDrawer();
        break;
    }
  }

  /* ------------------------------------------------------------- events */
  document.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.getAttribute && el.getAttribute("data-action")) {
        handleAction(el.getAttribute("data-action"), el);
        return;
      }
      el = el.parentNode;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.getAttribute && e.target.getAttribute("data-action")) {
      e.preventDefault();
      handleAction(e.target.getAttribute("data-action"), e.target);
    }
  });

  $("drawer-backdrop").addEventListener("click", closeDrawer);

  renderAll();
})();
