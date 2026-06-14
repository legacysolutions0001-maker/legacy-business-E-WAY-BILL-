import { useState } from "react";
import { useListEwaybills, getListEwaybillsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { FileText, Plus, Search, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";

export default function EwaybillsPage() {
  const { isSuperAdmin } = useAuth();
  // We can pass empty params, or companyId if not superadmin - though backend should handle filtering
  const { data: bills, isLoading } = useListEwaybills(undefined, { query: { queryKey: getListEwaybillsQueryKey() } });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBills = bills?.filter((bill) => 
    bill.ewbNumber.includes(searchTerm) || 
    bill.toTradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.fromTradeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">E-Way Bills</h2>
          <p className="text-muted-foreground">View and manage E-Way Bills.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search EWB or Trade Name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/ewaybills/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Generate New
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EWB Number</TableHead>
                <TableHead>Date</TableHead>
                {isSuperAdmin && <TableHead>Company</TableHead>}
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Value (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredBills?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p>No E-Way Bills found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills?.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium font-mono">{bill.ewbNumber}</TableCell>
                    <TableCell>{new Date(bill.generatedDate).toLocaleDateString()}</TableCell>
                    {isSuperAdmin && <TableCell>{bill.companyId}</TableCell>}
                    <TableCell className="truncate max-w-[150px]" title={bill.fromTradeName}>{bill.fromTradeName}</TableCell>
                    <TableCell className="truncate max-w-[150px]" title={bill.toTradeName}>{bill.toTradeName}</TableCell>
                    <TableCell className="text-right">{bill.totalValue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={bill.status === 'GENERATED' ? 'default' : 'secondary'}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/ewaybills/${bill.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
