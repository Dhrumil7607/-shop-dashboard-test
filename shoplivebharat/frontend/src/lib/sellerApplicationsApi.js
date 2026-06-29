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
    try {
        const { data } = await api.post("/seller-applications", payload);
        return data;
    } catch (err) {
        if (err?.response?.status === 409) throw err;
        // Fallback to local mock
        const apps = _loadAll();
        // Deduplicate by GST
        if (apps.some(a => a.business_details?.gst === payload.business_details?.gst && a.status !== "rejected")) {
            const e = new Error("A registration with this GST number already exists.");
            e.status = 409;
            throw e;
        }
        const app = {
            id: _uuid(),
            ...payload,
            status: "pending_review",
            submitted_at: _nowIso(),
            updated_at: _nowIso(),
            admin_notes: [],
            history: [
                {
                    from_status: null,
                    to_status: "pending_review",
                    actor_type: "applicant",
                    created_at: _nowIso(),
                },
            ],
        };
        apps.push(app);
        _saveAll(apps);
        return app;
    }
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
        return data;
    } catch {
        let apps = _loadAll();
        if (params.status && params.status !== "all") {
            apps = apps.filter(a => a.status === params.status);
        }
        return apps.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }
}

// ─── Admin: approve ─────────────────────────────────────────────────────────
export async function approveSellerApplication(id, adminKey) {
    try {
        const { data } = await api.post(`/admin/seller-applications/${id}/approve`, {}, adminHeaders(adminKey));
        return data;
    } catch {
        return _changeStatus(id, "approved", "admin", "Approved by admin");
    }
}

// ─── Admin: reject ──────────────────────────────────────────────────────────
export async function rejectSellerApplication(id, reason, adminKey) {
    try {
        const { data } = await api.post(
            `/admin/seller-applications/${id}/reject`,
            { reason },
            adminHeaders(adminKey)
        );
        return data;
    } catch {
        return _changeStatus(id, "rejected", "admin", reason);
    }
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
