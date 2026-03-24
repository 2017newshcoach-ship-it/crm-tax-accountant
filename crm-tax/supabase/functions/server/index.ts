import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import * as kv from "./kv_store.tsx";
import { hashPassword, verifyPassword } from "./crypto.tsx";
import {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidPhone,
  isValidBusinessNumber,
  isValidDate,
  isValidFileSize,
  isValidFileType,
  checkRateLimit,
} from "./validation.tsx";
import { getTenantSlug, isSuperAdmin, createTenantRouter } from "./tenant.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Resend API configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_API_URL = 'https://api.resend.com/emails';

// Admin credentials from environment variables
const ADMIN_USERNAME = Deno.env.get('ADMIN_USERNAME') || 'admin';
const ADMIN_PASSWORD_HASH = Deno.env.get('ADMIN_PASSWORD_HASH') || '';

// Log API key status on startup
console.log('='.repeat(50));
console.log('[STARTUP] Server Configuration Check - v9.0');
console.log(`[STARTUP] Resend API Key exists: ${RESEND_API_KEY ? '✅ YES' : '❌ NO'}`);
console.log(`[STARTUP] Resend API Key length: ${RESEND_API_KEY?.length || 0}`);
console.log(`[STARTUP] Resend API Key prefix: ${RESEND_API_KEY?.substring(0, 12) || 'N/A'}...`);
console.log(`[STARTUP] Default sender: baeby@argonautai.co.kr`);
console.log(`[STARTUP] Timestamp: ${new Date().toISOString()}`);
console.log('='.repeat(50));

const BUCKET_NAME = 'make-9e65d886-consultations';

// Create bucket on startup
async function initializeStorage() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
  }
}

// Initialize admin account on startup
async function initializeAdminAccount() {
  const adminUsername = Deno.env.get('ADMIN_USERNAME') || 'adminqoquddbs';
  const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'qoquddbs870628';
  const adminEmail = 'admin@taxmanagement.local';
  
  const existingAdmin = await kv.get(`user:${adminUsername}`);
  
  if (!existingAdmin) {
    console.log('[STARTUP] Creating admin account...');
    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = {
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      isAdmin: true,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:${adminUsername}`, adminUser);
    console.log('[STARTUP] ✅ Admin account created successfully');
  } else {
    console.log('[STARTUP] Admin account already exists');
  }
}

// Initialize test account on startup
async function initializeTestAccount() {
  const testUsername = 'test';
  const testPassword = 'testpw1234';
  const testEmail = 'test@taxmanagement.local';
  
  const existingTest = await kv.get(`user:${testUsername}`);
  
  if (!existingTest) {
    console.log('[STARTUP] Creating test account...');
    const hashedPassword = await hashPassword(testPassword);
    const testUser = {
      username: testUsername,
      password: hashedPassword,
      email: testEmail,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:${testUsername}`, testUser);
    console.log('[STARTUP] ✅ Test account created successfully');
    console.log('[STARTUP] 📋 Test account credentials:');
    console.log('[STARTUP]    Username: test');
    console.log('[STARTUP]    Password: testpw1234');
  } else {
    console.log('[STARTUP] Test account already exists');
  }
}

initializeStorage().catch(console.error);
initializeAdminAccount().catch(console.error);
initializeTestAccount().catch(console.error);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-ID", "X-Tenant-ID", "X-Super-Admin-Key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9e65d886/health", (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    resendApiConfigured: RESEND_API_KEY ? true : false,
    resendApiKeyLength: RESEND_API_KEY?.length || 0,
    resendApiKeyPrefix: RESEND_API_KEY?.substring(0, 8) || 'N/A',
  });
});

// ===== CLIENT ENDPOINTS =====

// Helper function to extract username from Authorization header
function getUsernameFromAuth(c: any): string | null {
  const authHeader = c.req.header('X-User-ID');
  return authHeader || null;
}

// Get all clients
app.get("/make-server-9e65d886/clients", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clients = await kv.getByPrefix(`client:${tenantSlug}:`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

// Get a single client
app.get("/make-server-9e65d886/clients/:id", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const id = c.req.param("id");
    const client = await kv.get(`client:${tenantSlug}:${id}`);

    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    return c.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return c.json({ error: "Failed to fetch client" }, 500);
  }
});

// Create a new client
app.post("/make-server-9e65d886/clients", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const body = await c.req.json();
    const { name, phone, email, businessNumber, industry, memo, isVip } = body;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const client = {
      id,
      userId,
      tenantSlug,
      name,
      phone: phone || null,
      email: email || null,
      businessNumber: businessNumber || null,
      industry: industry || null,
      memo: memo || null,
      isVip: isVip || false,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`client:${tenantSlug}:${id}`, client);
    return c.json({ client });
  } catch (error) {
    console.error("Error creating client:", error);
    return c.json({ error: "Failed to create client" }, 500);
  }
});

// Update a client
app.put("/make-server-9e65d886/clients/:id", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, phone, email, businessNumber, industry, memo, isVip } = body;

    const existingClient = await kv.get(`client:${tenantSlug}:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const updatedClient = {
      ...existingClient,
      name,
      phone: phone || null,
      email: email || null,
      businessNumber: businessNumber || null,
      industry: industry || null,
      memo: memo || null,
      isVip: isVip !== undefined ? isVip : existingClient.isVip,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`client:${tenantSlug}:${id}`, updatedClient);
    return c.json({ client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

// Delete a client
app.delete("/make-server-9e65d886/clients/:id", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const id = c.req.param("id");

    const existingClient = await kv.get(`client:${tenantSlug}:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    await kv.del(`client:${tenantSlug}:${id}`);

    // Also delete all consultations for this client
    const consultations = await kv.getByPrefix(`consultation:${tenantSlug}:${id}:`);
    const deletePromises = consultations.map((cons: any) =>
      kv.del(`consultation:${tenantSlug}:${id}:${cons.id}`)
    );
    await Promise.all(deletePromises);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// ===== CONSULTATION ENDPOINTS =====

// Get all consultations for a client
app.get("/make-server-9e65d886/clients/:clientId/consultations", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const consultations = await kv.getByPrefix(`consultation:${tenantSlug}:${clientId}:`);
    return c.json({ consultations: consultations || [] });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return c.json({ error: "Failed to fetch consultations" }, 500);
  }
});

// Get all consultations (for all clients)
app.get("/make-server-9e65d886/consultations", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const consultations = await kv.getByPrefix(`consultation:${tenantSlug}:`);
    return c.json({ consultations: consultations || [] });
  } catch (error) {
    console.error("Error fetching all consultations:", error);
    return c.json({ error: "Failed to fetch consultations" }, 500);
  }
});

// Create a new consultation
app.post("/make-server-9e65d886/clients/:clientId/consultations", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const body = await c.req.json();
    const { date, time, content, status, color } = body;

    if (!date) {
      return c.json({ error: "Date is required" }, 400);
    }

    // Verify client exists within the tenant
    const client = await kv.get(`client:${tenantSlug}:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const consultation = {
      id,
      userId,
      tenantSlug,
      clientId,
      date,
      time: time || null,
      content: content || "",
      status: status || "completed",
      isImportant: false,
      color: color || null,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`consultation:${tenantSlug}:${clientId}:${id}`, consultation);
    return c.json({ consultation });
  } catch (error) {
    console.error("Error creating consultation:", error);
    return c.json({ error: "Failed to create consultation" }, 500);
  }
});

// Update a consultation
app.put("/make-server-9e65d886/clients/:clientId/consultations/:id", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const { date, time, content, status, color, isImportant, attachments } = body;

    console.log(`[UPDATE CONSULTATION] Updating consultation ${id} for client ${clientId}, tenant ${tenantSlug}`);
    console.log(`[UPDATE CONSULTATION] Received data:`, { 
      date, 
      time, 
      contentLength: content?.length || 0, 
      status, 
      color, 
      isImportant, 
      attachmentsCount: attachments?.length || 0,
      attachments 
    });

    const existingConsultation = await kv.get(`consultation:${tenantSlug}:${clientId}:${id}`);
    if (!existingConsultation) {
      return c.json({ error: "Consultation not found" }, 404);
    }

    if (!date) {
      return c.json({ error: "Date is required" }, 400);
    }

    const updatedConsultation = {
      ...existingConsultation,
      date,
      time: time || null,
      content: content || "",
      status: status || "completed",
      color: color !== undefined ? color : existingConsultation.color,
      isImportant: isImportant !== undefined ? isImportant : existingConsultation.isImportant,
      attachments: attachments !== undefined ? attachments : existingConsultation.attachments,
      updatedAt: new Date().toISOString(),
    };

    console.log(`[UPDATE CONSULTATION] Saving consultation with attachments:`, {
      id: updatedConsultation.id,
      attachmentsCount: updatedConsultation.attachments?.length || 0,
      attachments: updatedConsultation.attachments
    });

    await kv.set(`consultation:${tenantSlug}:${clientId}:${id}`, updatedConsultation);
    
    console.log(`[UPDATE CONSULTATION] Successfully saved consultation`);
    
    return c.json({ consultation: updatedConsultation });
  } catch (error) {
    console.error("Error updating consultation:", error);
    return c.json({ error: "Failed to update consultation" }, 500);
  }
});

// Toggle important status for a consultation
app.patch("/make-server-9e65d886/clients/:clientId/consultations/:id/important", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const id = c.req.param("id");

    const existingConsultation = await kv.get(`consultation:${tenantSlug}:${clientId}:${id}`);
    if (!existingConsultation) {
      return c.json({ error: "Consultation not found" }, 404);
    }

    const updatedConsultation = {
      ...existingConsultation,
      isImportant: !existingConsultation.isImportant,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`consultation:${tenantSlug}:${clientId}:${id}`, updatedConsultation);
    return c.json({ consultation: updatedConsultation });
  } catch (error) {
    console.error("Error toggling consultation importance:", error);
    return c.json({ error: "Failed to toggle consultation importance" }, 500);
  }
});

// Delete a consultation
app.delete("/make-server-9e65d886/clients/:clientId/consultations/:id", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const id = c.req.param("id");

    const existingConsultation = await kv.get(`consultation:${tenantSlug}:${clientId}:${id}`);
    if (!existingConsultation) {
      return c.json({ error: "Consultation not found" }, 404);
    }

    // Delete associated attachments from storage
    if (existingConsultation.attachments && existingConsultation.attachments.length > 0) {
      const filePaths = existingConsultation.attachments.map((att: any) =>
        `${tenantSlug}/${clientId}/${id}/${att.id}`
      );
      await supabase.storage.from(BUCKET_NAME).remove(filePaths);
    }

    await kv.del(`consultation:${tenantSlug}:${clientId}:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting consultation:", error);
    return c.json({ error: "Failed to delete consultation" }, 500);
  }
});

// ===== AUTH ENDPOINTS =====

// Sign up endpoint
app.post("/make-server-9e65d886/signup", async (c) => {
  try {
    console.log('[SIGNUP] === Starting signup process ===');
    const body = await c.req.json();
    const { username, password, email } = body;
    console.log('[SIGNUP] Received data:', { username, email, passwordLength: password?.length });

    if (!username || !password || !email) {
      console.log('[SIGNUP] Missing required fields');
      return c.json({ error: "아이디, 비밀번호, 이메일은 필수입니다." }, 400);
    }

    // Validate inputs
    console.log('[SIGNUP] Validating username...');
    if (!isValidUsername(username)) {
      console.log('[SIGNUP] Invalid username format:', username);
      return c.json({ error: "아이디는 3-20자의 영문, 숫자, 언더스코어만 사용할 수 있습니다." }, 400);
    }
    
    console.log('[SIGNUP] Validating password...');
    if (!isValidPassword(password)) {
      console.log('[SIGNUP] Invalid password format (length or complexity)');
      return c.json({ error: "비밀번호는 8자 이상이어야 하며, 영문과 숫자를 포함해야 합니다." }, 400);
    }
    
    console.log('[SIGNUP] Validating email...');
    if (!isValidEmail(email)) {
      console.log('[SIGNUP] Invalid email format:', email);
      return c.json({ error: "유효한 이메일 주소를 입력해주세요." }, 400);
    }

    // Check if username already exists
    console.log('[SIGNUP] Checking if username exists...');
    const existingUser = await kv.get(`user:${username}`);
    if (existingUser) {
      console.log('[SIGNUP] Username already exists:', username);
      return c.json({ error: "이미 존재하는 아이디입니다." }, 400);
    }

    // Hash password
    console.log('[SIGNUP] Hashing password...');
    try {
      const hashedPassword = await hashPassword(password);
      console.log('[SIGNUP] Password hashed successfully');

      // Create new user
      const newUser = {
        username,
        password: hashedPassword,
        email,
        createdAt: new Date().toISOString(),
      };

      console.log('[SIGNUP] Saving user to database...');
      await kv.set(`user:${username}`, newUser);
      console.log('[SIGNUP] ✅ User saved successfully:', username);
      
      return c.json({ 
        success: true, 
        message: "회원가입이 완료되었습니다.",
      });
    } catch (hashError) {
      console.error('[SIGNUP] ❌ Password hashing error:', hashError);
      return c.json({ error: "비밀번호 처리 중 오류가 발생했습니다." }, 500);
    }
  } catch (error) {
    console.error("[SIGNUP] ❌ Unexpected error during signup:", error);
    return c.json({ error: `회원가입에 실패했습니다: ${error.message || '알 수 없는 오류'}` }, 500);
  }
});

// Login endpoint
app.post("/make-server-9e65d886/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ error: "아이디와 비밀번호를 입력해주세요." }, 400);
    }

    // Check regular user (including admin account from KV store)
    const user = await kv.get(`user:${username}`);
    if (!user || !(await verifyPassword(password, user.password))) {
      return c.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);
    }

    return c.json({
      success: true,
      isAdmin: user.isAdmin || false,
      username: user.username,
      tenantSlug: user.tenantSlug || null,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return c.json({ error: "로그인에 실패했습니다." }, 500);
  }
});

// Send verification code
app.post("/make-server-9e65d886/send-verification", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    console.log(`[SEND VERIFICATION] Request received for email: ${email}, code: ${code}`);

    if (!email || !code) {
      console.log(`[SEND VERIFICATION] Missing email or code`);
      return c.json({ error: "이메일과 코드가 필요합니다." }, 400);
    }

    // Check if RESEND_API_KEY is configured
    const apiKey = RESEND_API_KEY;
    console.log(`[SEND VERIFICATION] API Key exists: ${apiKey ? 'YES' : 'NO'}, Length: ${apiKey?.length || 0}`);

    if (!apiKey) {
      console.error('[SEND VERIFICATION] CRITICAL: No API key configured!');
      return c.json({ error: "이메일 발송 설정이 완료되지 않았습니다." }, 500);
    }

    console.log(`[RESEND] Attempting to send email to: ${email}`);
    
    // Use verified domain email
    const senderEmail = 'baeby@argonautai.co.kr';
    console.log(`[RESEND] Using verified domain sender: ${senderEmail}`);
    
    // Send email using Resend
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [email],
        subject: '회원가입 이메일 인증 코드',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #3182F6; font-size: 28px; margin: 0;">이메일 인증</h1>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <p style="color: #495057; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                고경남 세무사 고객 관리 시스템 회원가입을 위한 인증 코드입니다.
              </p>
              
              <div style="background: white; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="color: #868e96; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  인증 코드
                </div>
                <div style="color: #3182F6; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #868e96; font-size: 14px; line-height: 1.6; margin: 0;">
                이 코드는 10분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
              </p>
            </div>
            
            <div style="text-align: center; color: #adb5bd; font-size: 12px;">
              <p>© 2026 고경남 세무사 고객 관리 시스템. All rights reserved.</p>
            </div>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[RESEND ERROR] Failed to send email:', JSON.stringify(data, null, 2));
      return c.json({ error: "이메일 발송에 실패했습니다." }, 500);
    }

    console.log('[RESEND SUCCESS] Email sent successfully:', JSON.stringify(data, null, 2));
    return c.json({ 
      success: true, 
      message: "인증 코드가 이메일로 전송되었습니다.",
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return c.json({ error: "인증 코드 전송에 실패했습니다." }, 500);
  }
});

// Reset password endpoint
app.post("/make-server-9e65d886/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    console.log(`[RESET PASSWORD] Request received for email: ${email}`);

    if (!email) {
      console.log(`[RESET PASSWORD] Missing email`);
      return c.json({ error: "이메일을 입력해주세요." }, 400);
    }

    // Find user by email
    const users = await kv.getByPrefix('user:');
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      console.log(`[RESET PASSWORD] User not found for email: ${email}`);
      return c.json({ error: "해당 이메일로 가입된 계정이 없습니다." }, 404);
    }

    console.log(`[RESET PASSWORD] User found: ${user.username}`);

    // Generate temporary password (8 characters: letters + numbers)
    const tempPassword = Math.random().toString(36).slice(-8);
    console.log(`[RESET PASSWORD] Generated temp password: ${tempPassword}`);

    // Hash temporary password
    const hashedTempPassword = await hashPassword(tempPassword);

    // Update user password
    user.password = hashedTempPassword;
    await kv.set(`user:${user.username}`, user);
    console.log(`[RESET PASSWORD] Password updated for user: ${user.username}`);

    // Check if RESEND_API_KEY is configured
    const apiKey = RESEND_API_KEY;
    console.log(`[RESET PASSWORD] API Key exists: ${apiKey ? 'YES' : 'NO'}, Length: ${apiKey?.length || 0}`);
    
    if (!apiKey || apiKey === '') {
      console.error('[RESET PASSWORD] CRITICAL: No API key configured!');
      return c.json({ error: "이메일 발송 설정이 완료되지 않았습니다." }, 500);
    }

    console.log(`[RESEND] Attempting to send temp password to: ${email}`);
    
    // Use verified domain email
    const senderEmail = 'baeby@argonautai.co.kr';
    console.log(`[RESEND] Using verified domain sender: ${senderEmail}`);
    
    // Send email using Resend
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [email],
        subject: '임시 비밀번호 안내',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #3182F6; font-size: 28px; margin: 0;">비밀번호 재설정</h1>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <p style="color: #495057; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                안녕하세요, <strong>${user.username}</strong>님!<br>
                요청하신 임시 비밀번호를 안내드립니다.
              </p>
              
              <div style="background: white; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="color: #868e96; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  임시 비밀번호
                </div>
                <div style="color: #3182F6; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                  ${tempPassword}
                </div>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ 보안 안내</strong><br>
                  로그인 후 반드시 비밀번호를 변경해주세요.
                </p>
              </div>
              
              <p style="color: #868e96; font-size: 14px; line-height: 1.6; margin: 0;">
                본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
              </p>
            </div>
            
            <div style="text-align: center; color: #adb5bd; font-size: 12px;">
              <p>© 2026 고경남 세무사 고객 관리 시스템. All rights reserved.</p>
            </div>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[RESEND ERROR] Failed to send temp password email:', JSON.stringify(data, null, 2));
      return c.json({ error: "임시 비밀번호 이메일 발송에 실패했습니다." }, 500);
    }

    console.log('[RESEND SUCCESS] Temp password email sent successfully:', JSON.stringify(data, null, 2));
    return c.json({ 
      success: true, 
      message: "임시 비밀번호가 이메일로 전송되었습니다.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return c.json({ error: "비밀번호 재설정에 실패했습니다." }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-9e65d886/admin/users", async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    
    // Remove passwords from response
    const sanitizedUsers = users.map((user: any) => ({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    }));
    
    return c.json({ users: sanitizedUsers || [] });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "회원 목록을 가져오는데 실패했습니다." }, 500);
  }
});

// Delete user (admin only)
app.delete("/make-server-9e65d886/admin/delete-user", async (c) => {
  try {
    const body = await c.req.json();
    const { username } = body;

    console.log(`[ADMIN DELETE USER] Request to delete user: ${username}`);

    if (!username) {
      return c.json({ error: "사용자명이 필요합니다." }, 400);
    }

    // Check if user exists
    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ error: "존재하지 않는 사용자입니다." }, 404);
    }

    // Delete user
    await kv.del(`user:${username}`);

    console.log(`[ADMIN DELETE USER] User deleted successfully: ${username}`);
    return c.json({ 
      success: true,
      message: "사용자가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "사용자 삭제에 실패했습니다." }, 500);
  }
});

// ===== FILE UPLOAD ENDPOINTS =====

// Upload attachment to consultation
app.post("/make-server-9e65d886/clients/:clientId/consultations/:consultationId/attachments", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const consultationId = c.req.param("consultationId");

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file size and type
    if (!isValidFileSize(file.size)) {
      return c.json({ error: "파일 크기는 50MB를 초과할 수 없습니다." }, 400);
    }
    if (!isValidFileType(file.type)) {
      return c.json({ error: "지원되지 않는 파일 형식입니다." }, 400);
    }

    // Generate unique file ID
    const fileId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop();
    const filePath = `${tenantSlug}/${clientId}/${consultationId}/${fileId}.${fileExt}`;
    
    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return c.json({ error: "Failed to upload file" }, 500);
    }

    // Create signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 31536000);

    if (!urlData) {
      return c.json({ error: "Failed to create signed URL" }, 500);
    }

    const attachment = {
      id: fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: urlData.signedUrl,
      uploadedAt: new Date().toISOString(),
    };

    return c.json({ attachment });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return c.json({ error: "Failed to upload attachment" }, 500);
  }
});

// Delete attachment
app.delete("/make-server-9e65d886/clients/:clientId/consultations/:consultationId/attachments/:attachmentId", async (c) => {
  try {
    const userId = getUsernameFromAuth(c);
    const tenantSlug = getTenantSlug(c);
    if (!userId || !tenantSlug) {
      return c.json({ error: "Unauthorized - User ID and Tenant ID required" }, 401);
    }

    const clientId = c.req.param("clientId");
    const consultationId = c.req.param("consultationId");
    const attachmentId = c.req.param("attachmentId");

    // Get consultation to find file extension
    const consultation = await kv.get(`consultation:${tenantSlug}:${clientId}:${consultationId}`);
    if (!consultation) {
      return c.json({ error: "Consultation not found" }, 404);
    }

    const attachment = consultation.attachments?.find((att: any) => att.id === attachmentId);
    if (!attachment) {
      return c.json({ error: "Attachment not found" }, 404);
    }

    // Delete from storage
    const fileExt = attachment.fileName.split('.').pop();
    const filePath = `${tenantSlug}/${clientId}/${consultationId}/${attachmentId}.${fileExt}`;
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      console.error("Error deleting file from storage:", deleteError);
      return c.json({ error: "Failed to delete file" }, 500);
    }

    // Update consultation to remove attachment
    const updatedAttachments = consultation.attachments.filter((att: any) => att.id !== attachmentId);
    const updatedConsultation = {
      ...consultation,
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`consultation:${tenantSlug}:${clientId}:${consultationId}`, updatedConsultation);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return c.json({ error: "Failed to delete attachment" }, 500);
  }
});

// Mount tenant routes
const tenantRouter = createTenantRouter();
app.route("/", tenantRouter);

Deno.serve(app.fetch);