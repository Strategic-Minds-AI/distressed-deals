/**
 * Governance — approval-gated protected actions.
 * Default allowed: READ, ANALYZE, PLAN, DRAFT, SANDBOX_BUILD, BRANCH_PREVIEW, TEST, VALIDATE, REPAIR, PACKAGE.
 * Protected: production deployment, DNS/domain, DB/RLS migration, secrets, payments, permissions, external accounts, public publishing, destructive, irreversible migrations.
 */

export type ActionType =
  | "production_deployment"
  | "dns_domain"
  | "db_migration"
  | "secret_change"
  | "payment_spend"
  | "permission_escalation"
  | "external_account"
  | "public_publish"
  | "destructive"
  | "irreversible_migration"
  | "provisioning";

export const PROTECTED_ACTIONS: ActionType[] = [
  "production_deployment",
  "dns_domain",
  "db_migration",
  "secret_change",
  "payment_spend",
  "permission_escalation",
  "external_account",
  "public_publish",
  "destructive",
  "irreversible_migration",
  "provisioning",
];

export const ALLOWED_BY_DEFAULT = [
  "READ",
  "ANALYZE",
  "PLAN",
  "DRAFT",
  "SANDBOX_BUILD",
  "BRANCH_PREVIEW",
  "TEST",
  "VALIDATE",
  "REPAIR",
  "PACKAGE",
] as const;

export function isProtected(action: ActionType): boolean {
  return PROTECTED_ACTIONS.includes(action);
}

export function requiresApproval(action: ActionType): boolean {
  return isProtected(action);
}

export function actionLabel(action: ActionType): string {
  const labels: Record<ActionType, string> = {
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
  return labels[action] ?? action;
}