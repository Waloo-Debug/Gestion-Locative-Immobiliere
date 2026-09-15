"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toErrorMessage } from "@/lib/errors";
import { notifyNotificationsChanged } from "@/lib/notifications";
import { fetchProperties } from "@/lib/properties";
import {
  confirmRentPaymentRequest,
  listRentPaymentPeriods,
  listRentPayments,
  resendQuittanceRequest,
  type RentPaymentRow,
} from "@/lib/rentPayments";
import { formatCityInfo, formatStreetAddress } from "@/lib/format";
import { currentPeriod, formatPeriodLabel } from "@/lib/receipts";
import type { Property } from "@/lib/types";

export const PERIOD_ALL = "all";
export const PROPERTY_ALL = "all";

export function paymentStatusLabel(row: RentPaymentRow) {
  if (row.status === "paid" && row.quittance_sent_at) return "Quittance envoyée";
  if (row.status === "paid") return "Payé";
  return "En attente";
}

export function periodFilterLabel(period: string) {
  if (!period || period === PERIOD_ALL) return "Tout l’historique";
  return formatPeriodLabel(period);
}

export function propertyFilterLabel(property: Property) {
  return `${formatStreetAddress(property)} — ${formatCityInfo(property)}`;
}

export function useReceiptsPage() {
  const [period, setPeriod] = useState(PERIOD_ALL);
  const [propertyId, setPropertyId] = useState(PROPERTY_ALL);
  const [periods, setPeriods] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<RentPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // À chaque chargement de page : aucun filtre bien, période = mois courant si dispo sinon tout l’historique.
    setPropertyId(PROPERTY_ALL);

    (async () => {
      const [nextProperties, nextPeriods] = await Promise.all([
        fetchProperties(),
        listRentPaymentPeriods(null),
      ]);
      if (cancelled) return;
      setProperties(nextProperties);
      setPeriods(nextPeriods);
      setPeriod(nextPeriods.includes(currentPeriod()) ? currentPeriod() : PERIOD_ALL);
      setReady(true);
    })().catch((err) => {
      if (cancelled) return;
      setError(toErrorMessage(err, "Impossible de charger les filtres."));
      setReady(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const selectedPropertyId = propertyId === PROPERTY_ALL ? null : propertyId;

    (async () => {
      const nextPeriods = await listRentPaymentPeriods(selectedPropertyId);
      if (cancelled) return;
      setPeriods(nextPeriods);

      let nextPeriod = period;
      if (nextPeriod !== PERIOD_ALL && !nextPeriods.includes(nextPeriod)) {
        nextPeriod = nextPeriods.includes(currentPeriod()) ? currentPeriod() : PERIOD_ALL;
        setPeriod(nextPeriod);
      }

      const rows = await listRentPayments({
        period: nextPeriod,
        propertyId: selectedPropertyId,
      });
      if (!cancelled) setPayments(rows);
    })()
      .catch((err) => {
        if (!cancelled) setError(toErrorMessage(err, "Impossible de charger les loyers."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, period, propertyId]);

  const reloadAfterAction = useCallback(async () => {
    const selectedPropertyId = propertyId === PROPERTY_ALL ? null : propertyId;
    const nextPeriods = await listRentPaymentPeriods(selectedPropertyId);
    setPeriods(nextPeriods);
    setPayments(
      await listRentPayments({
        period,
        propertyId: selectedPropertyId,
      }),
    );
  }, [period, propertyId]);

  const pending = useMemo(() => payments.filter((row) => row.status === "pending"), [payments]);
  const history = useMemo(() => payments, [payments]);
  const showPeriodColumn = period === PERIOD_ALL;

  async function confirmPayment(paymentId: string) {
    setActingId(paymentId);
    setActionError(null);
    setMessage(null);
    try {
      await confirmRentPaymentRequest(paymentId);
      await reloadAfterAction();
      notifyNotificationsChanged();
      window.setTimeout(() => notifyNotificationsChanged(), 1500);
      setMessage("Paiement confirmé. Quittance PDF envoyée au locataire.");
    } catch (err) {
      setActionError(toErrorMessage(err, "Confirmation impossible."));
    } finally {
      setActingId(null);
    }
  }

  async function resendQuittance(paymentId: string) {
    setActingId(paymentId);
    setActionError(null);
    setMessage(null);
    try {
      await resendQuittanceRequest(paymentId);
      await reloadAfterAction();
      notifyNotificationsChanged();
      window.setTimeout(() => notifyNotificationsChanged(), 1500);
      setMessage("Quittance renvoyée au locataire.");
    } catch (err) {
      setActionError(toErrorMessage(err, "Renvoi impossible."));
    } finally {
      setActingId(null);
    }
  }

  return {
    period,
    setPeriod,
    periods,
    propertyId,
    setPropertyId,
    properties,
    pending,
    history,
    showPeriodColumn,
    loading,
    actingId,
    message,
    error,
    actionError,
    confirmPayment,
    resendQuittance,
    periodFilterLabel,
    propertyFilterLabel,
  };
}
