/**
 * Seller Applications API
 *
 * All calls reuse the existing `api` axios instance (auto-attaches JWT Bearer
 * token and targets REACT_APP_BACKEND_URL). Admin calls reuse the same
 * X-Admin-Key header pattern already used by createShop / archiveShop.
 *
 * While the backend endpoint hasn't been deployed yet the functions fall back
 * to a localStorage mock so the entire UI is testable without a server.
 */
import { api } from "@/lib/api";

// ─── localStorage mock store key ───────────────────────────────────────────
const LS_KEY = "slb_seller_applications";

function _loadAll() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
        return [];
    }
}
function _saveAll(apps) {
    localStorage.setItem(LS_KEY, JSON.stringify(apps));
}
function _nowIso() {
    return new Date().toISOString();
}
function _uuid() {
    return "app-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const adminHeaders = (adminKey) => ({
    headers: { "X-Admin-Key": adminKey },
});

// ─── Public: submit new application ────────────────────────────────────────
export async function submitSellerApplication(payload) {
    const { data } = await api.post("/seller-applications", payload);
    return data;
}

// ─── Public: get single application ────────────────────────────────────────
export async function fetchSellerApplication(id) {
    try {
        const { data } = await api.get(`/seller-applications/${id}`);
        return data;
    } catch {
        const app = _loadAll().find(a => a.id === id);
        if (!app) throw new Error("Application not found");
        return app;
    }
}

// ─── Public: update (resubmit after needs_changes) ─────────────────────────
export async function updateSellerApplication(id, payload) {
    try {
        const { data } = await api.patch(`/seller-applications/${id}`, payload);
        return data;
    } catch {
        const apps = _loadAll();
        const idx = apps.findIndex(a => a.id === id);
        if (idx === -1) throw new Error("Application not found");
        apps[idx] = {
            ...apps[idx],
            ...payload,
            status: "pending_review",
            updated_at: _nowIso(),
            history: [
                ...(apps[idx].history || []),
                {
                    from_status: apps[idx].status,
                    to_status: "pending_review",
                    actor_type: "applicant",
                    created_at: _nowIso(),
                },
            ],
        };
        _saveAll(apps);
        return apps[idx];
    }
}

// ─── Admin: list applications ───────────────────────────────────────────────
export async function fetchAdminSellerApplications(adminKey, params = {}) {
    try {
        const { data } = await api.get("/admin/seller-applications", {
            params,
            ...adminHeaders(adminKey),
        });
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

// ─── Admin: approve ─────────────────────────────────────────────────────────
export async function approveSellerApplication(id, adminKey) {
    const { data } = await api.post(`/admin/seller-applications/${id}/approve`, {}, adminHeaders(adminKey));
    return data;
}

// ─── Admin: reject ──────────────────────────────────────────────────────────
export async function rejectSellerApplication(id, reason, adminKey) {
    const { data } = await api.post(`/admin/seller-applications/${id}/reject`, { reason }, adminHeaders(adminKey));
    return data;
}

// ─── Admin: request changes ──────────────────────────────────────────────────
export async function requestChangesSellerApplication(id, changes_requested, adminKey) {
    try {
        const { data } = await api.post(
            `/admin/seller-applications/${id}/request-changes`,
            { changes_requested },
            adminHeaders(adminKey)
        );
        return data;
    } catch {
        return _changeStatus(id, "needs_changes", "admin", changes_requested);
    }
}

// ─── Admin: suspend ──────────────────────────────────────────────────────────
export async function suspendSellerApplication(id, reason, adminKey) {
    try {
        const { data } = await api.post(
            `/admin/seller-applications/${id}/suspend`,
            { reason },
            adminHeaders(adminKey)
        );
        return data;
    } catch {
        return _changeStatus(id, "suspended", "admin", reason);
    }
}

// ─── Admin: add note ─────────────────────────────────────────────────────────
export async function addApplicationNote(id, body, is_visible_to_applicant, adminKey) {
    try {
        const { data } = await api.post(
            `/admin/seller-applications/${id}/notes`,
            { body, is_visible_to_applicant },
            adminHeaders(adminKey)
        );
        return data;
    } catch {
        const apps = _loadAll();
        const app = apps.find(a => a.id === id);
        if (!app) throw new Error("Not found");
        app.admin_notes = [
            ...(app.admin_notes || []),
            { id: _uuid(), body, is_visible_to_applicant, created_at: _nowIso() },
        ];
        app.updated_at = _nowIso();
        _saveAll(apps);
        return app;
    }
}

// NOTE: Shop + seller-account provisioning happens server-side in the backend
// approve endpoint, which returns seller_credentials on the application.

// eslint-disable-next-line no-unused-vars
function _provisionSellerAccount(app) {
    try {
        const DEMO_ACCTS_KEY = "slb_demo_seller_accounts";
        const accounts = JSON.parse(localStorage.getItem(DEMO_ACCTS_KEY) || "[]");
        // Don't duplicate
        const existing = accounts.find(a => a.email === app.applicant_email);
        if (existing) return existing;

        // Generate a temporary password
        const tempPassword = "slb-" + Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10);
        const shopId = "shop-" + app.id.replace(/^app-/, "");

        const account = {
            id: "seller_" + Math.random().toString(36).slice(2),
            name: app.applicant_name,
            email: app.applicant_email,
            role: "seller",
            phone: app.business_details?.phone || "",
            city: app.store_information?.city || "",
            store_name: app.store_information?.store_name || "",
            store_id: shopId,
            application_id: app.id,
            temp_password: tempPassword,
            credential_status: "created",   // created | emailed | pending_email | reset_required
            email_status: "sent",           // sent | failed | pending
            approved_at: new Date().toISOString(),
        };
        accounts.push(account);
        localStorage.setItem(DEMO_ACCTS_KEY, JSON.stringify(accounts));

        // Store credentials back on the application so admin can view them
        const apps = _loadAll();
        const appRec = apps.find(a => a.id === app.id);
        if (appRec) {
            appRec.seller_credentials = {
                email: account.email,
                temp_password: tempPassword,
                login_url: "/seller/login",
                credential_status: "created",
                email_status: "sent",
            };
            _saveAll(apps);
        }

        // Simulate approval email
        _sendApprovalEmail(account);

        return account;
    } catch {}
}

// ─── Email simulation (real service integration point) ────────────────────────
function _sendApprovalEmail(account) {
    try {
        // In production this calls the backend email service.
        // Here we log to a localStorage "outbox" so admin can verify it was queued.
        const OUTBOX_KEY = "slb_email_outbox";
        const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
        outbox.push({
            id: "mail_" + Date.now(),
            to: account.email,
            subject: "Your ShopLive Bharat Seller Account is Approved 🎉",
            body: `Welcome ${account.name}! Your store is now live.\n\nLogin: ${window.location.origin}/seller/login\nEmail: ${account.email}\nTemporary Password: ${account.temp_password}\n\nPlease change your password after first login.`,
            type: "seller_approval",
            status: "sent",
            sent_at: new Date().toISOString(),
        });
        localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
        return true;
    } catch {
        return false;
    }
}

// Resend seller invite (admin action)
export function resendSellerInvite(applicationId) {
    const DEMO_ACCTS_KEY = "slb_demo_seller_accounts";
    const accounts = JSON.parse(localStorage.getItem(DEMO_ACCTS_KEY) || "[]");
    const account = accounts.find(a => a.application_id === applicationId);
    if (!account) return { success: false, error: "No seller account found" };
    const ok = _sendApprovalEmail(account);
    account.email_status = ok ? "sent" : "failed";
    localStorage.setItem(DEMO_ACCTS_KEY, JSON.stringify(accounts));
    return { success: ok };
}

// Get seller credentials for an application (admin view)
export function getSellerCredentials(applicationId) {
    const DEMO_ACCTS_KEY = "slb_demo_seller_accounts";
    const accounts = JSON.parse(localStorage.getItem(DEMO_ACCTS_KEY) || "[]");
    return accounts.find(a => a.application_id === applicationId) || null;
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function _changeStatus(id, newStatus, actorType, reason) {
    const apps = _loadAll();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Application not found");
    const prev = apps[idx].status;
    apps[idx] = {
        ...apps[idx],
        status: newStatus,
        rejection_reason: newStatus === "rejected" ? reason : apps[idx].rejection_reason,
        changes_requested: newStatus === "needs_changes" ? reason : apps[idx].changes_requested,
        updated_at: _nowIso(),
        history: [
            ...(apps[idx].history || []),
            {
                from_status: prev,
                to_status: newStatus,
                actor_type: actorType,
                reason,
                created_at: _nowIso(),
            },
        ],
    };
    _saveAll(apps);
    return apps[idx];
}
