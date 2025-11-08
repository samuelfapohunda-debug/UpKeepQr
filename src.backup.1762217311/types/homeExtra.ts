export interface HomeProfileExtra {
  ownerType?: "owner" | "landlord" | "pm" | "flipper";
  yearBuilt?: number;
  hvacBrand?: string;
  hvacAgeYears?: number;
  waterHeaterBrand?: string;
  insuranceProvider?: string;
  hasHoa?: boolean;
  marketingConsent?: boolean;
}
