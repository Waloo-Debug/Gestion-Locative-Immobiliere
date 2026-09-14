"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllOwnerCosts } from "@/lib/ownerCosts";
import { fetchProperties } from "@/lib/properties";
import { profitabilitySummary } from "@/lib/profitability";
import { toErrorMessage } from "@/lib/errors";
import type { Property, PropertyOwnerCosts } from "@/lib/types";

export function useCalculatorOverview() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [costs, setCosts] = useState<PropertyOwnerCosts[]>([]);
  const [missingTable, setMissingTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchAllOwnerCosts()])
      .then(([nextProperties, costsResult]) => {
        setProperties(nextProperties);
        setCosts(costsResult.data);
        setMissingTable(costsResult.missingTable);
      })
      .catch((err) => setError(toErrorMessage(err, "Impossible de charger le calculateur.")))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(
    () =>
      properties.map((property) => {
        const propertyCosts = costs.find((item) => item.property_id === property.id) ?? null;
        const summary = propertyCosts
          ? profitabilitySummary(propertyCosts, Number(property.base_rent_price || 0))
          : null;
        return { property, costs: propertyCosts, summary };
      }),
    [properties, costs],
  );

  return { rows, missingTable, loading, error };
}
