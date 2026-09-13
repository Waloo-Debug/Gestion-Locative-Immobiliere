"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchDocuments } from "@/lib/documents";
import { fetchProperties } from "@/lib/properties";
import { getActiveTenants } from "@/lib/rentals";
import { uniqueQuittances } from "@/lib/receipts";
import type { DocumentRecord, Property } from "@/lib/types";

export function useOverviewDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchDocuments()])
      .then(([nextProperties, nextDocuments]) => {
        setProperties(nextProperties);
        setDocuments(nextDocuments);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const rented = properties.filter((property) => property.status === "Loué");
    const tenants = getActiveTenants(properties);
    const monthlyRevenue = rented.reduce(
      (sum, property) => sum + Number(property.base_rent_price || 0) + Number(property.service_charges || 0),
      0,
    );
    const occupancy = properties.length ? Math.round((rented.length / properties.length) * 100) : 0;

    return {
      propertyCount: properties.length,
      rentedCount: rented.length,
      tenantCount: tenants.length,
      monthlyRevenue,
      occupancy,
    };
  }, [properties]);

  const receipts = useMemo(
    () =>
      uniqueQuittances(documents)
        .slice(0, 8)
        .map((document) => ({
          ...document,
          property: properties.find((property) => property.id === document.property_id) ?? null,
        })),
    [documents, properties],
  );

  return { properties, documents, receipts, stats, loading };
}
