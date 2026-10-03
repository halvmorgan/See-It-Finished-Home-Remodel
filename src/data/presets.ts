import { MakeoverSelections, SampleHomePreset, BillingPlan } from '../types/makeover';
import sampleRanchBefore from '../assets/images/sample_ranch_before_1790545233507.jpg';
import sampleRanchAfter from '../assets/images/sample_ranch_after_1790545244994.jpg';
import craftsmanBefore from '../assets/images/craftsman_before_1790545252629.jpg';
import craftsmanAfter from '../assets/images/craftsman_after_1790545262929.jpg';

export const INITIAL_SELECTIONS: MakeoverSelections = {
  exteriorPaint: {
    mode: 'keep',
    color: 'keep',
    customHex: '#1E293B',
    finish: 'keep',
  },
  sidingAccents: {
    mode: 'keep',
    material: 'keep',
    accentPlacement: 'entryway_accent',
  },
  roofSolar: {
    mode: 'keep',
    material: 'keep',
    color: 'keep',
    solarPanels: false,
  },
  driveway: {
    mode: 'keep',
    material: 'keep',
    paverPattern: 'herringbone',
  },
  landscaping: {
    mode: 'keep',
    type: 'keep',
    addLighting: false,
    addPlanterBeds: false,
  },
  garageDoor: {
    mode: 'keep',
    style: 'keep',
    color: 'keep',
  },
  frontDoor: {
    mode: 'keep',
    style: 'keep',
    color: 'keep',
  },
  windowsTrim: {
    mode: 'keep',
    style: 'keep',
    trimColor: 'keep',
  },
  customRequests: '',
};

export const SAMPLE_HOMES: SampleHomePreset[] = [
  {
    id: 'suburban-ranch',
    name: '1980s Suburban Ranch',
    subtitle: 'Classic single-story with tired facade & concrete driveway',
    beforeImage: sampleRanchBefore,
    afterImage: sampleRanchAfter,
    defaultSelections: {
      exteriorPaint: {
        mode: 'customize',
        color: '#1E293B', // Deep navy
        finish: 'satin',
      },
      sidingAccents: {
        mode: 'customize',
        material: 'wood',
        accentPlacement: 'entryway_accent',
      },
      roofSolar: {
        mode: 'customize',
        material: 'metal',
        color: '#0F172A',
        solarPanels: true,
      },
      driveway: {
        mode: 'customize',
        material: 'pavers',
      },
      landscaping: {
        mode: 'customize',
        type: 'drought_friendly',
        addLighting: true,
        addPlanterBeds: true,
      },
      garageDoor: {
        mode: 'customize',
        style: 'modern_flat_panel',
        color: '#1E293B',
      },
      frontDoor: {
        mode: 'customize',
        style: 'modern_slab',
        color: '#D97706',
      },
      windowsTrim: {
        mode: 'customize',
        style: 'slim_modern',
        trimColor: '#0F172A',
      },
    },
  },
  {
    id: 'craftsman-bungalow',
    name: '1920s Craftsman Bungalow',
    subtitle: 'Historic porch bungalow needing exterior curb appeal revival',
    beforeImage: craftsmanBefore,
    afterImage: craftsmanAfter,
    defaultSelections: {
      exteriorPaint: {
        mode: 'customize',
        color: '#0F2942', // Classic navy
        finish: 'satin',
      },
      sidingAccents: {
        mode: 'customize',
        material: 'wood',
        accentPlacement: 'entryway_accent',
      },
      roofSolar: {
        mode: 'customize',
        material: 'asphalt_shingles',
        color: '#334155',
        solarPanels: false,
      },
      driveway: {
        mode: 'customize',
        material: 'pavers',
      },
      landscaping: {
        mode: 'customize',
        type: 'grass',
        addLighting: true,
        addPlanterBeds: true,
      },
      frontDoor: {
        mode: 'customize',
        style: 'craftsman',
        color: '#0D9488', // Deep teal
      },
      windowsTrim: {
        mode: 'customize',
        style: 'craftsman',
        trimColor: '#F8FAFC', // Crisp white
      },
    },
  },
];

export const POPULAR_EXTERIOR_COLORS = [
  { name: 'Coastal Navy', hex: '#1E293B', desc: 'Modern & commanding' },
  { name: 'Architectural Teal', hex: '#0D9488', desc: 'Distinctive designer accent' },
  { name: 'Crisp Off-White', hex: '#F8FAFC', desc: 'Timeless brightness' },
  { name: 'Warm Charcoal', hex: '#334155', desc: 'Contemporary contrast' },
  { name: 'Modern Greige', hex: '#D6D3D1', desc: 'Balanced neutral' },
  { name: 'Sage Olive', hex: '#4A5D4E', desc: 'Earth-grounded elegance' },
  { name: 'Rich Terracotta', hex: '#C2410C', desc: 'Warm Spanish & desert warmth' },
  { name: 'Deep Onyx', hex: '#09090B', desc: 'Striking Nordic modern' },
];

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'single',
    name: 'Pay-Per-Makeover',
    price: 9.99,
    period: 'per generation',
    description: 'Perfect for homeowners testing a single curb appeal vision.',
    features: [
      '1 Ultra HD Photorealistic AI Makeover',
      'Full preservation guarantee of structure & surroundings',
      'Interactive before & after slider download',
      'Standard turnaround (~15-30s)',
    ],
  },
  {
    id: 'day_pass',
    name: '24-Hour Design Session',
    price: 29.0,
    period: 'one-time 24h pass',
    isPopular: true,
    description: 'Designed for active house flippers, architects & real estate listings.',
    features: [
      'Unlimited exterior AI generations for 24 hours',
      'Test endless color, siding & roof combinations',
      'Client presentation watermark-free exports',
      'Priority rendering queue',
      'High-res side-by-side printable cards',
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Contractor / Realtor',
    price: 79.0,
    period: 'per month',
    description: 'For contractors, realtors & exterior remodeling firms.',
    features: [
      'Unlimited monthly makeover renders',
      'Custom branding on before-and-after download cards',
      'Commercial client proposals & contractor scopes',
      'Direct client shareable preview links',
      'VIP support from our team',
    ],
  },
];
