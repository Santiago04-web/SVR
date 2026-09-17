import { getSupabaseClient, getStoredSupabaseConfig } from './supabaseClient';
import { useFinanceStore } from '../store/useFinanceStore';

export type CloudSyncStatus =
  | 'unconfigured'
  | 'connecting'
  | 'synced'
  | 'syncing'
  | 'offline'
  | 'error';

type StatusListener = (status: CloudSyncStatus, message?: string) => void;

class CloudSyncEngine {
  private status: CloudSyncStatus = 'unconfigured';
  private statusListeners: Set<StatusListener> = new Set();
  private channel: any = null;
  private isApplyingRemoteUpdate = false;
  private debounceTimer: any = null;
  private lastSyncedHash = '';

  constructor() {
    // Listen to window online / offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getStatus(): CloudSyncStatus {
    return this.status;
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(status: CloudSyncStatus, message?: string) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status, message));
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.setStatus('offline', 'Sin conexión a internet');
    } else {
      this.init();
    }
  }

  public async init() {
    const config = getStoredSupabaseConfig();
    if (!config.isEnabled || !config.url || !config.anonKey) {
      this.setStatus('unconfigured', 'Configura Supabase para sincronizar en tiempo real');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      this.setStatus('error', 'No se pudo conectar a Supabase');
      return;
    }

    this.setStatus('connecting', 'Conectando con Supabase...');

    try {
      const vaultId = config.syncPin || 'svr-2026';

      // 1. Pull latest state from Supabase
      const { data, error } = await client
        .from('user_finances')
        .select('*')
        .eq('vault_id', vaultId)
        .maybeSingle();

      if (error) {
        // If table doesn't exist yet or permission error
        console.warn('Supabase pull note:', error.message);
        this.setStatus('error', `Error al consultar: ${error.message}`);
      } else if (data && data.state_json) {
        // If remote data exists, apply to store
        try {
          const parsed = typeof data.state_json === 'string' ? JSON.parse(data.state_json) : data.state_json;
          this.isApplyingRemoteUpdate = true;
          useFinanceStore.getState().importJSON(JSON.stringify(parsed));
          this.isApplyingRemoteUpdate = false;
          this.lastSyncedHash = JSON.stringify(parsed);
          this.setStatus('synced', 'Sincronizado en la nube');
        } catch (e) {
          console.error('Failed to parse remote financial JSON:', e);
        }
      } else {
        // First time initialization: push current local state to cloud
        await this.pushLocalToRemote();
      }

      // 2. Subscribe to Realtime Postgres Changes
      this.setupRealtimeSubscription(vaultId);
    } catch (err: any) {
      console.error('Error in Supabase sync init:', err);
      this.setStatus('error', err.message || 'Error de sincronización');
    }
  }

  private setupRealtimeSubscription(vaultId: string) {
    const client = getSupabaseClient();
    if (!client) return;

    if (this.channel) {
      client.removeChannel(this.channel);
    }

    this.channel = client
      .channel(`finances_channel_${vaultId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_finances',
          filter: `vault_id=eq.${vaultId}`,
        },
        (payload: any) => {
          if (!payload.new || !payload.new.state_json) return;

          const remoteJson = payload.new.state_json;
          const remoteStr = typeof remoteJson === 'string' ? remoteJson : JSON.stringify(remoteJson);

          // Prevent infinite loops if this update originated locally
          if (remoteStr === this.lastSyncedHash) return;

          try {
            this.isApplyingRemoteUpdate = true;
            useFinanceStore.getState().importJSON(remoteStr);
            this.lastSyncedHash = remoteStr;
            this.setStatus('synced', 'Actualizado desde otro dispositivo');
            setTimeout(() => {
              this.isApplyingRemoteUpdate = false;
            }, 500);
          } catch (e) {
            console.error('Error applying realtime update:', e);
            this.isApplyingRemoteUpdate = false;
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.setStatus('synced', '🟢 Sincronizado en vivo');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.setStatus('error', 'Canal en tiempo real desconectado');
        }
      });
  }

  public triggerLocalStateChanged() {
    if (this.isApplyingRemoteUpdate) return;

    const config = getStoredSupabaseConfig();
    if (!config.isEnabled || !config.url || !config.anonKey) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.pushLocalToRemote();
    }, 600); // 600ms debounce
  }

  public async pushLocalToRemote(): Promise<boolean> {
    const config = getStoredSupabaseConfig();
    const client = getSupabaseClient();
    if (!client || !config.isEnabled) return false;

    try {
      this.setStatus('syncing', 'Subiendo cambios a la nube...');
      const vaultId = config.syncPin || 'svr-2026';
      const storeJson = useFinanceStore.getState().exportJSON();
      const payloadData = JSON.parse(storeJson);

      this.lastSyncedHash = storeJson;

      const { error } = await client.from('user_finances').upsert(
        {
          vault_id: vaultId,
          state_json: payloadData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'vault_id' }
      );

      if (error) {
        console.error('Error pushing to Supabase:', error);
        this.setStatus('error', `Error al subir: ${error.message}`);
        return false;
      }

      this.setStatus('synced', '🟢 Sincronizado en vivo');
      return true;
    } catch (err: any) {
      console.error('Failed pushing to remote:', err);
      this.setStatus('error', err.message || 'Error al sincronizar');
      return false;
    }
  }

  public disconnect() {
    const client = getSupabaseClient();
    if (client && this.channel) {
      client.removeChannel(this.channel);
      this.channel = null;
    }
    this.setStatus('unconfigured', 'Sincronización desactivada');
  }
}

export const cloudSyncEngine = new CloudSyncEngine();
