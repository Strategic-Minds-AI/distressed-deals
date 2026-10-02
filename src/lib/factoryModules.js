/**
 * The 50 Universal Master Factory modules — nav config, routes, build status.
 * Built modules have `built: true` and a real page component.
 * Queued modules have `built: false` and route to QueuedModule (honest status, not a fake stub).
 */

export const MODULES = [
  // ── Command ──
  { id: 1, name: "Command Center", path: "/factory", group: "Command", icon: "LayoutDashboard", built: true },
  { id: 2, name: "Projects / Intake", path: "/factory/projects", group: "Command", icon: "FolderKanban", built: true },
  { id: 47, name: "Approvals", path: "/factory/approvals", group: "Command", icon: "ShieldCheck", built: true },
  { id: 46, name: "Run Console", path: "/factory/runs", group: "Command", icon: "Terminal", built: true },
  { id: 48, name: "Audit / Receipts", path: "/factory/audit", group: "Command", icon: "ScrollText", built: true },

  // ── Registries (13) ──
  { id: 3, name: "Capability Registry", path: "/factory/capabilities", group: "Registries", icon: "Boxes", built: true },
  { id: 4, name: "Template Registry", path: "/factory/templates", group: "Registries", icon: "LayoutTemplate", built: false },
  { id: 5, name: "Generator Registry", path: "/factory/generators", group: "Registries", icon: "Cog", built: false },
  { id: 6, name: "Industry Pack Registry", path: "/factory/industry-packs", group: "Registries", icon: "Package", built: false },
  { id: 7, name: "Adapter Registry", path: "/factory/adapters", group: "Registries", icon: "Plug", built: false },
  { id: 8, name: "Workflow Registry", path: "/factory/workflows", group: "Registries", icon: "Workflow", built: false },
  { id: 9, name: "Policy Registry", path: "/factory/policies", group: "Registries", icon: "Scale", built: false },
  { id: 10, name: "Validation Profiles", path: "/factory/validation-profiles", group: "Registries", icon: "CheckCircle", built: false },
  { id: 11, name: "Quality Profiles", path: "/factory/quality-profiles", group: "Registries", icon: "BadgeCheck", built: false },
  { id: 12, name: "Provisioning Profiles", path: "/factory/provisioning-profiles", group: "Registries", icon: "CloudUpload", built: false },
  { id: 13, name: "Runtime Profiles", path: "/factory/runtime-profiles", group: "Registries", icon: "Server", built: false },
  { id: 14, name: "Release Profiles", path: "/factory/release-profiles", group: "Registries", icon: "Rocket", built: false },
  { id: 15, name: "Monetization Profiles", path: "/factory/monetization-profiles", group: "Registries", icon: "DollarSign", built: false },

  // ── Factories (3) ──
  { id: 16, name: "Frontend Factory", path: "/factory/frontend", group: "Factories", icon: "Monitor", built: false },
  { id: 17, name: "Generator Factory", path: "/factory/generator", group: "Factories", icon: "Cog", built: false },
  { id: 18, name: "AI Consulting Factory", path: "/factory/ai-consulting", group: "Factories", icon: "Brain", built: false },

  // ── Kernels (5) ──
  { id: 20, name: "SaaS / Tenancy Kernel", path: "/factory/saas", group: "Kernels", icon: "Building", built: false },
  { id: 21, name: "Identity / Auth Kernel", path: "/factory/identity", group: "Kernels", icon: "KeyRound", built: false },
  { id: 22, name: "Monetization Kernel", path: "/factory/monetization", group: "Kernels", icon: "DollarSign", built: false },
  { id: 23, name: "API Architecture Kernel", path: "/factory/api", group: "Kernels", icon: "Code", built: false },
  { id: 24, name: "Database Pattern Kernel", path: "/factory/database", group: "Kernels", icon: "Database", built: false },

  // ── Centers (14) ──
  { id: 19, name: "Provisioning Center", path: "/factory/provisioning", group: "Centers", icon: "CloudUpload", built: false },
  { id: 25, name: "Integration Center", path: "/factory/integrations", group: "Centers", icon: "Plug", built: false },
  { id: 26, name: "Sync / Reconciliation", path: "/factory/sync", group: "Centers", icon: "RefreshCw", built: false },
  { id: 27, name: "Migration Center", path: "/factory/migration", group: "Centers", icon: "Move", built: false },
  { id: 28, name: "Testing Factory", path: "/factory/testing", group: "Centers", icon: "FlaskConical", built: false },
  { id: 29, name: "Validation Center", path: "/factory/validation", group: "Centers", icon: "CheckCircle", built: false },
  { id: 30, name: "Repair Center", path: "/factory/repair", group: "Centers", icon: "Wrench", built: false },
  { id: 31, name: "Observability / SRE", path: "/factory/observability", group: "Centers", icon: "Activity", built: false },
  { id: 32, name: "Backup / DR", path: "/factory/backup", group: "Centers", icon: "Archive", built: false },
  { id: 33, name: "AI Runtime Center", path: "/factory/ai-runtime", group: "Centers", icon: "Brain", built: false },
  { id: 34, name: "Memory / Knowledge", path: "/factory/memory", group: "Centers", icon: "BookOpen", built: false },
  { id: 35, name: "Communications", path: "/factory/comms", group: "Centers", icon: "MessageSquare", built: false },
  { id: 36, name: "Analytics / Experimentation", path: "/factory/analytics", group: "Centers", icon: "BarChart", built: false },
  { id: 37, name: "Search Center", path: "/factory/search", group: "Centers", icon: "Search", built: false },

  // ── Capabilities (7) ──
  { id: 38, name: "Mobile / PWA", path: "/factory/mobile", group: "Capabilities", icon: "Smartphone", built: false },
  { id: 39, name: "Commerce / Marketplace", path: "/factory/commerce", group: "Capabilities", icon: "ShoppingCart", built: false },
  { id: 40, name: "CRM / Sales", path: "/factory/crm", group: "Capabilities", icon: "Users", built: false },
  { id: 41, name: "Customer Success", path: "/factory/success", group: "Capabilities", icon: "HeartHandshake", built: false },
  { id: 42, name: "CMS / Content", path: "/factory/cms", group: "Capabilities", icon: "FileText", built: false },
  { id: 43, name: "Localization", path: "/factory/localization", group: "Capabilities", icon: "Globe", built: false },
  { id: 44, name: "Privacy / Governance", path: "/factory/privacy", group: "Capabilities", icon: "Shield", built: false },

  // ── System ──
  { id: 45, name: "Artifact Explorer", path: "/factory/artifacts", group: "System", icon: "FolderSearch", built: true },
  { id: 49, name: "Usage / Budgets", path: "/factory/usage", group: "System", icon: "Gauge", built: false },
  { id: 50, name: "Settings", path: "/factory/settings", group: "System", icon: "Settings", built: true },
];

export const MODULE_GROUPS = ["Command", "Registries", "Factories", "Kernels", "Centers", "Capabilities", "System"];

export function builtModules() {
  return MODULES.filter((m) => m.built);
}

export function queuedModules() {
  return MODULES.filter((m) => !m.built);
}

export function moduleByPath(path) {
  return MODULES.find((m) => m.path === path);
}