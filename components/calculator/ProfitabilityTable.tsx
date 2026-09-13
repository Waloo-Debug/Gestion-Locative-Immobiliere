import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuro } from "@/lib/format";
import { yearlyProjection } from "@/lib/profitability";

export function ProfitabilityTable({ rows }: { rows: ReturnType<typeof yearlyProjection> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rentabilité projetée</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Année</TableHead>
              <TableHead>Loyers encaissés</TableHead>
              <TableHead>Dépenses</TableHead>
              <TableHead>Cash-flow</TableHead>
              <TableHead>Cumulé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.year}>
                <TableCell>{row.year}</TableCell>
                <TableCell>{formatEuro(row.rent, 0)}</TableCell>
                <TableCell>{formatEuro(row.expenses, 0)}</TableCell>
                <TableCell className={row.cashflow < 0 ? "text-red-400" : "text-emerald-400"}>
                  {formatEuro(row.cashflow, 0)}
                </TableCell>
                <TableCell className={row.cumulative < 0 ? "text-red-400" : "text-emerald-400"}>
                  {formatEuro(row.cumulative, 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
