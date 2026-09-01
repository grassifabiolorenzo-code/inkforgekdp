/**
 * RBAC del back office admin — unica fonte di verità per i permessi.
 * Usato sia server-side (obbligatorio: ogni server function admin chiama `can()`
 * prima di eseguire qualunque operazione) sia client-side (solo per mostrare/
 * nascondere controlli — mai come unica protezione).
 */

export const ADMIN_ROLES = ["viewer", "support", "admin", "super_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_RESOURCES = [
  "users",
  "subscriptions",
  "payments",
  "plans",
  "features",
  "settings",
  "analytics",
  "audit_logs",
  "system",
  "administrators",
  "referrals",
] as const;
export type AdminResource = (typeof ADMIN_RESOURCES)[number];

export type AdminAction = "read" | "write" | "delete";

type Matrix = Record<AdminRole, Partial<Record<AdminResource, AdminAction[]>>>;

/**
 * Matrice permessi. "administrators" (gestione di altri admin) è riservata al
 * SUPER_ADMIN: nessun ADMIN può auto-promuoversi o gestire altri admin.
 * "plans" write per ADMIN copre limiti/attivazione, non il prezzo (vedi
 * adminPlans.functions.ts: il prezzo reale è quello configurato su Lemon
 * Squeezy, qui è editabile solo dal SUPER_ADMIN e con avviso esplicito).
 */
const MATRIX: Matrix = {
  super_admin: {
    users: ["read", "write", "delete"],
    subscriptions: ["read", "write"],
    payments: ["read", "write"],
    plans: ["read", "write", "delete"],
    features: ["read", "write", "delete"],
    settings: ["read", "write"],
    analytics: ["read"],
    audit_logs: ["read"],
    system: ["read"],
    administrators: ["read", "write", "delete"],
    referrals: ["read", "write", "delete"],
  },
  admin: {
    users: ["read", "write"],
    subscriptions: ["read", "write"],
    payments: ["read", "write"],
    plans: ["read", "write"],
    features: ["read", "write"],
    settings: ["read"],
    analytics: ["read"],
    audit_logs: ["read"],
    system: ["read"],
    referrals: ["read", "write"],
  },
  support: {
    users: ["read", "write"],
    subscriptions: ["read"],
    payments: ["read"],
    plans: ["read"],
    features: ["read"],
    analytics: ["read"],
    audit_logs: ["read"],
    referrals: ["read"],
  },
  viewer: {
    users: ["read"],
    subscriptions: ["read"],
    payments: ["read"],
    plans: ["read"],
    features: ["read"],
    analytics: ["read"],
    audit_logs: ["read"],
    system: ["read"],
    referrals: ["read"],
  },
};

/** Un utente normale (nessuna riga in admin_roles) non ha alcun accesso admin. */
export function can(
  role: AdminRole | null | undefined,
  resource: AdminResource,
  action: AdminAction,
): boolean {
  if (!role) return false;
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

/** Un ruolo può accedere almeno in lettura ad almeno una sezione: è considerato "admin". */
export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Protezione anti privilege-escalation: chi può assegnare quali ruoli.
 * Solo SUPER_ADMIN gestisce amministratori, e non può degradare se stesso se è
 * l'ultimo super_admin rimasto (controllo aggiuntivo lato server).
 */
export function canAssignRole(
  actingRole: AdminRole | null | undefined,
  targetRole: AdminRole,
): boolean {
  if (actingRole !== "super_admin") return false;
  return ADMIN_ROLES.includes(targetRole);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  viewer: "Viewer",
};
