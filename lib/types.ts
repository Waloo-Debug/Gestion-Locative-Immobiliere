export type PropertyType = "Appartement" | "Maison";
export type PropertyStatus = "Vacant" | "Loué" | "Vendu";

export interface Rental {
  id: string;
  property_id?: string;
  tenant_first_name: string;
  tenant_last_name: string;
  tenant2_first_name: string | null;
  tenant2_last_name: string | null;
  tenant_email: string;
  tenant_phone?: string | null;
  tenant_street_number?: string | null;
  tenant_street_name?: string | null;
  tenant_city?: string | null;
  tenant_postal_code?: string | null;
  entry_date: string;
  is_active?: boolean;
}

export interface Property {
  id: string;
  street_number: string;
  street_name: string;
  status?: string;
  apartment_number: string;
  floor: string;
  building_number: string;
  city: string;
  department: string;
  property_type: PropertyType;
  base_rent_price: number;
  service_charges: number;
  rentals: Rental[];
}

export interface DocumentRecord {
  id: string;
  property_id: string;
  rental_id?: string;
  file_name: string;
  document_type: "Bail" | "Quittance" | string;
  created_at?: string;
}

export interface OwnerProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  street_number?: string | null;
  street_name?: string | null;
  city?: string | null;
  postal_code?: string | null;
  /** Ancien champ libre, conservé en secours. */
  address?: string | null;
  quittance_generation_day?: number | null;
}

export interface OwnerProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetNumber: string;
  streetName: string;
  city: string;
  postalCode: string;
}

export interface IrlData {
  rate: number;
  quarter: string;
}

export interface PropertyFormValues {
  streetNumber: string;
  streetName: string;
  apartmentNumber: string;
  floor: string;
  buildingNumber: string;
  city: string;
  department: string;
  propertyType: PropertyType;
}

export interface TenantFormValues {
  t1FirstName: string;
  t1LastName: string;
  t2FirstName: string;
  t2LastName: string;
  tEmail: string;
  tPhone: string;
  tStreetNumber: string;
  tStreetName: string;
  tCity: string;
  tPostalCode: string;
  tEntryDate: string;
}

export interface PropertyOwnerCosts {
  id?: string;
  property_id: string;
  owner_id?: string | null;
  purchase_price: number;
  monthly_loan: number;
  monthly_loan_insurance: number;
  monthly_pno_insurance: number;
  monthly_condo_charges: number;
  monthly_management_fees: number;
  monthly_other: number;
  annual_property_tax: number;
  annual_cfe: number;
  annual_works_provision: number;
  annual_other: number;
  vacancy_months_per_year: number;
  annual_rent_increase_percent: number;
  notes: string | null;
  updated_at?: string;
}

export type OwnerCostFormValues = {
  purchasePrice: string;
  monthlyLoan: string;
  monthlyLoanInsurance: string;
  monthlyPnoInsurance: string;
  monthlyCondoCharges: string;
  monthlyManagementFees: string;
  monthlyOther: string;
  annualPropertyTax: string;
  annualCfe: string;
  annualWorksProvision: string;
  annualOther: string;
  vacancyMonthsPerYear: string;
  annualRentIncreasePercent: string;
  notes: string;
};
