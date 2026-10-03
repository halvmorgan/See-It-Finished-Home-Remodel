export type Mode = 'keep' | 'customize' | 'na';

export interface ExteriorPaintConfig {
  mode: Mode;
  color: string; // Hex or 'keep'
  customHex?: string;
  finish: 'keep' | 'matte' | 'satin' | 'semi-gloss';
}

export interface SidingAccentsConfig {
  mode: Mode;
  material: 'keep' | 'stucco' | 'wood' | 'brick' | 'stone';
  accentPlacement: 'full_facade' | 'lower_half_wainscot' | 'entryway_accent' | 'columns_only';
}

export interface RoofSolarConfig {
  mode: Mode;
  material: 'keep' | 'asphalt_shingles' | 'metal' | 'clay_tile' | 'concrete_tile' | 'slate';
  color: string; // 'keep' or color name/hex
  solarPanels: boolean;
}

export interface DrivewayConfig {
  mode: Mode;
  material: 'keep' | 'concrete' | 'pavers' | 'asphalt' | 'stamped_concrete' | 'exposed_aggregate';
  paverPattern?: 'herringbone' | 'running_bond' | 'ashlar';
}

export interface LandscapingConfig {
  mode: Mode;
  type: 'keep' | 'grass' | 'artificial_turf' | 'gravel' | 'drought_friendly';
  addLighting: boolean;
  addPlanterBeds: boolean;
}

export interface GarageDoorConfig {
  mode: Mode;
  style: 'keep' | 'modern_flat_panel' | 'carriage_house' | 'traditional_raised_panel' | 'modern_glass_panel';
  color: string; // 'keep' or hex/name
}

export interface FrontDoorConfig {
  mode: Mode;
  style: 'keep' | 'modern_slab' | 'craftsman' | 'traditional_panel' | 'glass_insert';
  color: string; // 'keep' or hex/name
}

export interface WindowsTrimConfig {
  mode: Mode;
  style: 'keep' | 'slim_modern' | 'traditional' | 'colonial_grid' | 'craftsman';
  trimColor: string; // 'keep' or hex/name
}

export interface MakeoverSelections {
  exteriorPaint: ExteriorPaintConfig;
  sidingAccents: SidingAccentsConfig;
  roofSolar: RoofSolarConfig;
  driveway: DrivewayConfig;
  landscaping: LandscapingConfig;
  garageDoor: GarageDoorConfig;
  frontDoor: FrontDoorConfig;
  windowsTrim: WindowsTrimConfig;
  customRequests: string;
}

export interface SampleHomePreset {
  id: string;
  name: string;
  subtitle: string;
  beforeImage: string;
  afterImage: string;
  defaultSelections: Partial<MakeoverSelections>;
}

export interface BillingPlan {
  id: 'single' | 'day_pass' | 'pro_monthly';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}
