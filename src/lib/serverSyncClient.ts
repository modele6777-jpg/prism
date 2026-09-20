import type { SharedState } from './sharedState';

export const PAIRED_VAULT_KEY = 'prism_paired_vault_id';
export const PAIRED_SYNC_CHANNEL_NAME = 'prism_paired_realtime_sync';

export function getPairedVaultId(): string | null {
  try {
    return localStorage.getItem(PAIRED_VAULT_KEY) || null;
  } catch {
    return null;
  }
}

export function setPairedVaultId(vaultId: string | null): void {
  try {
    if (vaultId && vaultId.trim()) {
      localStorage.setItem(PAIRED_VAULT_KEY, vaultId.trim());
    } else {
      localStorage.removeItem(PAIRED_VAULT_KEY);
    }
  } catch {
    // ignore
  }
}

function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function pushToServerVault(uid: string, state: SharedState): Promise<boolean> {
  if (!uid) return false;
  try {
    const res = await fetchWithTimeout('/api/sync/vault/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, payload: state }),
    }, 8000);
    return res.ok;
  } catch (e) {
    console.warn('[ServerVault] push failed:', e);
    return false;
  }
}

export async function pullFromServerVault(uid: string): Promise<SharedState | null> {
  if (!uid) return null;
  try {
    const res = await fetchWithTimeout('/api/sync/vault/pull/' + encodeURIComponent(uid), {}, 8000);
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data as SharedState;
    }
    return null;
  } catch (e) {
    console.warn('[ServerVault] pull failed:', e);
    return null;
  }
}

export async function pushToPairedVault(state: SharedState): Promise<boolean> {
  const vaultId = getPairedVaultId();
  if (!vaultId) return false;
  return await pushToServerVault(vaultId, state);
}

export async function pullFromPairedVault(): Promise<SharedState | null> {
  const vaultId = getPairedVaultId();
  if (!vaultId) return null;
  return await pullFromServerVault(vaultId);
}

export async function generatePairingCode(state: SharedState): Promise<{ code: string; vaultId?: string; expiresAt: number } | null> {
  try {
    const currentVaultId = getPairedVaultId();
    const res = await fetchWithTimeout('/api/sync/relay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: state, vaultId: currentVaultId || undefined }),
    }, 15000);
    if (!res.ok) {
      console.warn('[PairingRelay] generate response not ok:', res.status);
      return null;
    }
    const json = await res.json();
    if (json?.vaultId) {
      setPairedVaultId(json.vaultId);
    }
    return json;
  } catch (e) {
    console.warn('[PairingRelay] generate failed:', e);
    return null;
  }
}

export async function importWithPairingCode(code: string): Promise<SharedState | null> {
  try {
    const cleanCode = (code || '').trim().replace(/[^0-9]/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      console.warn('[PairingRelay] Invalid code format (must be 6 digits):', cleanCode);
      return null;
    }
    const res = await fetchWithTimeout('/api/sync/relay/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode }),
    }, 15000);
    if (!res.ok) {
      console.warn('[PairingRelay] consume response not ok:', res.status);
      return null;
    }
    const json = await res.json();
    if (json?.success && json?.payload) {
      const assignedVaultId = json.vaultId || `pin_${cleanCode}`;
      setPairedVaultId(assignedVaultId);
      return json.payload as SharedState;
    }
    console.warn('[PairingRelay] consume returned unsuccess payload:', json);
    return null;
  } catch (e) {
    console.warn('[PairingRelay] consume failed:', e);
    return null;
  }
}

