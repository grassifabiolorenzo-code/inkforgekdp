import { describe, expect, it } from "vitest";

import { ADMIN_ROLES, canAssignRole, can, isAdminRole, type AdminRole } from "./adminRbac";

describe("adminRbac.can", () => {
  it("un utente normale (nessun ruolo) non ha accesso a nessuna sezione admin", () => {
    expect(can(null, "users", "read")).toBe(false);
    expect(can(undefined, "system", "read")).toBe(false);
  });

  it("solo super_admin può leggere/scrivere/eliminare la sezione administrators", () => {
    for (const role of ADMIN_ROLES) {
      const expected = role === "super_admin";
      expect(can(role, "administrators", "read")).toBe(expected);
      expect(can(role, "administrators", "write")).toBe(expected);
      expect(can(role, "administrators", "delete")).toBe(expected);
    }
  });

  it("viewer ha solo permessi di lettura, mai write o delete, su nessuna risorsa", () => {
    const resources = [
      "users",
      "subscriptions",
      "payments",
      "plans",
      "features",
      "settings",
      "analytics",
      "audit_logs",
      "system",
    ] as const;
    for (const resource of resources) {
      expect(can("viewer", resource, "write")).toBe(false);
      expect(can("viewer", resource, "delete")).toBe(false);
    }
  });

  it("support può leggere e scrivere utenti (per sospendere/riattivare account) ma non gestire piani o admin", () => {
    expect(can("support", "users", "read")).toBe(true);
    expect(can("support", "users", "write")).toBe(true);
    expect(can("support", "users", "delete")).toBe(false);
    expect(can("support", "settings", "read")).toBe(false);
    expect(can("support", "administrators", "read")).toBe(false);
  });

  it("solo super_admin può eliminare utenti", () => {
    for (const role of ADMIN_ROLES) {
      expect(can(role, "users", "delete")).toBe(role === "super_admin");
    }
  });

  it("ogni ruolo admin può almeno leggere i referral (visibilità minima sul programma)", () => {
    for (const role of ADMIN_ROLES) {
      expect(can(role, "referrals", "read")).toBe(true);
    }
  });

  it("solo admin e super_admin possono agire sui referral (sospendere, segnare chargeback)", () => {
    expect(can("viewer", "referrals", "write")).toBe(false);
    expect(can("support", "referrals", "write")).toBe(false);
    expect(can("admin", "referrals", "write")).toBe(true);
    expect(can("super_admin", "referrals", "write")).toBe(true);
  });
});

describe("adminRbac.canAssignRole", () => {
  it("nessun ruolo diverso da super_admin può assegnare ruoli admin (blocca l'auto-promozione di un ADMIN)", () => {
    const nonSuperAdminRoles: (AdminRole | null | undefined)[] = [
      "admin",
      "support",
      "viewer",
      null,
      undefined,
    ];
    for (const actingRole of nonSuperAdminRoles) {
      for (const target of ADMIN_ROLES) {
        expect(canAssignRole(actingRole, target)).toBe(false);
      }
    }
  });

  it("super_admin può assegnare qualunque ruolo, incluso un altro super_admin", () => {
    for (const target of ADMIN_ROLES) {
      expect(canAssignRole("super_admin", target)).toBe(true);
    }
  });
});

describe("adminRbac.isAdminRole", () => {
  it("riconosce solo i ruoli validi della matrice RBAC", () => {
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole("SUPER_ADMIN")).toBe(false);
  });
});
