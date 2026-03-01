import { useEffect, useState, useCallback } from 'react';
import { db } from '../db';
import type { ClinicConfig } from '../db/schemas';
import * as q from '../db/queries/config';

export function useConfig() {
  const [config, setConfig] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await q.getConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', doc_ids: ['config_clinic'] });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [fetch]);

  return { config, loading, refetch: fetch };
}

export const updateConfig = q.updateConfig;
export const saveSyncCredentials = q.saveSyncCredentials;
export const clearSyncCredentials = q.clearSyncCredentials;
