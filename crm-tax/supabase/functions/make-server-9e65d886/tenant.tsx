import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

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
  // Super admin only. Creates a new tenant (slug + name only).
  // The first user to sign up at /{slug}/ becomes the owner.
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

  // GET /make-server-9e65d886/admin/debug/keys
  // Super admin only. Returns all KV store keys grouped by prefix for diagnostics.
  router.get("/make-server-9e65d886/admin/debug/keys", async (c) => {
    try {
      if (!isSuperAdmin(c)) {
        return c.json({ error: "Forbidden - Super admin access required" }, 403);
      }

      const supabase = (await import("npm:@supabase/supabase-js@2.48.1")).createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data, error } = await supabase
        .from("kv_store_9e65d886")
        .select("key")
        .order("key");

      if (error) throw new Error(error.message);

      const keys: string[] = data?.map((d: any) => d.key) ?? [];

      // Group by first prefix segment
      const grouped: Record<string, string[]> = {};
      for (const key of keys) {
        const prefix = key.split(":")[0];
        if (!grouped[prefix]) grouped[prefix] = [];
        grouped[prefix].push(key);
      }

      return c.json({ total: keys.length, grouped });
    } catch (error) {
      console.error("[DEBUG KEYS] Error:", error);
      return c.json({ error: "Failed to fetch keys" }, 500);
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

  // POST /make-server-9e65d886/tenant/:slug/branding/upload
  // Tenant owner only. Uploads a logo or background image to Supabase Storage.
  // Accepts multipart/form-data with fields: file (Blob) and imageType ("logo" | "background")
  router.post("/make-server-9e65d886/tenant/:slug/branding/upload", async (c) => {
    try {
      const slug = c.req.param("slug");
      const requestingUser = c.req.header("X-User-ID");
      const requestingTenant = c.req.header("X-Tenant-ID");

      if (!requestingUser || !requestingTenant) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      if (requestingTenant !== slug) {
        return c.json({ error: "Forbidden - Tenant mismatch" }, 403);
      }

      const tenant = await kv.get(`tenant:${slug}`);
      if (!tenant) return c.json({ error: "Tenant not found" }, 404);
      if (tenant.ownerUsername !== requestingUser) {
        return c.json({ error: "Forbidden - Only tenant owner can upload branding images" }, 403);
      }

      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;
      const imageType = formData.get("imageType") as string | null;

      if (!file || !imageType) {
        return c.json({ error: "file and imageType are required" }, 400);
      }
      if (!["logo", "background"].includes(imageType)) {
        return c.json({ error: "imageType must be 'logo' or 'background'" }, 400);
      }

      // Validate MIME type
      const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
      if (!allowed.includes(file.type)) {
        return c.json({ error: "허용되지 않는 파일 형식입니다. PNG, JPG, WebP, SVG만 지원합니다." }, 400);
      }

      // Validate size: logo ≤ 2MB, background ≤ 5MB
      const maxBytes = imageType === "logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        const maxMB = imageType === "logo" ? 2 : 5;
        return c.json({ error: `파일 크기는 ${maxMB}MB 이하이어야 합니다.` }, 400);
      }

      const ext = file.name.split(".").pop() ?? "png";
      const path = `${slug}/${imageType}.${ext}`;
      const BUCKET = "branding-9e65d886";

      const supabase = (await import("npm:@supabase/supabase-js@2.48.1")).createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some((b: any) => b.name === BUCKET)) {
        await supabase.storage.createBucket(BUCKET, { public: true });
      }

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error("[UPLOAD] Storage error:", uploadError);
        return c.json({ error: "이미지 업로드에 실패했습니다." }, 500);
      }

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = publicData.publicUrl;

      // Auto-save URL to tenant branding
      const field = imageType === "logo" ? "logoUrl" : "loginBgUrl";
      const updatedTenant = {
        ...tenant,
        branding: { ...tenant.branding, [field]: publicUrl },
      };
      await kv.set(`tenant:${slug}`, updatedTenant);

      return c.json({ url: publicUrl });
    } catch (error) {
      console.error("[UPLOAD] Error:", error);
      return c.json({ error: "업로드 처리 중 오류가 발생했습니다." }, 500);
    }
  });

  // POST /make-server-9e65d886/admin/tenants/:slug/assign-owner
  // Super admin only. Assigns an existing user as tenant owner.
  // Use when a legacy user (no tenantSlug) needs to be linked to an ownerless tenant.
  router.post("/make-server-9e65d886/admin/tenants/:slug/assign-owner", async (c) => {
    try {
      if (!isSuperAdmin(c)) {
        return c.json({ error: "Forbidden - Super admin access required" }, 403);
      }

      const slug = c.req.param("slug");
      const body = await c.req.json();
      const { username } = body;

      if (!username) {
        return c.json({ error: "username is required" }, 400);
      }

      const tenant = await kv.get(`tenant:${slug}`);
      if (!tenant) {
        return c.json({ error: "Tenant not found" }, 404);
      }

      if (tenant.ownerUsername) {
        return c.json({ error: "이미 오너가 지정된 테넌트입니다" }, 409);
      }

      const user = await kv.get(`user:${username}`);
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      if (user.tenantSlug && user.tenantSlug !== slug) {
        return c.json({ error: "이미 다른 테넌트에 속한 유저입니다" }, 409);
      }

      await kv.set(`user:${username}`, { ...user, tenantSlug: slug });
      await kv.set(`tenant:${slug}`, { ...tenant, ownerUsername: username });

      console.log(`[ASSIGN OWNER] tenant="${slug}" owner="${username}"`);
      return c.json({ success: true, tenantSlug: slug, ownerUsername: username });
    } catch (error) {
      console.error("[ASSIGN OWNER] Error:", error);
      return c.json({ error: "Failed to assign owner" }, 500);
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

      const results: {
        usersUpdated: number;
        clientsCopied: number;
        consultationsCopied: number;
        ownerSet: string | null;
        errors: string[];
      } = {
        usersUpdated: 0,
        clientsCopied: 0,
        consultationsCopied: 0,
        ownerSet: null,
        errors: [],
      };

      // --- Migrate users: add tenantSlug field if missing ---
      let firstMigratedUsername: string | null = null;
      const allUsers = await kv.getByPrefix("user:");
      for (const user of allUsers) {
        if (!user.isAdmin && !user.tenantSlug) {
          try {
            const updatedUser = { ...user, tenantSlug: targetTenantSlug };
            await kv.set(`user:${user.username}`, updatedUser);
            results.usersUpdated++;
            if (!firstMigratedUsername) firstMigratedUsername = user.username;
          } catch (err) {
            results.errors.push(`user:${user.username} - ${err}`);
          }
        }
      }

      // Auto-set ownerUsername if tenant has none and we migrated at least one user
      if (!targetTenant.ownerUsername && firstMigratedUsername) {
        try {
          await kv.set(`tenant:${targetTenantSlug}`, {
            ...targetTenant,
            ownerUsername: firstMigratedUsername,
          });
          results.ownerSet = firstMigratedUsername;
        } catch (err) {
          results.errors.push(`ownerSet - ${err}`);
        }
      }

      // --- Migrate clients ---
      // Legacy key format: client:{userId}:{clientId}
      // New key format:    client:{tenantSlug}:{clientId}
      // Note: extract clientId from the KEY (not value.id) for reliability
      const allClientKVs = await kv.getKeyValuesByPrefix("client:");
      for (const { key, value: client } of allClientKVs) {
        // Skip keys that are already in the new tenant format
        if (key.startsWith(`client:${targetTenantSlug}:`)) continue;

        // Extract clientId from key: client:{anything}:{clientId}
        const parts = key.split(":");
        const clientId = parts.length >= 3 ? parts[parts.length - 1] : (client.id ?? null);
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
      // Note: extract IDs from the KEY for reliability
      const allConsultationKVs = await kv.getKeyValuesByPrefix("consultation:");
      for (const { key, value: consultation } of allConsultationKVs) {
        // Skip keys already in new tenant format
        if (key.startsWith(`consultation:${targetTenantSlug}:`)) continue;

        // Extract from key: consultation:{anything}:{clientId}:{consultId}
        const parts = key.split(":");
        const consultId = parts.length >= 4 ? parts[parts.length - 1] : (consultation.id ?? null);
        const clientId = parts.length >= 4 ? parts[parts.length - 2] : (consultation.clientId ?? null);
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
