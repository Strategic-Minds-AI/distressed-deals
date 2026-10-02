/**
 * Registry helpers — family list, kind list, label formatting.
 * The 30 registry families and 13 meta-definition kinds are the canonical
 * capability set. New capability types are added through meta-schemas, not runtime rewrites.
 */

export const REGISTRY_FAMILIES = [
  "saas_tenancy_templates",
  "monetization_templates",
  "identity_auth_templates",
  "api_architecture_templates",
  "database_patterns",
  "integration_patterns",
  "sync_reconciliation_patterns",
  "migration_patterns",
  "release_patterns",
  "testing_profiles",
  "observability_sre_templates",
  "backup_dr_templates",
  "ai_runtime_templates",
  "memory_knowledge_templates",
  "workflow_grammar",
  "communications_templates",
  "analytics_experimentation_templates",
  "search_templates",
  "mobile_pwa_capability_templates",
  "commerce_marketplace_kernels",
  "crm_sales_kernels",
  "customer_success_support",
  "cms_content_templates",
  "localization_templates",
  "privacy_governance_templates",
  "file_media_processing_templates",
  "scheduling_resource_templates",
  "permissions_audit_templates",
  "quality_security_templates",
  "industry_packs",
] as const;

export const META_DEFINITION_KINDS = [
  "capability",
  "template",
  "generator",
  "industry_pack",
  "adapter",
  "workflow",
  "policy",
  "validation_profile",
  "quality_profile",
  "provisioning_profile",
  "runtime_profile",
  "release_profile",
  "monetization_profile",
] as const;

export function familyLabel(family: string): string {
  return family
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function kindLabel(kind: string): string {
  return kind
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildSearchText(entry: { entry_id?: string; name?: string; family?: string; purpose?: string; notes?: string }): string {
  return [entry.entry_id, entry.name, entry.family, entry.purpose, entry.notes].filter(Boolean).join(" ").toLowerCase();
}