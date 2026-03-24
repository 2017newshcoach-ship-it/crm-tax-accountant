import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { hashPassword } from "./crypto.tsx";

// Tenant data shape
export interface TenantBranding {
  primaryColor: string;
  buttonColor: string;
  loginBgUrl: string;
  logoUrl: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  ownerUsername: string;
  branding: TenantBranding;
  createdAt: string;
}

/**
 * Validates tenant slug format.
 * Allowed: lowercase letters, digits, hyphens. Length: 3-20.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,20}$/.test(slug);
}

/**
 * Extracts the tenant slug from the X-Tenant-ID request header.
 */
export function getTenantSlug(c: any): string | null {
  return c.req.header('X-Tenant-ID') || null;
}

/**
 * Returns true when the request carries a valid super-admin key.
 */
export function isSuperAdmin(c: any): boolean {
  const key = c.req.header('X-Super-Admin-Key');
  const SUPER_ADMIN_KEY = Deno.env.get('SUPER_ADMIN_KEY') || '';
  return SUPER_ADMIN_KEY !== '' && key === SUPER_ADMIN_KEY;
}

// ===== TENANT ROUTES =====

export function createTenantRouter(): Hono {
  const router = new Hono();

  // GET /make-server-9e65d886/tenant/:slug/config
  // Public — no authentication required. Returns branding config for the tenant.
  router.get("/make-server-9e65d886/tenant/:slug/config", async (c) => {
    try {
      const slug = c.req.param("slug");
      const tenant = await kv.get(`tenant:${slug}`);

      if (!tenant) {
        return c.json({ error: "Tenant not found" }, 404);
      }

      // Return only safe, public-facing fields
      const publicConfig = {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding,
      };

      return c.json({ tenant: publicConfig });
    } catch (error) {
      console.error("[TENANT CONFIG] Error:", error);
      return c.json({ error: "Failed to fetch tenant config" }, 500);
    }
  });

  // POST /make-server-9e65d886/admin/tenants
  // Super admin only. Creates a new tenant and its owner account.
  router.post("/make-server-9e65d886/admin/tenants", async (c) => {
    try {
      if (!isSuperAdmin(c)) {
        return c.json({ error: "Forbidden - Super admin access required" }, 403);
      }

      const body = await c.req.json();
      const { slug, name } = body;

      if (!slug || !name) {
        return c.json({
          error: "slug and name are required",
        }, 400);
      }

      // Validate slug format
      if (!isValidSlug(slug)) {
        return c.json({
          error: "slug must be 3-20 characters: lowercase letters, digits, hyphens only",
        }, 400);
      }

      // Check for duplicate slug
      const existing = await kv.get(`tenant:${slug}`);
      if (existing) {
        return c.json({ error: "Tenant slug already exists" }, 409);
      }

      const now = new Date().toISOString();

      // Create tenant (owner will be set when first user signs up)
      const tenant: Tenant = {
        id: crypto.randomUUID(),
        slug,
        name,
        ownerUsername: '',
        branding: {
          primaryColor: "#3182F6",
          buttonColor: "#000000",
          loginBgUrl: "",
          logoUrl: "",
        },
        createdAt: now,
      };
      await kv.set(`tenant:${slug}`, tenant);

      console.log(`[TENANT CREATE] Created tenant "${slug}"`);

      return c.json({ tenant }, 201);
    } catch (error) {
      console.error("[TENANT CREATE] Error:", error);
      return c.json({ error: "Failed to create tenant" }, 500);
    }
  });

  // GET /make-server-9e65d886/admin/tenants
  // Super admin only. Lists all tenants with per-tenant user counts.
  router.get("/make-server-9e65d886/admin/tenants", async (c) => {
    try {
      if (!isSuperAdmin(c)) {
        return c.json({ error: "Forbidden - Super admin access required" }, 403);
      }

      const tenants = await kv.getByPrefix("tenant:");
      const allUsers = await kv.getByPrefix("user:");

      const tenantsWithCounts = tenants.map((tenant: Tenant) => {
        const userCount = allUsers.filter(
          (u: any) => u.tenantSlug === tenant.slug
        ).length;
        return { ...tenant, userCount };
      });

      return c.json({ tenants: tenantsWithCounts });
    } catch (error) {
      console.error("[TENANT LIST] Error:", error);
      return c.json({ error: "Failed to fetch tenants" }, 500);
    }
  });

  // PUT /make-server-9e65d886/tenant/:slug/branding
  // Tenant owner only. Updates branding settings for the tenant.
  router.put("/make-server-9e65d886/tenant/:slug/branding", async (c) => {
    try {
      const slug = c.req.param("slug");
      const requestingUser = c.req.header('X-User-ID');
      const requestingTenant = c.req.header('X-Tenant-ID');

      if (!requestingUser || !requestingTenant) {
        return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
      }

      // Tenant slug in path must match the caller's tenant
      if (requestingTenant !== slug) {
        return c.json({ error: "Forbidden - Tenant mismatch" }, 403);
      }

      const tenant = await kv.get(`tenant:${slug}`);
      if (!tenant) {
        return c.json({ error: "Tenant not found" }, 404);
      }

      // Only the owner may update branding
      if (tenant.ownerUsername !== requestingUser) {
        return c.json({ error: "Forbidden - Only tenant owner can update branding" }, 403);
      }

      const body = await c.req.json();
      const { primaryColor, buttonColor, loginBgUrl, logoUrl, name } = body;

      const updatedTenant: Tenant = {
        ...tenant,
        name: name ?? tenant.name,
        branding: {
          primaryColor: primaryColor ?? tenant.branding.primaryColor,
          buttonColor: buttonColor ?? tenant.branding.buttonColor,
          loginBgUrl: loginBgUrl ?? tenant.branding.loginBgUrl,
          logoUrl: logoUrl ?? tenant.branding.logoUrl,
        },
      };

      await kv.set(`tenant:${slug}`, updatedTenant);

      return c.json({ tenant: updatedTenant });
    } catch (error) {
      console.error("[TENANT BRANDING] Error:", error);
      return c.json({ error: "Failed to update branding" }, 500);
    }
  });

  // DELETE /make-server-9e65d886/admin/tenants/:slug
  // Super admin only. Deletes a tenant and clears tenantSlug from associated users.
  router.delete("/make-server-9e65d886/admin/tenants/:slug", async (c) => {
    try {
      if (!isSuperAdmin(c)) {
        return c.json({ error: "Forbidden - Super admin access required" }, 403);
      }

      const slug = c.req.param("slug");
      const tenant = await kv.get(`tenant:${slug}`);
      if (!tenant) {
        return c.json({ error: "Tenant not found" }, 404);
      }

      // Delete tenant record
      await kv.del(`tenant:${slug}`);

      // Clear tenantSlug from associated users
      const allUsers = await kv.getByPrefix("user:");
      for (const user of allUsers) {
        if (user.tenantSlug === slug) {
          await kv.set(`user:${user.username}`, { ...user, tenantSlug: null });
        }
      }

      console.log(`[TENANT DELETE] Deleted tenant "${slug}"`);
      return c.json({ success: true });
    } catch (error) {
      console.error("[TENANT DELETE] Error:", error);
      return c.json({ error: "Failed to delete tenant" }, 500);
    }
  });

  // POST /make-server-9e65d886/admin/migrate
  // Super admin only. Migrates legacy data (no tenantSlug) to a target tenant.
  // Idempotent — safe to run multiple times.
  router.post("/make-server-9e65d886/admin/migrate", async (c) => {
    try {
      if (!isSuperAdmin(c)) {
        return c.json({ error: "Forbidden - Super admin access required" }, 403);
      }

      const body = await c.req.json();
      const { targetTenantSlug } = body;

      if (!targetTenantSlug) {
        return c.json({ error: "targetTenantSlug is required" }, 400);
      }

      const targetTenant = await kv.get(`tenant:${targetTenantSlug}`);
      if (!targetTenant) {
        return c.json({ error: "Target tenant not found" }, 404);
      }

      const results = {
        usersUpdated: 0,
        clientsCopied: 0,
        consultationsCopied: 0,
        errors: [] as string[],
      };

      // --- Migrate users: add tenantSlug field if missing ---
      const allUsers = await kv.getByPrefix("user:");
      for (const user of allUsers) {
        if (!user.isAdmin && !user.tenantSlug) {
          try {
            const updatedUser = { ...user, tenantSlug: targetTenantSlug };
            await kv.set(`user:${user.username}`, updatedUser);
            results.usersUpdated++;
          } catch (err) {
            results.errors.push(`user:${user.username} - ${err}`);
          }
        }
      }

      // --- Migrate clients ---
      // Legacy key format: client:{userId}:{clientId}
      // New key format:    client:{tenantSlug}:{clientId}
      const allClientKeys = await kv.getByPrefix("client:");
      for (const client of allClientKeys) {
        const clientId = client.id;
        if (!clientId) continue;

        const newKey = `client:${targetTenantSlug}:${clientId}`;
        const existing = await kv.get(newKey);

        // Skip if already migrated (idempotency)
        if (existing) continue;

        try {
          await kv.set(newKey, client);
          results.clientsCopied++;
        } catch (err) {
          results.errors.push(`client:${clientId} - ${err}`);
        }
      }

      // --- Migrate consultations ---
      // Legacy key format: consultation:{userId}:{clientId}:{consultId}
      // New key format:    consultation:{tenantSlug}:{clientId}:{consultId}
      const allConsultations = await kv.getByPrefix("consultation:");
      for (const consultation of allConsultations) {
        const consultId = consultation.id;
        const clientId = consultation.clientId;
        if (!consultId || !clientId) continue;

        const newKey = `consultation:${targetTenantSlug}:${clientId}:${consultId}`;
        const existing = await kv.get(newKey);

        // Skip if already migrated (idempotency)
        if (existing) continue;

        try {
          await kv.set(newKey, consultation);
          results.consultationsCopied++;
        } catch (err) {
          results.errors.push(`consultation:${consultId} - ${err}`);
        }
      }

      console.log(`[MIGRATE] Completed migration to tenant "${targetTenantSlug}":`, results);

      return c.json({
        success: true,
        targetTenantSlug,
        ...results,
      });
    } catch (error) {
      console.error("[MIGRATE] Error:", error);
      return c.json({ error: "Migration failed" }, 500);
    }
  });

  return router;
}
