const BASE = "";

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

async function fetchJsonWithToken(url: string, token: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...options,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("eape_admin_session");
      window.dispatchEvent(new Event("admin-unauthorized"));
    }
    throw new Error("Session expired. Please login again.");
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const publicApi = {
  getConfig() {
    return fetchJson("/api/config/public");
  },
};

export const userApi = {
  lookup(username: string) {
    return fetchJson(`/api/user/lookup?username=${encodeURIComponent(username)}`);
  },
  register(data: {
    username: string;
    wallet?: string;
    solWallet?: string;
    invitee?: string;
    telegram?: string;
    deviceId?: string;
    comment_1?: string;
    comment_2?: string;
    comment_3?: string;
    completedTasks?: string[];
    campaignProofs?: Record<string, string>;
  }) {
    return fetchJson("/api/user/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  completeTask(userId: string, taskId: string, proof?: string) {
    return fetchJson("/api/campaign/complete-task", {
      method: "POST",
      body: JSON.stringify({ userId, taskId, proof }),
    });
  },
};

export const formApi = {
  partnership(data: Record<string, string>) {
    return fetchJson("/api/form/partnership", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  investEarly(data: Record<string, string>) {
    return fetchJson("/api/form/invest-early", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  contact(data: Record<string, string>) {
    return fetchJson("/api/form/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export function adminApi(token: string) {
  return {
    login(email: string, password: string) {
      return fetchJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    getUsers(page = 1, perPage = 50, search?: string, status?: string) {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return fetchJsonWithToken(`/api/admin/users?${params}`, token);
    },
    verifyUsers(userIds: string[], action: "verify" | "disqualify") {
      return fetchJsonWithToken("/api/admin/users/verify", token, {
        method: "POST",
        body: JSON.stringify({ userIds, action }),
      });
    },
    updateUser(userId: string, updates: Record<string, unknown>) {
      return fetchJsonWithToken("/api/admin/users/update", token, {
        method: "POST",
        body: JSON.stringify({ userId, ...updates }),
      });
    },
    getConfig(path: string) {
      const params = new URLSearchParams({ path });
      return fetchJsonWithToken(`/api/admin/config?${params}`, token);
    },
    updateConfig(path: string, value: unknown, merge = false) {
      return fetchJsonWithToken("/api/admin/config", token, {
        method: "POST",
        body: JSON.stringify({ path, value, merge }),
      });
    },
    saveCampaign(tasks: unknown[], version?: number) {
      return fetchJsonWithToken("/api/admin/campaign/save", token, {
        method: "POST",
        body: JSON.stringify({ tasks, version }),
      });
    },
    getStats() {
      return fetchJsonWithToken("/api/admin/stats", token);
    },
    getContacts(filter = "all") {
      return fetchJsonWithToken(`/api/admin/contacts?filter=${filter}`, token);
    },
    updateContact(id: string, action: "close" | "delete") {
      return fetchJsonWithToken("/api/admin/contacts/update", token, {
        method: "POST",
        body: JSON.stringify({ id, action }),
      });
    },
  };
}

export const api = {
  get(path: string) {
    console.warn(`[DEPRECATED] api.get("/${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/data/${path}`);
  },
  set(path: string, value: unknown) {
    console.warn(`[DEPRECATED] api.set("/${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/data/${path}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },
  update(path: string, partial: unknown) {
    console.warn(`[DEPRECATED] api.update("/${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/data/${path}`, {
      method: "PATCH",
      body: JSON.stringify({ value: partial }),
    });
  },
  push(path: string, value: unknown): Promise<{ id: string }> {
    console.warn(`[DEPRECATED] api.push("/${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/data/${path}`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  },
  remove(path: string) {
    console.warn(`[DEPRECATED] api.remove("/${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/data/${path}`, { method: "DELETE" });
  },
  transaction(path: string, _fn: unknown) {
    console.warn(`[DEPRECATED] api.transaction("/${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/data/${path}/transaction`, {
      method: "POST",
    });
  },
  submit(path: "partnerships" | "invest-early", data: Record<string, string>) {
    console.warn(`[DEPRECATED] api.submit("${path}") — migrate to dedicated endpoint`);
    return fetchJson(`/api/submit/${path}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
