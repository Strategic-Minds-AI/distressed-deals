/**
 * Frontend helpers for the factory — registry family list, kind list, label formatting,
 * and action-type labels. Mirrors base44/shared/registry.ts and governance.ts for client use.
 */

export const REGISTRY_FAMILIES = [
  "saas_tenancy_templates", "monetization_templates", "identity_auth_templates",
  "api_architecture_templates", "database_patterns", "integration_patterns",
  "sync_reconciliation_patterns", "migration_patterns", "release_patterns",
  "testing_profiles", "observability_sre_templates", "backup_dr_templates",
  "ai_runtime_templates", "memory_knowledge_templates", "workflow_grammar",
  "communications_templates", "analytics_experimentation_templates",
  "search_templates", "mobile_pwa_capability_templates",
  "commerce_marketplace_kernels", "crm_sales_kernels", "customer_success_support",
  "cms_content_templates", "localization_templates", "privacy_governance_templates",
  "file_media_processing_templates", "scheduling_resource_templates",
  "permissions_audit_templates", "quality_security_templates", "industry_packs",
];

export const META_DEFINITION_KINDS = [
  "capability", "template", "generator", "industry_pack", "adapter",
  "workflow", "policy", "validation_profile", "quality_profile",
  "provisioning_profile", "runtime_profile", "release_profile", "monetization_profile",
];

export function familyLabel(family) {
  return family.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function kindLabel(kind) {
  return kind.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export const ACTION_LABELS = {
  production_deployment: "Production Deployment",
  dns_domain: "DNS / Domain Mutation",
  db_migration: "Production DB / Schema / RLS Migration",
  secret_change: "Secret / Environment Variable Change",
  payment_spend: "Payment / Spend",
  permission_escalation: "Permission Escalation",
  external_account: "External Account Creation",
  public_publish: "Public Publishing",
  destructive: "Destructive Deletion / Transfer",
  irreversible_migration: "Irreversible Migration",
  provisioning: "Paid Provisioning",
};