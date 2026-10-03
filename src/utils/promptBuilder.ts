import { MakeoverSelections } from '../types/makeover';

/**
 * Constructs the architectural transformation prompt following the strict preservation constraints:
 * - Change ONLY selected, visible features.
 * - Preserve the home's structure, proportions, camera angle, roof shape, openings, neighbors, and surroundings.
 * - Never invent missing features.
 * - Optional requests must respect these preservation rules.
 */
export function buildMakeoverPrompt(selections: MakeoverSelections): {
  systemPrompt: string;
  userPrompt: string;
  changesSummary: string[];
} {
  const changes: string[] = [];

  // Exterior Paint
  if (selections.exteriorPaint.mode === 'customize') {
    const colorDesc = selections.exteriorPaint.customHex || selections.exteriorPaint.color;
    const finishDesc = selections.exteriorPaint.finish !== 'keep' ? ` with a ${selections.exteriorPaint.finish} architectural exterior finish` : '';
    if (colorDesc !== 'keep') {
      changes.push(`Repaint the primary exterior facade in ${colorDesc}${finishDesc}, maintaining existing trim edges.`);
    }
  }

  // Siding & Accents
  if (selections.sidingAccents.mode === 'customize' && selections.sidingAccents.material !== 'keep') {
    const matName = selections.sidingAccents.material;
    const placementMap: Record<string, string> = {
      full_facade: 'across the main facade',
      lower_half_wainscot: 'along the lower foundation wainscot section',
      entryway_accent: 'accenting the front entryway alcove',
      columns_only: 'wrapping the front porch columns',
    };
    const place = placementMap[selections.sidingAccents.accentPlacement] || 'as an architectural accent';
    changes.push(`Apply high-end ${matName} cladding ${place} with realistic seams and natural texture.`);
  }

  // Roof & Solar
  if (selections.roofSolar.mode === 'customize') {
    const parts: string[] = [];
    if (selections.roofSolar.material !== 'keep') {
      const matMap: Record<string, string> = {
        asphalt_shingles: 'architectural dimensional asphalt shingles',
        metal: 'standing seam architectural metal roofing',
        clay_tile: 'Spanish S-tile clay terracotta roof tiles',
        concrete_tile: 'modern flat profile concrete roof tiles',
        slate: 'natural quarried slate shingles',
      };
      const mat = matMap[selections.roofSolar.material] || selections.roofSolar.material;
      const colorText = selections.roofSolar.color !== 'keep' ? ` in ${selections.roofSolar.color}` : '';
      parts.push(`Upgrade the roof surface material to ${mat}${colorText} while strictly retaining the exact slope, dormers, and ridges`);
    }
    if (selections.roofSolar.solarPanels) {
      parts.push(`Install sleek, low-profile all-black solar panel arrays integrated cleanly onto the sun-facing roof planes`);
    }
    if (parts.length > 0) {
      changes.push(parts.join('; '));
    }
  }

  // Driveway
  if (selections.driveway.mode === 'customize' && selections.driveway.material !== 'keep') {
    const driveMap: Record<string, string> = {
      concrete: 'smooth brushed architectural concrete driveway with crisp expansion joints',
      pavers: 'interlocking natural stone/concrete permeable pavers with crisp borders',
      asphalt: 'freshly paved smooth dark asphalt driveway with clean edges',
      stamped_concrete: 'decorative stamped slate-pattern concrete driveway',
      exposed_aggregate: 'fine exposed pebble aggregate driveway surface',
    };
    changes.push(`Replace the driveway surface with ${driveMap[selections.driveway.material] || selections.driveway.material}.`);
  }

  // Landscaping
  if (selections.landscaping.mode === 'customize') {
    const landParts: string[] = [];
    if (selections.landscaping.type !== 'keep') {
      const landMap: Record<string, string> = {
        grass: 'vibrant, healthy lush manicured green sod grass lawn',
        artificial_turf: 'pristine luxury artificial turf lawn with clean paver edging',
        gravel: 'clean modern xeriscape with decomposed granite, decorative river rock, and drought-hardy accents',
        drought_friendly: 'modern architectural drought-friendly garden with ornamental grasses, agaves, and mulch beds',
      };
      landParts.push(landMap[selections.landscaping.type]);
    }
    if (selections.landscaping.addPlanterBeds) {
      landParts.push('add neat geometric mulched garden planter beds flanking the foundation');
    }
    if (selections.landscaping.addLighting) {
      landParts.push('subtle low-voltage warm architectural pathway and tree uplighting');
    }
    if (landParts.length > 0) {
      changes.push(`Update front landscaping: ${landParts.join(', ')}.`);
    }
  }

  // Garage Door
  if (selections.garageDoor.mode === 'customize' && selections.garageDoor.style !== 'keep') {
    const garageMap: Record<string, string> = {
      modern_flat_panel: 'sleek flush contemporary flat-panel garage door',
      carriage_house: 'classic carriage-house style garage door with hardware and cross-buck trim',
      traditional_raised_panel: 'clean traditional raised-panel garage door',
      modern_glass_panel: 'contemporary anodized aluminum frame garage door with frosted privacy glass panels',
    };
    const col = selections.garageDoor.color !== 'keep' ? ` in ${selections.garageDoor.color}` : '';
    changes.push(`Replace existing garage door with a ${garageMap[selections.garageDoor.style]}${col}.`);
  }

  // Front Door
  if (selections.frontDoor.mode === 'customize' && selections.frontDoor.style !== 'keep') {
    const doorMap: Record<string, string> = {
      modern_slab: 'modern smooth solid slab front entry door with modern horizontal pull bar',
      craftsman: 'authentic Craftsman style front door with dentil shelf and upper divided glass lights',
      traditional_panel: 'six-panel formal traditional front door',
      glass_insert: 'contemporary front door with frosted vertical frosted glass insert lights',
    };
    const col = selections.frontDoor.color !== 'keep' ? ` painted in ${selections.frontDoor.color}` : '';
    changes.push(`Replace the front entrance door with a ${doorMap[selections.frontDoor.style]}${col}.`);
  }

  // Windows & Trim
  if (selections.windowsTrim.mode === 'customize') {
    const winParts: string[] = [];
    if (selections.windowsTrim.style !== 'keep') {
      const winMap: Record<string, string> = {
        slim_modern: 'slim low-profile black-framed contemporary windows',
        traditional: 'classic double-hung windows with clean casing',
        colonial_grid: 'colonial divided lite multi-pane window grids',
        craftsman: 'Craftsman style windows with top-sash multi-lite divisions',
      };
      winParts.push(winMap[selections.windowsTrim.style]);
    }
    if (selections.windowsTrim.trimColor !== 'keep') {
      winParts.push(`paint all window casings and exterior trim in ${selections.windowsTrim.trimColor}`);
    }
    if (winParts.length > 0) {
      changes.push(`Update window styling and trim: ${winParts.join('; ')}.`);
    }
  }

  // Custom Requests (max 1,200 chars)
  const sanitizedCustom = (selections.customRequests || '').trim().slice(0, 1200);

  const systemPrompt = `You are a world-class architectural visualization and exterior remodeling specialist.
Your mission is to generate a realistic, photorealistic after-makeover photograph of the user's home based strictly on the provided image and selected upgrades.

CRITICAL PRESERVATION DIRECTIVES:
1. PRESERVE GEOMETRY: You must strictly preserve the house's original structural framework, camera angle, perspective, story count, roofline pitch, and building outline.
2. PRESERVE OPENINGS: Do not move, add, or delete door or window openings. Only replace the finishes, styles, frames, or colors within existing structural footprints.
3. PRESERVE SURROUNDINGS: Keep neighbor houses, background trees, sky position, and ambient lighting realism consistent with the original photo.
4. TARGETED UPGRADES ONLY: Apply ONLY the explicit upgrades requested. Every area designated as 'Keep existing' or not listed must remain exactly as shown in the original photo.
5. NO INVENTED FEATURES: Never invent balconies, additions, or wings not present in the original photograph.
6. OUTPUT QUALITY: Deliver a crisp, high-resolution architectural real estate photograph with authentic physical textures, realistic shadows, and accurate material reflectance.`;

  const userPromptLines: string[] = [
    'Execute a photorealistic architectural exterior makeover of the home shown in this photo.',
    'Apply the following specific upgrades to the visible areas:',
  ];

  if (changes.length === 0 && !sanitizedCustom) {
    userPromptLines.push('- Refresh curb appeal with clean modern finishes while preserving the entire structure.');
  } else {
    changes.forEach((change, idx) => {
      userPromptLines.push(`${idx + 1}. ${change}`);
    });
  }

  if (sanitizedCustom) {
    userPromptLines.push(`Additional architectural requests (must adhere strictly to structural preservation): ${sanitizedCustom}`);
  }

  userPromptLines.push(
    'Remember: Change ONLY the selected visible elements above. Keep everything else strictly identical to the original photo.'
  );

  return {
    systemPrompt,
    userPrompt: userPromptLines.join('\n'),
    changesSummary: changes,
  };
}

export function countSelectedUpgrades(selections: MakeoverSelections): number {
  let count = 0;
  if (selections.exteriorPaint.mode === 'customize' && selections.exteriorPaint.color !== 'keep') count++;
  if (selections.sidingAccents.mode === 'customize' && selections.sidingAccents.material !== 'keep') count++;
  if (selections.roofSolar.mode === 'customize' && (selections.roofSolar.material !== 'keep' || selections.roofSolar.solarPanels)) count++;
  if (selections.driveway.mode === 'customize' && selections.driveway.material !== 'keep') count++;
  if (selections.landscaping.mode === 'customize' && (selections.landscaping.type !== 'keep' || selections.landscaping.addLighting || selections.landscaping.addPlanterBeds)) count++;
  if (selections.garageDoor.mode === 'customize' && (selections.garageDoor.style !== 'keep' || selections.garageDoor.color !== 'keep')) count++;
  if (selections.frontDoor.mode === 'customize' && (selections.frontDoor.style !== 'keep' || selections.frontDoor.color !== 'keep')) count++;
  if (selections.windowsTrim.mode === 'customize' && (selections.windowsTrim.style !== 'keep' || selections.windowsTrim.trimColor !== 'keep')) count++;
  if (selections.customRequests.trim().length > 0) count++;
  return count;
}
