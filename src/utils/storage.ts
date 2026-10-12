import { PhotoItem, PresetItem } from '../types';
import { INITIAL_SAMPLE_PHOTOS } from './samplePhotos';
import { BUILTIN_PRESETS } from './presets';

const STORAGE_KEY_PHOTOS = 'luminaraw_photos_v1';
const STORAGE_KEY_CUSTOM_PRESETS = 'luminaraw_custom_presets_v1';
const STORAGE_KEY_CLOUD_STATE = 'luminaraw_cloud_state_v1';

export interface CloudSyncState {
  deviceId: string;
  syncPairCode: string;
  lastSyncedTimestamp: number;
  cloudStorageUsedMb: number;
  autoSyncEnabled: boolean;
  status: 'synced' | 'syncing' | 'offline';
  pairedDevicesCount: number;
}

export function loadSavedPhotos(): PhotoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PHOTOS);
    if (!raw) {
      savePhotos(INITIAL_SAMPLE_PHOTOS);
      return INITIAL_SAMPLE_PHOTOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load photos from storage:', err);
  }
  return INITIAL_SAMPLE_PHOTOS;
}

export function savePhotos(photos: PhotoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(photos));
  } catch (err) {
    console.warn('Storage limit reached, attempting optimized photo state save', err);
  }
}

export function loadCustomPresets(): PresetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load custom presets:', err);
  }
  return [];
}

export function saveCustomPresets(presets: PresetItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(presets));
  } catch (err) {
    console.error('Failed to save custom presets:', err);
  }
}

export function loadCloudSyncState(): CloudSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOUD_STATE);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load cloud state:', err);
  }

  const defaultState: CloudSyncState = {
    deviceId: 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    syncPairCode: 'LUMINA-' + Math.floor(1000 + Math.random() * 9000),
    lastSyncedTimestamp: Date.now() - 120000,
    cloudStorageUsedMb: 345.8,
    autoSyncEnabled: true,
    status: 'synced',
    pairedDevicesCount: 3, // e.g. MacBook Pro M3, iPad Pro 13", Studio PC
  };
  saveCloudSyncState(defaultState);
  return defaultState;
}

export function saveCloudSyncState(state: CloudSyncState): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLOUD_STATE, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save cloud sync state:', err);
  }
}

/**
 * Creates a downloadable Cloud Backup JSON bundle containing all edits, presets, and catalog metadata
 */
export function exportCloudBackupBundle(photos: PhotoItem[], customPresets: PresetItem[]): void {
  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    system: 'LuminaRAW Studio Cloud Backup',
    photosCount: photos.length,
    presetsCount: customPresets.length,
    data: {
      photos,
      customPresets,
    },
  };

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LuminaRAW_Cloud_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
