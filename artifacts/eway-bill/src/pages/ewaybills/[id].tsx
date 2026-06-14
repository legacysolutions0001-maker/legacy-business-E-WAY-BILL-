import { useGetEwaybill, getGetEwaybillQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Link } from "wouter";
import { INDIAN_STATES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function EwaybillDetailPage({ id }: { id: string }) {
  const { data: ewb, isLoading } = useGetEwaybill(Number(id), { 
    query: { 
      enabled: !!id, 
      queryKey: getGetEwaybillQueryKey(Number(id)) 
    } 
  });

  const handlePrint = () => {
    window.print();
  };

  const getStateName = (code: string) => INDIAN_STATES.find(s => s.code === code)?.name || code;

  if (isLoading) return <div className="p-8 text-center">Loading E-Way Bill details...</div>;
  if (!ewb) return <div className="p-8 text-center text-destructive">E-Way Bill not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center no-print">
        <Link href="/ewaybills">
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="print-card shadow-sm border-2">
        <CardContent className="p-0">
          {/* Header */}
          <div className="border-b-2 border-primary/20 bg-primary/5 p-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight uppercase">e-Way Bill</h1>
            <div className="mt-4 flex flex-col md:flex-row justify-center items-center gap-x-12 gap-y-2">
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                EWB No: <span className="text-xl font-bold text-foreground font-mono ml-2 tracking-normal">{ewb.ewbNumber}</span>
              </div>
              <Badge variant={ewb.status === 'GENERATED' ? 'default' : 'secondary'} className="text-xs uppercase tracking-wider">
                {ewb.status}
              </Badge>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Part A Header info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-md border">
              <div><span className="text-muted-foreground block text-xs">Generated Date</span> <span className="font-medium">{new Date(ewb.generatedDate).toLocaleString()}</span></div>
              <div><span className="text-muted-foreground block text-xs">Valid Upto</span> <span className="font-medium">{new Date(ewb.validUpto).toLocaleString()}</span></div>
              <div><span className="text-muted-foreground block text-xs">Supply Type</span> <span className="font-medium">{ewb.supplyType}</span></div>
              <div><span className="text-muted-foreground block text-xs">Transaction Type</span> <span className="font-medium">{ewb.transactionType}</span></div>
            </div>

            {/* Addresses */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-2 uppercase text-sm tracking-wider text-muted-foreground">From (Consignor)</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">GSTIN</span><span className="font-bold font-mono">{ewb.fromGstin}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Trade Name</span><span className="font-semibold">{ewb.fromTradeName}</span></div>
                  <div className="pt-2">
                    <div className="text-muted-foreground text-xs mb-1">Address</div>
                    <div className="leading-tight">
                      {ewb.fromAddr1}<br/>
                      {ewb.fromAddr2 && <>{ewb.fromAddr2}<br/></>}
                      PIN: {ewb.fromPincode}
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2"><span className="text-muted-foreground">State</span><span className="font-medium">{getStateName(ewb.fromStateCode)}</span></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-2 uppercase text-sm tracking-wider text-muted-foreground">To (Consignee)</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">GSTIN</span><span className="font-bold font-mono">{ewb.toGstin}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Trade Name</span><span className="font-semibold">{ewb.toTradeName}</span></div>
                  <div className="pt-2">
                    <div className="text-muted-foreground text-xs mb-1">Address</div>
                    <div className="leading-tight">
                      {ewb.toAddr1}<br/>
                      {ewb.toAddr2 && <>{ewb.toAddr2}<br/></>}
                      PIN: {ewb.toPincode}
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2"><span className="text-muted-foreground">State</span><span className="font-medium">{getStateName(ewb.toStateCode)}</span></div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2 uppercase text-sm tracking-wider text-muted-foreground">Item Details</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-3 font-medium">HSN</th>
                      <th className="text-left p-3 font-medium">Product Name</th>
                      <th className="text-right p-3 font-medium">Quantity</th>
                      <th className="text-right p-3 font-medium">Taxable Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 font-mono">{ewb.hsnCode}</td>
                      <td className="p-3 font-medium">{ewb.itemName}</td>
                      <td className="p-3 text-right">{ewb.quantity} {ewb.unit}</td>
                      <td className="p-3 text-right font-medium">₹{ewb.taxableValue.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs bg-muted/20 p-4 rounded-md">
                <div><span className="text-muted-foreground block">CGST</span><span className="font-medium">{ewb.cgstRate}%</span></div>
                <div><span className="text-muted-foreground block">SGST</span><span className="font-medium">{ewb.sgstRate}%</span></div>
                <div><span className="text-muted-foreground block">IGST</span><span className="font-medium">{ewb.igstRate}%</span></div>
                <div><span className="text-muted-foreground block">CESS</span><span className="font-medium">{ewb.cessRate || 0}%</span></div>
                <div className="text-right border-l pl-4 md:border-l-0 md:pl-0"><span className="text-muted-foreground block">Total Invoice Value</span><span className="font-bold text-base">₹{ewb.totalValue.toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            {/* Part B */}
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2 uppercase text-sm tracking-wider text-muted-foreground">Part B - Transport Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm bg-muted/20 p-4 rounded-md border">
                <div><span className="text-muted-foreground block text-xs">Mode</span><span className="font-medium">{ewb.transportMode}</span></div>
                <div><span className="text-muted-foreground block text-xs">Vehicle Type</span><span className="font-medium">{ewb.vehicleType}</span></div>
                <div><span className="text-muted-foreground block text-xs">Vehicle No</span><span className="font-bold font-mono uppercase">{ewb.vehicleNo}</span></div>
                <div><span className="text-muted-foreground block text-xs">Distance</span><span className="font-medium">{ewb.distance || '-'} Km</span></div>
                
                <div className="col-span-2"><span className="text-muted-foreground block text-xs">Transporter Doc No</span><span className="font-medium">{ewb.transporterDocNo}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground block text-xs">Transporter Doc Date</span><span className="font-medium">{new Date(ewb.transporterDocDate).toLocaleDateString()}</span></div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
