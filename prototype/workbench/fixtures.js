/* ==========================================================================
   fixtures.js — pre-authored UX / product-calibration snapshots for the
   PDRIFT-UX0.2 Product Workbench Prototype.

   IMPORTANT
   ---------
   * This file is still prototype data. The browser never executes production
     Domain/Application code and performs no industrial IO.
   * Capability labels reflect repository truth after R2–R8 and RP01-D4-A.
   * RP01 calibration cases summarize retained repository evidence and accepted
     semantics; runtime EvidenceIds are not invented or persisted here.
   * Scenario switching remains a demo control. It selects pre-authored R1-
     aligned snapshots; the real AdaptiveDiscoveryStrategyEngine is implemented
     in the repository but is not executed by this static prototype.
   ========================================================================== */

window.WORKBENCH_FIXTURES = (function () {
  "use strict";

  /* Global warnings shown everywhere. */
  var WARNINGS = ["PROTOTYPE", "FIXTURE DATA", "NO INDUSTRIAL IO"];

  /* The 8 clickable workflow stages. */
  var WORKFLOW_STAGES = [
    { id: "overview",     label: "Overview",            index: 1 },
    { id: "requirements", label: "Requirements",        index: 2 },
    { id: "strategy",     label: "Discovery Strategy",  index: 3 },
    { id: "evidence",     label: "Evidence",            index: 4 },
    { id: "candidates",   label: "Candidates",          index: 5 },
    { id: "confirmation", label: "Confirmation",        index: 6 },
    { id: "delivery",     label: "Delivery",            index: 7 },
    { id: "knowledge",    label: "Knowledge",           index: 8 }
  ];

  /* Every executable prototype action id. None is an industrial write/control
     action. Keep this list in sync with the data-action attributes used by
     index.html and app.js. */
  var ACTIONS = [
    "select-device",
    "switch-stage",
    "next-stage",
    "switch-scenario",
    "expand-method",
    "open-investigation",
    "mark-resolved",
    "reset-fixture",
    "open-requirement",
    "open-evidence",
    "select-candidate",
    "open-engine",
    "open-knowledge",
    "close-drawer",
    "open-project-hub",
    "close-project-workspace",
    "back-to-workbench",
    "open-project",
    "open-project-list",
    "new-project",
    "open-project-settings",
    "archive-project",
    "stage-action"
  ];

  /* Fixture project hierarchy. Demo names only — no customer-private names. */
  var PROJECT_TREE = [
    {
      id: "demo-project",
      label: "RP-01 Style Demo Project",
      icon: "P",
      children: [
        {
          id: "area-5",
          label: "Area 5",
          icon: "A",
          children: [
            {
              id: "ht1-line",
              label: "HT1 Line",
              icon: "L",
              children: [
                { id: "plc-01", label: "PLC-01", icon: "D" },
                { id: "plc-02", label: "PLC-02", icon: "D" }
              ]
            },
            { id: "demo-packaging-line", label: "Demo Packaging Line", icon: "L", children: [] }
          ]
        },
        {
          id: "area-6",
          label: "Area 6",
          icon: "A",
          children: [
            {
              id: "demo-tissue-line",
              label: "Demo Tissue Line",
              icon: "L",
              children: [
                { id: "plc-03", label: "PLC-03", icon: "D" }
              ]
            },
            {
              id: "rp01-calibration-line",
              label: "RP01 Calibration Cases",
              icon: "L",
              children: [
                { id: "rp01-hk01-single-pack", label: "HK-01 Single Pack", icon: "D" },
                { id: "rp01-ht6-002", label: "HT6 Embossing / Pressure", icon: "D" }
              ]
            }
          ]
        }
      ]
    }
  ];

  /* Device fixture identity only. Discovery facts are NOT stored here; they live
     in the scenario snapshots (scenario().facts) so Overview / Requirements /
     Discovery Strategy share one source of truth. Devices carry only Area / Line /
     Device / Controller / Vendor / Protocol; Project ownership comes from the
     active Project context. */
  var DEVICES = {
    "plc-01": {
      id: "plc-01",
      label: "PLC-01",
      controller: "PLC-01",
      vendor: "UNKNOWN",
      protocol: "UNKNOWN",
      area: "Area 5",
      line: "HT1 Line",
      deviceState: "Identified — fixture"
    },
    "plc-02": {
      id: "plc-02",
      label: "PLC-02",
      controller: "PLC-02",
      vendor: "UNKNOWN",
      protocol: "UNKNOWN",
      area: "Area 5",
      line: "HT1 Line",
      deviceState: "Identified — fixture"
    },
    "plc-03": {
      id: "plc-03",
      label: "PLC-03",
      controller: "PLC-03",
      vendor: "UNKNOWN",
      protocol: "UNKNOWN",
      area: "Area 6",
      line: "Demo Tissue Line",
      deviceState: "Identified — fixture"
    },
    "rp01-hk01-single-pack": {
      id: "rp01-hk01-single-pack",
      label: "HK-01 Single Pack / RD6-DBJ-HK01",
      controller: "Mitsubishi MELSEC FX3U / FX3U-128M",
      vendor: "Mitsubishi (controller evidence)",
      protocol: "UNKNOWN",
      area: "Area 6",
      line: "RP01 Calibration Cases",
      deviceState: "Field identity evidenced — calibration"
    },
    "rp01-ht6-002": {
      id: "rp01-ht6-002",
      label: "HT6 Embossing / Pressure / RP01-HT6-002",
      controller: "Inovance GL10 / GL10-RTU-ECTA context",
      vendor: "Inovance (controller evidence)",
      protocol: "UNKNOWN",
      area: "Area 6",
      line: "RP01 Calibration Cases",
      deviceState: "Documentary + field identity evidenced — calibration"
    }
  };

  /* Project-specific prototype workspaces. Each recent project is bound to its
     own tree + device fixture, so switching a project switches the workspace,
     not just a label. A project id absent from this map resolves to an empty
     workspace (no inherited RP-01 devices). */
  var PROJECT_WORKSPACES = {
    "rp01-demo": {
      /* Area-level children only — the Project root row is rendered by
         renderTree() from currentProjectName(), so the workspace tree must
         never repeat the Project root. */
      tree: PROJECT_TREE[0].children,
      devices: DEVICES
    },
    "demo-packaging": {
      tree: [
        {
          id: "demo-area",
          label: "Demo Area",
          icon: "A",
          children: [
            {
              id: "demo-packaging-line",
              label: "Demo Packaging Line",
              icon: "L",
              children: [
                { id: "pkg-plc-01", label: "PKG-PLC-01", icon: "D" }
              ]
            }
          ]
        }
      ],
      devices: {
        "pkg-plc-01": {
          id: "pkg-plc-01",
          label: "PKG-PLC-01",
          controller: "PKG-PLC-01",
          vendor: "UNKNOWN",
          protocol: "UNKNOWN",
          area: "Demo Area",
          line: "Demo Packaging Line",
          deviceState: "Identified — fixture"
        }
      }
    }
  };

  /* RP01 product-calibration cases. These repository-backed summaries are
     used to judge product placement. They do not invent runtime EvidenceIds. */
  var CALIBRATION_CASES = {
    "rp01-hk01-single-pack": {
      label: "HK-01 Single Pack / RD6-DBJ-HK01",
      basis: "Retained field-photo evidence RP01-FPHOTO-0002..0007; D2/D3/D4-A acceptance fixture.",
      environment: "L3ReplayGoldenFixture",
      binding: "Project + Device + exact Plan revision + Session",
      package: "EvidencePackage revision assembled from exact R2A-admitted records",
      deviceIdentity: "Present — RD6-DBJ-HK01",
      controllerIdentity: "Present — Mitsubishi MELSEC FX3U / FX3U-128M",
      facts: [
        { observation: "field.equipment.identity", fact: "DeviceIdentity", state: "Present", evidence: "RP01-FPHOTO-0002", note: "Field identity evidence; scope-delta device is not force-mapped to a documentary row." },
        { observation: "field.controller.family-marking / model-marking", fact: "ControllerIdentity", state: "Present", evidence: "RP01-FPHOTO-0006/0007", note: "Controller context only; no protocol/address inference." },
        { observation: "discovery.protocol-identification", fact: "ProtocolIdentification", state: "Unknown", evidence: "canonical Unknown evidence", note: "Controller family/model does not prove a usable acquisition protocol." },
        { observation: "discovery.address-identification", fact: "AddressIdentification", state: "Unknown", evidence: "canonical Unknown evidence", note: "No verified tag/address identity." },
        { observation: "discovery.ethernet-path", fact: "EthernetPath", state: "Unknown", evidence: "canonical Unknown evidence", note: "No usable/reachable Ethernet path established." }
      ],
      governance: [
        { fact: "ActiveReadAuthorization", state: "Absent", note: "Explicit RP01 governance truth; never projected from equipment evidence." },
        { fact: "PassiveObservationPoint", state: "Unknown", note: "Historical photos do not authorize a future passive observation point." },
        { fact: "FieldAccess", state: "Unknown", note: "Historical evidence does not establish current field-access authorization." }
      ],
      investigations: ["ProtocolIdentification", "AddressIdentification", "EthernetPath"],
      unmappedContext: ["motion-controller cabinet context"],
      path: ["R3A replay", "R2A canonical evidence", "D4-A project-local projection", "R1 Adaptive Strategy", "DiscoveryPlan recommendation", "Engineer Plan acceptance"]
    },
    "rp01-ht6-002": {
      label: "HT6 Embossing / Pressure / RP01-HT6-002",
      basis: "Archived documentary row + RP01-FPHOTO-0134/0135; D2/D3/D4-A acceptance fixture.",
      environment: "L3ReplayGoldenFixture",
      binding: "Project + Device + exact Plan revision + Session",
      package: "EvidencePackage revision assembled from exact R2A-admitted records",
      deviceIdentity: "Present — RP01-HT6-002",
      controllerIdentity: "Present — Inovance GL10 / GL10-RTU-ECTA context",
      facts: [
        { observation: "field.equipment.identity", fact: "DeviceIdentity", state: "Present", evidence: "RP01-FPHOTO-0134/0135 + documentary row", note: "Equipment identity is evidence-backed." },
        { observation: "documentary.controller.model / field.controller.family-marking", fact: "ControllerIdentity", state: "Present", evidence: "documentary row + RP01-FPHOTO-0134/0135", note: "Documentary + field controller context; no protocol inference." },
        { observation: "discovery.protocol-identification", fact: "ProtocolIdentification", state: "Unknown", evidence: "canonical Unknown evidence", note: "Visible EtherCAT context is not promoted to a usable acquisition protocol." },
        { observation: "discovery.address-identification", fact: "AddressIdentification", state: "Unknown", evidence: "canonical Unknown evidence", note: "No verified tag/address identity." },
        { observation: "discovery.ethernet-path", fact: "EthernetPath", state: "Unknown", evidence: "canonical Unknown evidence", note: "Visible cabling does not establish an ITD-reachable/permitted path." },
        { observation: "engineering.address-table", fact: "EngineeringAddressTable", state: "Unknown", evidence: "canonical Unknown evidence", note: "Documentary notes do not prove an available address table." }
      ],
      governance: [
        { fact: "ActiveReadAuthorization", state: "Absent", note: "Explicit RP01 governance truth; never projected from controller/port evidence." },
        { fact: "PassiveObservationPoint", state: "Unknown", note: "Field photos do not authorize a future passive observation point." },
        { fact: "FieldAccess", state: "Unknown", note: "Current access authorization is not established." }
      ],
      investigations: ["ProtocolIdentification", "AddressIdentification", "EthernetPath", "EngineeringAddressTable"],
      unmappedContext: ["field.protocol-marking.context = EtherCAT marking/cabling"],
      path: ["R3A replay", "R2A canonical evidence", "D4-A project-local projection", "R1 Adaptive Strategy", "DiscoveryPlan recommendation", "Engineer Plan acceptance"]
    }
  };

  /* Facts about the discovery situation, grouped per scenario.
     States are only Present / Absent / Unknown. Unknown is never shown as False. */
  var FACT_FIELDS = [
    { id: "EngineeringSource",        label: "Engineering Source" },
    { id: "EngineeringProjectFile",   label: "Engineering Project File" },
    { id: "AddressTable",             label: "Address Table" },
    { id: "ExistingSystemAccess",     label: "Existing System Access" },
    { id: "PassiveObservationPoint",  label: "Passive Observation Point" },
    { id: "ActiveReadAuthorization",  label: "Active Read Authorization" },
    { id: "EthernetPath",             label: "Ethernet Path" },
    { id: "ProtocolIdentification",   label: "Protocol Identification" },
    { id: "AddressIdentification",    label: "Address Identification" }
  ];

  /* Scenario A — Existing System / HMI available; engineering source absent. */
  var SCENARIOS = [
    {
      id: "A",
      key: "A",
      label: "Scenario A",
      hint: "HMI available",
      title: "Existing System / HMI available · engineering source absent",
      banner: null,
      facts: {
        EngineeringSource:       "Absent",
        EngineeringProjectFile:  "Absent",
        AddressTable:            "Unknown",
        ExistingSystemAccess:    "Present",
        PassiveObservationPoint: "Unknown",
        ActiveReadAuthorization: "Unknown",
        EthernetPath:            "Unknown",
        ProtocolIdentification:  "Unknown",
        AddressIdentification:   "Unknown"
      },
      strategy: {
        primary: {
          method: "Existing System / HMI",
          availability: "AVAILABLE",
          role: "PRIMARY",
          why: "Existing System / HMI access is Present, so an engineer has a read-side view of the current tag/point population without requiring the engineering source program.",
          policyBasis: "Project-local provisional strategy (fixture snapshot aligned to R1).",
          switchCondition: "Switch to Passive Capture if an authorized observation point exists and existing-system access cannot be granted."
        },
        alternatives: [
          {
            method: "Engineering File",
            availability: "BLOCKED",
            role: "ALTERNATIVE",
            why: "The engineering source / project file is unavailable, so file import cannot start.",
            blocker: "Engineering source / project unavailable.",
            switchCondition: "Re-evaluate if an engineering project export is obtained."
          },
          {
            method: "Passive Capture",
            availability: "CONDITIONAL",
            role: "ALTERNATIVE",
            why: "Passive observation point is Unknown; a valid, non-invasive observation point would first need to be identified and authorized.",
            blocker: null,
            switchCondition: "Available once a passive observation point is confirmed."
          },
          {
            method: "Controlled Active Read",
            availability: "CONDITIONAL",
            role: "ALTERNATIVE",
            why: "Active Read authorization is Unknown; it can never be assumed.",
            blocker: "NOT AUTHORIZED — active read requires its own explicit authorization.",
            switchCondition: "Only under a separate, explicit Active Read authorization."
          }
        ],
        supplementary: [
          {
            method: "Manual / Human Supplement",
            availability: "CONDITIONAL",
            why: "Engineer notes and manual walkdown can enrich evidence while primary discovery proceeds."
          }
        ],
        hasViableRoute: true,
        readiness: {
          status: "NotReady",
          note: "A viable Existing System / HMI route exists, but no explicit next-action owner has been assigned. The scope is therefore NotReady for actionable execution; unresolved facts remain InvestigationItems."
        },
        nextActionOwner: "UNASSIGNED",
        investigations: [
          {
            field: "Engineering Address Table",
            status: "UNKNOWN",
            why: "The address table determines which addresses exist and how they map to meaning.",
            affects: "Engineering File Import",
            owner: "UNASSIGNED",
            evidence: "None"
          },
          {
            field: "Passive Observation Point",
            status: "UNKNOWN",
            why: "A valid observation point is a prerequisite for non-invasive passive capture.",
            affects: "Passive Capture",
            owner: "UNASSIGNED",
            evidence: "None"
          },
          {
            field: "Active Read Authorization",
            status: "UNKNOWN",
            why: "Controlled Active Read must never run without an explicit authorization decision.",
            affects: "Controlled Active Read",
            owner: "UNASSIGNED",
            evidence: "None"
          }
        ]
      }
    },

    /* Scenario B — engineering project export + address table present. */
    {
      id: "B",
      key: "B",
      label: "Scenario B",
      hint: "File import ready",
      title: "Engineering project export + address table present",
      banner: null,
      facts: {
        EngineeringSource:       "Present",
        EngineeringProjectFile:  "Present",
        AddressTable:            "Present",
        ExistingSystemAccess:    "Unknown",
        PassiveObservationPoint: "Unknown",
        ActiveReadAuthorization: "Unknown",
        EthernetPath:            "Unknown",
        ProtocolIdentification:  "Unknown",
        AddressIdentification:   "Present"
      },
      strategy: {
        primary: {
          method: "Engineering File Import",
          availability: "AVAILABLE",
          role: "PRIMARY",
          why: "An engineering project export and the address table are both Present, which is the direct, fully-offline import path.",
          policyBasis: "Project-local provisional strategy (fixture snapshot aligned to R1).",
          switchCondition: "Switch to Existing System / HMI if the export turns out to be incomplete or unreadable."
        },
        alternatives: [
          {
            method: "Existing System / HMI",
            availability: "UNKNOWN",
            role: "ALTERNATIVE",
            why: "Existing-system access has not been established for this fixture.",
            blocker: null,
            switchCondition: "Evaluate if existing-system access can be granted."
          },
          {
            method: "Passive Capture",
            availability: "UNKNOWN",
            role: "ALTERNATIVE",
            why: "Passive observation point is Unknown.",
            blocker: null,
            switchCondition: "Evaluate if a non-invasive observation point exists."
          },
          {
            method: "Controlled Active Read",
            availability: "UNKNOWN",
            role: "ALTERNATIVE",
            why: "Active Read authorization is Unknown; it can never be assumed.",
            blocker: "NOT AUTHORIZED — active read requires its own explicit authorization.",
            switchCondition: "Only under a separate, explicit Active Read authorization."
          }
        ],
        supplementary: [
          {
            method: "Manual / Human Supplement",
            availability: "CONDITIONAL",
            why: "Engineer notes can validate imported addresses against field reality."
          }
        ],
        hasViableRoute: true,
        readiness: {
          status: "Ready",
          note: "HasViableRoute = true and an explicit next action exists: the engineer imports the engineering project export."
        },
        nextActionOwner: "Engineer (explicit next action: import engineering export)",
        investigations: [
          {
            field: "Existing System Access",
            status: "UNKNOWN",
            why: "Optional supplementary evidence from the running system.",
            affects: "Existing System / HMI",
            owner: "UNASSIGNED",
            evidence: "None"
          }
        ]
      }
    },

    /* Scenario C — Active Read authorization denied; passive observation present. */
    {
      id: "C",
      key: "C",
      label: "Scenario C",
      hint: "Passive only",
      title: "Active Read authorization denied · passive observation point present",
      banner: {
        kind: "warn",
        text: "Block Method, not Project — Controlled Active Read is blocked, but the scope remains viable via Passive Capture."
      },
      facts: {
        EngineeringSource:       "Unknown",
        EngineeringProjectFile:  "Unknown",
        AddressTable:            "Unknown",
        ExistingSystemAccess:    "Unknown",
        PassiveObservationPoint: "Present",
        ActiveReadAuthorization: "Absent",
        EthernetPath:            "Unknown",
        ProtocolIdentification:  "Unknown",
        AddressIdentification:   "Unknown"
      },
      strategy: {
        primary: {
          method: "Passive Capture",
          availability: "AVAILABLE",
          role: "PRIMARY",
          why: "A passive observation point is Present, enabling non-invasive, zero-transmit observation. Active Read authorization is Absent, so active read is blocked.",
          policyBasis: "Project-local provisional strategy (fixture snapshot aligned to R1).",
          switchCondition: "Switch to Engineering File Import if an engineering export becomes available."
        },
        alternatives: [
          {
            method: "Controlled Active Read",
            availability: "BLOCKED",
            role: "ALTERNATIVE",
            why: "Active Read authorization is explicitly Absent (denied).",
            blocker: "Active Read Authorization = Absent. Block Method, not Project.",
            switchCondition: "Only if a future, separate authorization is granted."
          },
          {
            method: "Engineering File",
            availability: "UNKNOWN",
            role: "ALTERNATIVE",
            why: "Engineering source / project file is Unknown.",
            blocker: null,
            switchCondition: "Evaluate if an engineering project export can be obtained."
          },
          {
            method: "Existing System / HMI",
            availability: "UNKNOWN",
            role: "ALTERNATIVE",
            why: "Existing-system access is Unknown.",
            blocker: null,
            switchCondition: "Evaluate if existing-system access can be granted."
          }
        ],
        supplementary: [
          {
            method: "Manual / Human Supplement",
            availability: "CONDITIONAL",
            why: "Engineer notes can enrich evidence while passive observation proceeds."
          }
        ],
        hasViableRoute: true,
        readiness: {
          status: "Ready",
          note: "Passive Capture is Primary / Available; the blocked Active Read method does not block the project scope."
        },
        nextActionOwner: "Engineer (explicit next action: configure non-invasive passive observation)",
        investigations: [
          {
            field: "Ethernet Path",
            status: "UNKNOWN",
            why: "The physical/logical observation point still needs to be confirmed.",
            affects: "Passive Capture",
            owner: "UNASSIGNED",
            evidence: "None"
          }
        ]
      }
    },

    /* Scenario D — no viable execution route. */
    {
      id: "D",
      key: "D",
      label: "Scenario D",
      hint: "No viable route",
      title: "No viable execution route",
      banner: {
        kind: "danger",
        text: "No fabricated route is shown. HasViableRoute = false and Actionable Readiness = Blocked until the blocking facts are resolved."
      },
      facts: {
        EngineeringSource:       "Absent",
        EngineeringProjectFile:  "Absent",
        AddressTable:            "Unknown",
        ExistingSystemAccess:    "Absent",
        PassiveObservationPoint: "Absent",
        ActiveReadAuthorization: "Absent",
        EthernetPath:            "Unknown",
        ProtocolIdentification:  "Unknown",
        AddressIdentification:   "Unknown"
      },
      strategy: {
        primary: {
          method: "Engineering File Import",
          availability: "BLOCKED",
          role: "PRIMARY",
          why: "Engineering source / project file is Absent, so the file import route is blocked.",
          policyBasis: "Project-local provisional strategy (fixture snapshot aligned to R1).",
          switchCondition: "Re-evaluate if any blocking fact is resolved."
        },
        alternatives: [
          {
            method: "Existing System / HMI",
            availability: "BLOCKED",
            role: "ALTERNATIVE",
            why: "Existing-system access is Absent.",
            blocker: "Existing System Access = Absent.",
            switchCondition: "Re-evaluate if access can be granted."
          },
          {
            method: "Passive Capture",
            availability: "BLOCKED",
            role: "ALTERNATIVE",
            why: "Passive observation point is Absent.",
            blocker: "Passive Observation Point = Absent.",
            switchCondition: "Re-evaluate if an observation point is identified."
          },
          {
            method: "Controlled Active Read",
            availability: "BLOCKED",
            role: "ALTERNATIVE",
            why: "Active Read authorization is Absent (denied).",
            blocker: "Active Read Authorization = Absent.",
            switchCondition: "Only if a future, separate authorization is granted."
          }
        ],
        supplementary: [
          {
            method: "Manual / Human Supplement",
            availability: "CONDITIONAL",
            why: "Manual walkdown can still record observations, but it cannot by itself form a viable execution route."
          }
        ],
        hasViableRoute: false,
        readiness: {
          status: "Blocked",
          note: "Exactly one non-viable Primary (Engineering File Import) and no Available/Conditional execution route. Blocking facts must be resolved first."
        },
        nextActionOwner: "UNASSIGNED",
        investigations: [
          {
            field: "Engineering Source",
            status: "ABSENT",
            why: "Without a source program or project export, file import cannot start.",
            affects: "Engineering File Import",
            owner: "UNASSIGNED",
            evidence: "None"
          },
          {
            field: "Existing System Access",
            status: "ABSENT",
            why: "Without existing-system access, the HMI/SCADA route cannot start.",
            affects: "Existing System / HMI",
            owner: "UNASSIGNED",
            evidence: "None"
          },
          {
            field: "Passive Observation Point",
            status: "ABSENT",
            why: "Without an observation point, passive capture cannot start.",
            affects: "Passive Capture",
            owner: "UNASSIGNED",
            evidence: "None"
          },
          {
            field: "Active Read Authorization",
            status: "ABSENT",
            why: "Active read is denied and must never be assumed.",
            affects: "Controlled Active Read",
            owner: "UNASSIGNED",
            evidence: "None"
          }
        ]
      }
    }
  ];

  /* Representative Data Requirements. */
  var REQUIREMENTS = [
    {
      id: "req-1",
      meaning: "Production Count",
      requirementType: "Direct candidate",
      status: "Open",
      note: "Expected to be a direct PLC point; purpose is production reporting."
    },
    {
      id: "req-2",
      meaning: "Machine Speed",
      requirementType: "Direct candidate",
      status: "Open",
      note: "Expected to be a direct PLC point; purpose is line speed monitoring."
    },
    {
      id: "req-3",
      meaning: "Run / Stop",
      requirementType: "Direct or Derived",
      status: "Open",
      note: "May be a direct state point or derived from speed/count evidence."
    },
    {
      id: "req-4",
      meaning: "Paper Number",
      requirementType: "Contextual",
      status: "Unknown source",
      note: "Contextual field; the PLC source is not yet identified."
    },
    {
      id: "req-5",
      meaning: "SKU / Spec",
      requirementType: "MES context",
      status: "Not assumed PLC truth",
      note: "SKU/spec is MES business context and is not assumed to be PLC point truth."
    }
  ];

  /* Fixture Evidence cards — visualization of the implemented R2A authority shape.
     The browser does not execute ingestion; no runtime EvidenceId is fabricated. */
  var EVIDENCE = [
    {
      id: "EV-001",
      type: "Engineering Project Export",
      provenance: "Fixture — simulated engineering export",
      observedTime: "2026-09-13 08:10 (fixture)",
      planRevision: "prototype snapshot — runtime-bound in R2A",
      session: "prototype snapshot — runtime-bound in R2A",
      limitation: "R2A canonical ingestion is implemented; this static card is not itself admitted evidence.",
      classification: "Fixture"
    },
    {
      id: "EV-002",
      type: "HMI Tag Export",
      provenance: "Fixture — simulated existing-system tag export",
      observedTime: "2026-09-13 08:22 (fixture)",
      planRevision: "prototype snapshot — runtime-bound in R2A",
      session: "prototype snapshot — runtime-bound in R2A",
      limitation: "R2 Existing System / HMI evidence path is implemented; this card remains prototype-only.",
      classification: "Fixture"
    },
    {
      id: "EV-003",
      type: "Engineer Observation",
      provenance: "Fixture — simulated engineer field note",
      observedTime: "2026-09-13 09:05 (fixture)",
      planRevision: "prototype snapshot — runtime-bound in R2A",
      session: "prototype snapshot — runtime-bound in R2A",
      limitation: "Manual notes are a valid evidence class; card is fixture only.",
      classification: "Fixture"
    },
    {
      id: "EV-004",
      type: "Protocol Observation",
      provenance: "Fixture — simulated protocol observation",
      observedTime: "2026-09-13 09:31 (fixture)",
      planRevision: "prototype snapshot — runtime-bound in R2A",
      session: "prototype snapshot — runtime-bound in R2A",
      limitation: "R3 replay-first passive evidence is implemented; this card remains prototype-only.",
      classification: "Fixture"
    },
    {
      id: "EV-005",
      type: "Manual Field Note",
      provenance: "Fixture — simulated manual field note",
      observedTime: "2026-09-13 09:48 (fixture)",
      planRevision: "prototype snapshot — runtime-bound in R2A",
      session: "prototype snapshot — runtime-bound in R2A",
      limitation: "Manual supplement evidence; card is fixture only.",
      classification: "Fixture"
    }
  ];

  /* Implemented canonical authority path, rendered here as a non-executing prototype explanation. */
  var EVIDENCE_AUTHORITY_PATH = [
    { label: "Source Adapter Payload" },
    { label: "R2A Normalize + Admission" },
    { label: "DiscoverySessionPlanBinding", detail: "Project + Device + exact Plan revision + Session" },
    { label: "Session-scoped normalized evidence / EvidenceTraceRef" },
    { label: "terminal DiscoverySession" },
    { label: "EvidencePackage" }
  ];

  /* Fixture candidates — the system did NOT infer these. */
  var CANDIDATES = [
    {
      id: "CAND-001",
      label: "Candidate #1",
      address: "DB10.DBD20",
      dataType: "REAL",
      meaning: "Machine Speed",
      evidence: ["EV-001", "EV-004"],
      conflict: "none",
      status: "Proposed",
      provenance: "Fixture candidate — not produced by an identification engine."
    },
    {
      id: "CAND-002",
      label: "Candidate #2",
      address: "UNKNOWN",
      dataType: "UNKNOWN",
      meaning: "Production Count",
      evidence: ["EV-003"],
      conflict: "source disagreement",
      status: "Proposed",
      provenance: "Fixture candidate — not produced by an identification engine."
    }
  ];

  /* Implemented bounded identification engines. The static prototype does not execute them. */
  var ENGINES = [
    {
      id: "DataTypeInference",
      label: "DataTypeInference",
      status: "DONE",
      contribution: "Bounded deterministic type inference from exact normalized evidence; Proposal only."
    },
    {
      id: "PatternAnalysis",
      label: "PatternAnalysis",
      status: "DONE",
      contribution: "Bounded pattern findings over exact session-bound evidence; Proposal only."
    },
    {
      id: "EventCorrelation",
      label: "EventCorrelation",
      status: "DONE",
      contribution: "Bounded temporal association findings; no causal inference."
    },
    {
      id: "TemplateMatching",
      label: "TemplateMatching",
      status: "DONE",
      contribution: "Project-local template matching; advisory only, no universal template authority."
    }
  ];

  /* Capability map — repository truth reflected in UX0.2. DONE does not imply
     live customer-network authorization or field validation. */
  var CAPABILITY_MAP = [
    { id: "Strategy",          label: "Adaptive Strategy",              slice: "R1",   status: "DONE", detail: "Vendor/protocol-neutral strategy + readiness." },
    { id: "EvidenceIngestion", label: "Canonical Evidence",             slice: "R2A",  status: "DONE", detail: "Exact Session-bound normalization/admission + EvidencePackage." },
    { id: "ExistingHmi",       label: "Existing System / HMI Evidence", slice: "R2",   status: "DONE", detail: "Offline existing-system evidence path." },
    { id: "Replay",            label: "Offline Replay",                 slice: "R3A",  status: "DONE", detail: "L0/L1/L3 replay/golden-fixture substrate." },
    { id: "PassiveCapture",    label: "Passive Evidence",               slice: "R3",   status: "DONE", detail: "Replay-first passive relation evidence; zero transmit." },
    { id: "ActiveRead",        label: "Controlled Active Read",         slice: "R4",   status: "DONE", detail: "Safety/orchestration exists; RP01 field execution NOT AUTHORIZED." },
    { id: "Identification",    label: "Identification Engines",         slice: "R5",   status: "DONE", detail: "R5A–D bounded Proposal engines." },
    { id: "Rp01E2E",           label: "RP01 Acceptance",                slice: "R6",   status: "DONE", detail: "Documentary/offline acceptance + real-evidence calibration." },
    { id: "PersistenceUi",     label: "Persistence / Thin Field UI",    slice: "R7",   status: "DONE", detail: "Local restart semantics + offline CLI foundation." },
    { id: "Delivery",          label: "Delivery Package / Export",      slice: "R8",   status: "DONE", detail: "Versioned DeliveryPackage + deterministic offline export." },
    { id: "EvidenceStrategy",  label: "Evidence → Strategy Projection", slice: "D4-A", status: "DONE", detail: "Canonical evidence conservatively projected into R1 facts." }
  ];

  /* Delivery preview — exporter is NOT implemented. */
  var DELIVERY = {
    banner: "Delivery capability implemented — prototype does not execute it",
    note: "R8 versioned DeliveryPackage and deterministic offline export exist in the repository. This static prototype only previews placement and never contacts a target system.",
    targets: ["SCADA", "OPC", "PI", "MES"],
    preview: [
      {
        meaning: "Machine Speed",
        address: "DB10.DBD20",
        type: "REAL",
        unit: "m/min",
        source: "Fixture candidate (Proposed)",
        status: "Preview"
      },
      {
        meaning: "Production Count",
        address: "UNKNOWN",
        type: "UNKNOWN",
        unit: "count",
        source: "Fixture candidate — address unresolved",
        status: "Preview / unresolved"
      },
      {
        meaning: "Run / Stop",
        address: "UNKNOWN",
        type: "UNKNOWN",
        unit: "state",
        source: "Fixture candidate — direct or derived",
        status: "Preview / unresolved"
      }
    ]
  };

  /* Device knowledge reuse preview. */
  var KNOWLEDGE = {
    deviceFamily: "UNKNOWN / fixture",
    reusable: [
      { id: "K-1", label: "possible speed pattern", note: "A recurring speed value pattern may indicate a speed point (fixture)." },
      { id: "K-2", label: "known address convention", note: "Address conventions observed on similar fixture devices (fixture)." },
      { id: "K-3", label: "engineering source relationship", note: "Which engineering artifacts correlate with discovered points (fixture)." }
    ],
    applicability: "Project-local / Evidence-scoped",
    review: "Engineer Reviewed",
    crossProjectStatus: "NOT FROZEN",
    pdxNote: "PDX-001 still blocks universal cross-project knowledge freeze."
  };

  /* Fixture recent projects shown in the Project Hub. In-memory prototype data
     only — no real files, no database, no persistence. */
  var RECENT_PROJECTS = [
    {
      id: "rp01-demo",
      name: "RP-01 Style Demo Project",
      site: "Demo Site (fixture)",
      description: "Fixture project for the ITDP product workbench prototype.",
      targets: ["SCADA", "OPC", "PI", "MES"],
      areas: ["Area 5", "Area 6"],
      lines: ["HT1 Line", "Demo Packaging Line", "Demo Tissue Line", "RP01 Calibration Cases"]
    },
    {
      id: "demo-packaging",
      name: "Demo Packaging Project",
      site: "Demo Site (fixture)",
      description: "Second fixture project used to demonstrate switching projects.",
      targets: ["SCADA", "OPC"],
      areas: ["Demo Area"],
      lines: ["Demo Packaging Line"]
    }
  ];

  var DEFAULT_PROJECT = RECENT_PROJECTS[0];

  /* Clarifies that the scenario switcher is a demo fixture input, not a
     production workflow concept and not a workflow stage. */
  var DEMO_SCENARIO_NOTE = "Demo-only fixture input. In production, Project facts + Device facts + Evidence drive the Strategy Engine. Engineers do not choose Scenario A/B/C/D in production.";

  /* Clarifies that the capability map is internal / display only. */
  var CAPABILITY_MAP_NOTE = "Repository capability truth for product judgment. DONE does not mean live customer-network authorization or field validation.";

  /* Per-stage action model. Status vocabulary:
     PROTOTYPE ACTION | FOUNDATION EXISTS | FUTURE | BLOCKED. */
  var STAGE_ACTIONS = {
    overview: [
      { id: "project-settings", label: "Project Settings", status: "PROTOTYPE ACTION", hint: "Open the prototype project settings drawer." },
      { id: "edit-device", label: "Edit Device", status: "PROTOTYPE ACTION", hint: "Edit the selected device's prototype-only identity." },
      { id: "add-device", label: "Add Device", status: "PROTOTYPE ACTION", hint: "Add a temporary in-memory device." },
      { id: "open-investigations", label: "Open Investigations", status: "FOUNDATION EXISTS", hint: "Review the current investigation items for the selected scenario." },
      { id: "continue-discovery", label: "Continue Discovery", status: "FOUNDATION EXISTS", hint: "Navigate to the Discovery Strategy stage." }
    ],
    requirements: [
      { id: "add-requirement", label: "Add Requirement", status: "PROTOTYPE ACTION", hint: "Add a temporary in-memory data requirement." },
      { id: "edit-requirement", label: "Edit Requirement", status: "PROTOTYPE ACTION", hint: "Edit a prototype requirement's meaning or type." },
      { id: "import-requirement-list", label: "Import Requirement List", status: "FUTURE", hint: "Future capability. No file is read in this prototype.", future: true },
      { id: "classify-requirement", label: "Classify Requirement", status: "PROTOTYPE ACTION", hint: "Set a prototype requirement type (Direct / Derived / Contextual / Unknown)." },
      { id: "assign-to-device", label: "Assign to Device", status: "PROTOTYPE ACTION", hint: "Assign a requirement to the selected device (prototype-only)." }
    ],
    strategy: [
      { id: "inspect-why", label: "Inspect Why", status: "FOUNDATION EXISTS", hint: "Open the Primary route rationale, policy basis, and alternatives." },
      { id: "resolve-unknowns", label: "Resolve Unknowns", status: "FOUNDATION EXISTS", hint: "Focus the Investigation Items." },
      { id: "re-evaluate-strategy", label: "Re-evaluate Strategy", status: "PROTOTYPE ACTION", hint: "The real R1 engine exists; this static prototype only re-displays a snapshot and does not execute Domain code." },
      { id: "create-discovery-plan", label: "Create Discovery Plan", status: "FOUNDATION EXISTS", hint: "Formal DiscoveryPlan exists in the Domain foundation. This prototype does not create authoritative Plan revisions." }
    ],
    evidence: [
      { id: "add-evidence", label: "Add Evidence", status: "PROTOTYPE ACTION", hint: "Open the Add Evidence chooser (blueprint only)." },
      { id: "add-engineer-observation", label: "Add Engineer Observation", status: "PROTOTYPE ACTION", hint: "Add a prototype-only evidence card. Fixture / Prototype only, not admitted through R2A." },
      { id: "import-engineering-file", label: "Import Engineering File", status: "FOUNDATION EXISTS", hint: "R2A canonical ingestion exists; a concrete engineering-file parser is adapter-specific and this prototype reads no file." },
      { id: "add-hmi-export", label: "Add HMI Export", status: "FOUNDATION EXISTS", hint: "R2 existing-system evidence path exists; this prototype performs no import." },
      { id: "review-session-binding", label: "Review Session Binding", status: "FOUNDATION EXISTS", hint: "Show DiscoverySessionPlanBinding (Project + Device + exact Plan revision + Session)." },
      { id: "inspect-provenance", label: "Inspect Provenance", status: "FOUNDATION EXISTS", hint: "Open an evidence card's provenance." }
    ],
    candidates: [
      { id: "run-identification", label: "Run Identification", status: "FOUNDATION EXISTS", hint: "R5A–D engines exist; this static prototype does not execute them." },
      { id: "compare-candidates", label: "Compare Candidates", status: "PROTOTYPE ACTION", hint: "Compare Candidate #1 / #2 side by side." },
      { id: "view-evidence", label: "View Evidence", status: "FOUNDATION EXISTS", hint: "Open the evidence behind the selected candidate." },
      { id: "request-more-evidence", label: "Request More Evidence", status: "PROTOTYPE ACTION", hint: "Mark the selected candidate as Needs More Evidence (prototype-only) and jump to Evidence." },
      { id: "send-to-confirmation", label: "Send to Confirmation", status: "FOUNDATION EXISTS", hint: "Navigate to Confirmation with the selected candidate." }
    ],
    confirmation: [
      { id: "accept-candidate", label: "Accept", status: "PROTOTYPE ACTION", hint: "Engineer authority — prototype action, no Domain persistence." },
      { id: "reject-candidate", label: "Reject", status: "PROTOTYPE ACTION", hint: "Engineer authority — prototype action, no Domain persistence." },
      { id: "need-more-evidence", label: "Need More Evidence", status: "PROTOTYPE ACTION", hint: "Engineer authority — prototype action, no Domain persistence." }
    ],
    delivery: [
      { id: "preview-delivery", label: "Preview Delivery", status: "PROTOTYPE ACTION", hint: "Show the fixture delivery preview." },
      { id: "validate-delivery", label: "Validate Delivery", status: "PROTOTYPE ACTION", hint: "Show a fixture validation checklist preview." },
      { id: "create-delivery-package", label: "Create Delivery Package", status: "FOUNDATION EXISTS", hint: "DeliveryPackage is a Domain concept; this prototype does not create a real package." },
      { id: "export", label: "Export", status: "FOUNDATION EXISTS", hint: "R8 deterministic offline export exists; this prototype does not execute it or contact target systems." }
    ],
    knowledge: [
      { id: "review-knowledge", label: "Review Knowledge", status: "PROTOTYPE ACTION", hint: "Review the reusable knowledge items (prototype-only)." },
      { id: "promote-to-knowledge", label: "Promote to Knowledge", status: "PROTOTYPE ACTION", hint: "Prototype promotion preview only. Cross-project applicability remains NOT FROZEN." },
      { id: "reject-reuse", label: "Reject Reuse", status: "PROTOTYPE ACTION", hint: "Mark a knowledge item as rejected for this prototype context." },
      { id: "set-applicability", label: "Set Applicability", status: "PROTOTYPE ACTION", hint: "Set applicability to Project-local / Evidence-scoped (prototype-only)." },
      { id: "view-provenance", label: "View Provenance", status: "FOUNDATION EXISTS", hint: "View the evidence provenance behind a knowledge item." }
    ]
  };

  /* Explanatory content for FUTURE actions (Future Action Drawer). */
  var FUTURE_ACTION_DETAILS = {
    "import-requirement-list": {
      slice: "R7A (import UX)",
      what: "Read a requirement list document and create draft DataRequirement items under a Project.",
      exists: "DataRequirement foundation exists. No file is read in this prototype."
    },
    "import-engineering-file": {
      slice: "R2A + source-specific adapter",
      status: "FOUNDATION EXISTS",
      what: "Admit an authorized source payload into exact Session-bound canonical evidence. A concrete engineering-file parser remains source-specific.",
      exists: "R2A normalization/admission and EvidencePackage authority are implemented. This prototype reads no file."
    },
    "add-hmi-export": {
      slice: "R2",
      status: "FOUNDATION EXISTS",
      what: "Consume an authorized Existing System / HMI export into the canonical evidence path.",
      exists: "R2 exists in the repository. This prototype performs no import."
    },
    "run-identification": {
      slice: "R5A–R5D",
      status: "FOUNDATION EXISTS",
      what: "Run bounded DataTypeInference, PatternAnalysis, EventCorrelation and project-local TemplateMatching over exact evidence.",
      exists: "All four engines are implemented and produce proposals/advisory findings only. No algorithm runs in this static prototype."
    },
    "export": {
      slice: "R8",
      status: "FOUNDATION EXISTS",
      what: "Create/version/freeze/issue a DeliveryPackage and produce deterministic offline export.",
      exists: "R8 is implemented. This static prototype creates no real package and contacts no target system."
    }
  };

  return {
    WARNINGS: WARNINGS,
    WORKFLOW_STAGES: WORKFLOW_STAGES,
    ACTIONS: ACTIONS,
    PROJECT_TREE: PROJECT_TREE,
    DEVICES: DEVICES,
    CALIBRATION_CASES: CALIBRATION_CASES,
    PROJECT_WORKSPACES: PROJECT_WORKSPACES,
    FACT_FIELDS: FACT_FIELDS,
    SCENARIOS: SCENARIOS,
    REQUIREMENTS: REQUIREMENTS,
    EVIDENCE: EVIDENCE,
    EVIDENCE_AUTHORITY_PATH: EVIDENCE_AUTHORITY_PATH,
    CANDIDATES: CANDIDATES,
    ENGINES: ENGINES,
    CAPABILITY_MAP: CAPABILITY_MAP,
    DELIVERY: DELIVERY,
    KNOWLEDGE: KNOWLEDGE,
    RECENT_PROJECTS: RECENT_PROJECTS,
    DEFAULT_PROJECT: DEFAULT_PROJECT,
    DEMO_SCENARIO_NOTE: DEMO_SCENARIO_NOTE,
    CAPABILITY_MAP_NOTE: CAPABILITY_MAP_NOTE,
    STAGE_ACTIONS: STAGE_ACTIONS,
    FUTURE_ACTION_DETAILS: FUTURE_ACTION_DETAILS
  };
})();
