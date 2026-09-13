"use client";

import { useEffect } from "react";
import { autoGenerateCurrentMonthReceipts, currentPeriod } from "@/lib/receipts";

export function useAutoGenerateReceipts() {
  useEffect(() => {
    const period = currentPeriod();
    const key = `locagest.autoQuittance.${period}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "pending");

    autoGenerateCurrentMonthReceipts()
      .then((result) => {
        sessionStorage.setItem(key, result.ran ? "1" : "retry");
        if (sessionStorage.getItem(key) === "retry") sessionStorage.removeItem(key);
      })
      .catch(() => sessionStorage.removeItem(key));
  }, []);
}
