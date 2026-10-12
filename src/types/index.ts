export interface ExifData {
  cameraMake: string;
  cameraModel: string;
  lens: string;
  iso: number;
  aperture: string; // e.g., 'f/2.8'
  shutterSpeed: string; // e.g., '1/1000s'
  focalLength: string; // e.g., '85mm'
  colorSpace: 'sRGB' | 'Adobe RGB' | 'ProPhoto RGB' | 'Rec.2020';
  rawFormat: 'DNG' | 'CR3' | 'NEF' | 'ARW' | 'RAF' | 'TIFF' | 'JPEG';
  dimensions: { width: number; height: number };
  fileSize: string; // e.g. '42.8 MB'
  dateTaken: string;
  bitDepth: '14-bit Uncompressed RAW' | '16-bit Floating RAW' | '12-bit RAW' | '8-bit Standard';
}

export interface MaskAdjustments {
  exposure: number; // -3 to +3
  contrast: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -50 to 50
  clarity: number; // -100 to 100
  sharpness: number; // 0 to 100
}

export type MaskType = 'subject' | 'sky' | 'background' | 'face' | 'radial' | 'linear' | 'brush';

export interface MaskLayer {
  id: string;
  name: string;
  type: MaskType;
  enabled: boolean;
  inverted: boolean;
  feather: number; // 0 to 100
  adjustments: MaskAdjustments;
  // Geometric params for radial/linear
  params?: {
    centerX?: number; // 0-1
    centerY?: number; // 0-1
    radiusX?: number; // 0-1
    radiusY?: number; // 0-1
    angle?: number; // degrees
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    brushStrokes?: Array<{ x: number; y: number; r: number }>;
  };
}

export interface ColorWheelGrade {
  hue: number; // 0 to 360
  saturation: number; // 0 to 100
  luminance?: number; // -100 to 100
}

export interface EditAdjustments {
  // Exposure & Tone
  exposure: number; // -5 to +5 EV
  contrast: number; // -100 to +100
  highlights: number; // -100 to +100
  shadows: number; // -100 to +100
  whites: number; // -100 to +100
  blacks: number; // -100 to +100
  
  // White Balance & Color
  temperature: number; // 2000K to 10000K (default 5500K)
  tint: number; // -100 to +100 (green to magenta)
  vibrance: number; // -100 to +100
  saturation: number; // -100 to +100

  // Presence & Details
  clarity: number; // -100 to +100
  texture: number; // -100 to +100
  dehaze: number; // -100 to +100
  sharpness: number; // 0 to 150
  noiseReduction: number; // 0 to 100

  // Capture One Style Auto Retouch
  autoSkinSmooth: number; // 0 to 100
  autoSkinWarmth: number; // -50 to 50
  highlightRecovery: number; // 0 to 100 (Bayer RAW reconstruction)
  shadowLift: number; // 0 to 100

  // HSL Channels
  hsl: {
    hue: { red: number; orange: number; yellow: number; green: number; aqua: number; blue: number; purple: number; magenta: number };
    saturation: { red: number; orange: number; yellow: number; green: number; aqua: number; blue: number; purple: number; magenta: number };
    luminance: { red: number; orange: number; yellow: number; green: number; aqua: number; blue: number; purple: number; magenta: number };
  };

  // 3-Way Color Grading (Shadows, Midtones, Highlights)
  shadowTint: ColorWheelGrade;
  midtoneTint: ColorWheelGrade;
  highlightTint: ColorWheelGrade;
  colorGradingBlending?: number; // 0 to 100
  colorGradingBalance?: number; // -100 to 100

  // Vignette & Grain
  vignette: number; // -100 to 100
  grain: number; // 0 to 100

  // Tone Curve points [x, y] from 0 to 255
  toneCurve: {
    rgb: [number, number][];
    red: [number, number][];
    green: [number, number][];
    blue: [number, number][];
  };

  // AI Masks
  masks: MaskLayer[];
}

export type ColorLabel = 'none' | 'red' | 'yellow' | 'green' | 'blue' | 'purple';
export type FlagStatus = 'unflagged' | 'picked' | 'rejected';

export interface PhotoItem {
  id: string;
  name: string;
  originalFileName: string;
  url: string; // Preview / High-res image data
  thumbnailUrl: string;
  isRaw: boolean;
  exif: ExifData;
  rating: number; // 0 to 5
  colorLabel: ColorLabel;
  flag: FlagStatus;
  tags: string[];
  collection: string;
  dateAdded: string;
  adjustments: EditAdjustments;
  history: Array<{
    description: string;
    timestamp: number;
    adjustments: EditAdjustments;
  }>;
  cloudSyncStatus: 'synced' | 'pending' | 'local_only';
}

export interface PresetItem {
  id: string;
  name: string;
  category: 'Portrait' | 'Landscape' | 'Cinematic' | 'Vintage' | 'Commercial' | 'Black & White' | 'Custom';
  description: string;
  isCustom?: boolean;
  adjustments: Partial<EditAdjustments>;
}

export interface BatchExportSettings {
  format: 'jpeg' | 'webp' | 'png';
  quality: number; // 1 to 100
  scaleOption: 'original' | '4k' | '2k' | 'social' | 'custom';
  customMaxDimension?: number;
  namingTemplate: string; // e.g. '{name}_edited' or '{project}_{index}'
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkPosition: 'bottom-right' | 'bottom-left' | 'center' | 'top-right';
  watermarkOpacity: number;
  colorSpace: 'sRGB' | 'Adobe RGB';
  exportAsZip: boolean;
}

export interface DAMFilter {
  searchQuery: string;
  minRating: number;
  colorLabel: ColorLabel | 'all';
  flag: FlagStatus | 'all';
  cameraModel: string;
  collection: string;
  rawOnly: boolean;
  sortBy: 'dateAdded' | 'name' | 'rating' | 'iso';
  sortOrder: 'asc' | 'desc';
}
