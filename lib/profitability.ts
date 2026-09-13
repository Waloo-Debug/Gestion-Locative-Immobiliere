import type { OwnerCostFormValues, PropertyOwnerCosts } from "./types";

export const emptyOwnerCostForm: OwnerCostFormValues = {
  purchasePrice: "",
  monthlyLoan: "",
  monthlyLoanInsurance: "",
  monthlyPnoInsurance: "",
  monthlyCondoCharges: "",
  monthlyManagementFees: "",
  monthlyOther: "",
  annualPropertyTax: "",
  annualCfe: "",
  annualWorksProvision: "",
  annualOther: "",
  vacancyMonthsPerYear: "",
  annualRentIncreasePercent: "",
  notes: "",
};

function n(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formToOwnerCosts(propertyId: string, form: OwnerCostFormValues, ownerId?: string | null): PropertyOwnerCosts {
  return {
    property_id: propertyId,
    owner_id: ownerId ?? null,
    purchase_price: n(form.purchasePrice),
    monthly_loan: n(form.monthlyLoan),
    monthly_loan_insurance: n(form.monthlyLoanInsurance),
    monthly_pno_insurance: n(form.monthlyPnoInsurance),
    monthly_condo_charges: n(form.monthlyCondoCharges),
    monthly_management_fees: n(form.monthlyManagementFees),
    monthly_other: n(form.monthlyOther),
    annual_property_tax: n(form.annualPropertyTax),
    annual_cfe: n(form.annualCfe),
    annual_works_provision: n(form.annualWorksProvision),
    annual_other: n(form.annualOther),
    vacancy_months_per_year: n(form.vacancyMonthsPerYear),
    annual_rent_increase_percent: n(form.annualRentIncreasePercent),
    notes: form.notes.trim() || null,
  };
}

export function ownerCostsToForm(costs: PropertyOwnerCosts | null): OwnerCostFormValues {
  if (!costs) return emptyOwnerCostForm;
  const money = (value: number) => (value ? String(value) : "");
  return {
    purchasePrice: money(costs.purchase_price),
    monthlyLoan: money(costs.monthly_loan),
    monthlyLoanInsurance: money(costs.monthly_loan_insurance),
    monthlyPnoInsurance: money(costs.monthly_pno_insurance),
    monthlyCondoCharges: money(costs.monthly_condo_charges),
    monthlyManagementFees: money(costs.monthly_management_fees),
    monthlyOther: money(costs.monthly_other),
    annualPropertyTax: money(costs.annual_property_tax),
    annualCfe: money(costs.annual_cfe),
    annualWorksProvision: money(costs.annual_works_provision),
    annualOther: money(costs.annual_other),
    vacancyMonthsPerYear: money(costs.vacancy_months_per_year),
    annualRentIncreasePercent: money(costs.annual_rent_increase_percent),
    notes: costs.notes || "",
  };
}

export function occupancyFactor(vacancyMonths: number) {
  return Math.max(0, (12 - Math.min(12, Math.max(0, vacancyMonths))) / 12);
}

export function monthlyOwnerCost(costs: PropertyOwnerCosts) {
  return (
    n(costs.monthly_loan) +
    n(costs.monthly_loan_insurance) +
    n(costs.monthly_pno_insurance) +
    n(costs.monthly_condo_charges) +
    n(costs.monthly_management_fees) +
    n(costs.monthly_other) +
    n(costs.annual_property_tax) / 12 +
    n(costs.annual_cfe) / 12 +
    n(costs.annual_works_provision) / 12 +
    n(costs.annual_other) / 12
  );
}

export function breakEvenMonthlyRent(costs: PropertyOwnerCosts) {
  const factor = occupancyFactor(costs.vacancy_months_per_year);
  if (factor === 0) return monthlyOwnerCost(costs);
  return monthlyOwnerCost(costs) / factor;
}

export function yearlyProjection(
  costs: PropertyOwnerCosts,
  currentMonthlyRent: number,
  years = 15,
) {
  const increase = n(costs.annual_rent_increase_percent) / 100;
  const occupancy = occupancyFactor(costs.vacancy_months_per_year);
  const annualCosts = monthlyOwnerCost(costs) * 12;
  const rows: {
    year: number;
    rent: number;
    expenses: number;
    cashflow: number;
    cumulative: number;
  }[] = [];

  let cumulative = 0;
  for (let year = 1; year <= years; year += 1) {
    const rent = currentMonthlyRent * 12 * occupancy * (1 + increase) ** (year - 1);
    const cashflow = rent - annualCosts;
    cumulative += cashflow;
    rows.push({ year, rent, expenses: annualCosts, cashflow, cumulative });
  }
  return rows;
}

export function profitabilitySummary(costs: PropertyOwnerCosts, currentMonthlyRent: number) {
  const monthlyCost = monthlyOwnerCost(costs);
  const occupancy = occupancyFactor(costs.vacancy_months_per_year);
  const expectedMonthlyRent = currentMonthlyRent * occupancy;
  const breakEven = breakEvenMonthlyRent(costs);
  const monthlyCashflow = expectedMonthlyRent - monthlyCost;
  const purchase = n(costs.purchase_price);
  const grossYield = purchase > 0 ? ((currentMonthlyRent * 12) / purchase) * 100 : null;
  const netYield = purchase > 0 ? (((currentMonthlyRent - monthlyCost) * 12) / purchase) * 100 : null;

  return {
    monthlyCost,
    annualCost: monthlyCost * 12,
    occupancy,
    breakEven,
    monthlyCashflow,
    annualCashflow: monthlyCashflow * 12,
    grossYield,
    netYield,
    rentGap: currentMonthlyRent - breakEven,
  };
}

export type CostSlice = { key: string; label: string; value: number; color: string };

export function monthlyCostBreakdown(costs: PropertyOwnerCosts): CostSlice[] {
  const slices: CostSlice[] = [
    { key: "loan", label: "Crédit", value: n(costs.monthly_loan), color: "#60a5fa" },
    { key: "loanInsurance", label: "Ass. emprunteur", value: n(costs.monthly_loan_insurance), color: "#818cf8" },
    { key: "pno", label: "Ass. PNO", value: n(costs.monthly_pno_insurance), color: "#a78bfa" },
    { key: "condo", label: "Charges", value: n(costs.monthly_condo_charges), color: "#f59e0b" },
    { key: "management", label: "Gestion", value: n(costs.monthly_management_fees), color: "#f97316" },
    { key: "monthlyOther", label: "Autres / mois", value: n(costs.monthly_other), color: "#94a3b8" },
    { key: "tax", label: "Taxe foncière", value: n(costs.annual_property_tax) / 12, color: "#f87171" },
    { key: "cfe", label: "CFE", value: n(costs.annual_cfe) / 12, color: "#fb7185" },
    { key: "works", label: "Travaux", value: n(costs.annual_works_provision) / 12, color: "#34d399" },
    { key: "annualOther", label: "Autres / an", value: n(costs.annual_other) / 12, color: "#2dd4bf" },
  ];
  return slices.filter((slice) => slice.value > 0.005);
}

export function rentSimulationRange(storedRent: number, breakEven: number) {
  const anchor = Math.max(storedRent, breakEven, 100);
  const min = Math.max(0, Math.floor(anchor * 0.4 / 10) * 10);
  const max = Math.ceil(Math.max(anchor * 1.8, breakEven * 1.5, storedRent + 200) / 10) * 10;
  return { min, max, step: 10 };
}
