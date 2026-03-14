export interface AttomPropertyData {
  attomId: string;
  yearBuilt: number | null;
  squareFootage: number | null;
  homeType: 'single_family' | 'condo' | 'townhouse' | 'mobile' | null;
  hvacType: 'central_air' | 'heat_pump' | 'window_unit' | 'none' | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: number | null;
  hasPool: boolean;
  garage: boolean;
  county: string | null;
  rawData: object;
}

function mapHomeType(proptype?: string, propsubtype?: string): AttomPropertyData['homeType'] {
  const val = `${proptype ?? ''} ${propsubtype ?? ''}`.toLowerCase();
  if (val.includes('condo')) return 'condo';
  if (val.includes('townhouse') || val.includes('townhome')) return 'townhouse';
  if (val.includes('mobile') || val.includes('manufactured')) return 'mobile';
  if (val.includes('single') || val.includes('sfr') || val.includes('residential')) return 'single_family';
  return null;
}

function mapHvacType(coolingtype?: string, heatingtype?: string): AttomPropertyData['hvacType'] {
  const combined = `${coolingtype ?? ''} ${heatingtype ?? ''}`.toLowerCase();
  if (combined.includes('heat pump')) return 'heat_pump';
  if (combined.includes('window')) return 'window_unit';
  if (combined.includes('central') || combined.includes('forced air')) return 'central_air';
  if (!coolingtype && !heatingtype) return null;
  return 'none';
}

export async function lookupProperty(address1: string, address2: string): Promise<AttomPropertyData | null> {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ ATTOM_API_KEY not configured — skipping property lookup');
    return null;
  }

  try {
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail');
    url.searchParams.set('address1', address1);
    url.searchParams.set('address2', address2);

    const response = await fetch(url.toString(), {
      headers: { apikey: apiKey, Accept: 'application/json' },
    });

    if (!response.ok) {
      console.warn(`⚠️ ATTOM API ${response.status} for: ${address1}, ${address2}`);
      return null;
    }

    const json = await response.json() as Record<string, any>;
    const properties = json?.property;
    if (!Array.isArray(properties) || properties.length === 0) return null;

    const prop = properties[0];
    const summary   = prop.summary   ?? {};
    const building  = prop.building  ?? {};
    const lot       = prop.lot       ?? {};
    const utilities = prop.utilities ?? {};
    const area      = prop.area      ?? {};

    return {
      attomId:       String(prop.identifier?.attomId ?? ''),
      yearBuilt:     summary.yearbuilt ?? null,
      squareFootage: building.size?.livingsize ?? building.size?.universalsize ?? null,
      homeType:      mapHomeType(summary.proptype, summary.propsubtype),
      hvacType:      mapHvacType(utilities.coolingtype, utilities.heatingtype),
      bedrooms:      building.rooms?.beds ?? null,
      bathrooms:     building.rooms?.bathstotal ?? null,
      lotSize:       lot.lotsize2 ?? null,
      hasPool:       lot.poolind === 'YES',
      garage:        (building.parking?.prkgSize ?? 0) > 0,
      county:        area.countrysecsubd ?? null,
      rawData:       prop,
    };
  } catch (err) {
    console.error('❌ ATTOM lookup failed:', err);
    return null;
  }
}
