import { useCreateEwaybill } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { INDIAN_STATES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const ewaybillSchema = z.object({
  supplyType: z.string().min(1, "Required"),
  transactionType: z.string().min(1, "Required"),
  transactionSubType: z.string().optional(),
  
  fromGstin: z.string().min(15, "Invalid GSTIN").max(15),
  fromTradeName: z.string().min(1, "Required"),
  fromAddr1: z.string().min(1, "Required"),
  fromAddr2: z.string().optional(),
  fromPincode: z.string().min(6).max(6),
  fromStateCode: z.string().min(2),
  
  toGstin: z.string().min(15, "Invalid GSTIN").max(15),
  toTradeName: z.string().min(1, "Required"),
  toAddr1: z.string().min(1, "Required"),
  toAddr2: z.string().optional(),
  toPincode: z.string().min(6).max(6),
  toStateCode: z.string().min(2),
  
  itemName: z.string().min(1, "Required"),
  hsnCode: z.string().min(4, "Required"),
  quantity: z.coerce.number().min(0.01),
  unit: z.string().min(1, "Required"),
  taxableValue: z.coerce.number().min(0),
  cgstRate: z.coerce.number().min(0),
  sgstRate: z.coerce.number().min(0),
  igstRate: z.coerce.number().min(0),
  cessRate: z.coerce.number().optional(),
  totalValue: z.coerce.number().min(0),
  
  transporterDocNo: z.string().min(1, "Required"),
  transporterDocDate: z.string().min(1, "Required"),
  vehicleNo: z.string().min(1, "Required"),
  vehicleType: z.string().min(1, "Required"),
  transportMode: z.string().min(1, "Required"),
  distance: z.coerce.number().optional(),
});

type EwaybillFormValues = z.infer<typeof ewaybillSchema>;

export default function NewEwaybillPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createEwaybill = useCreateEwaybill();

  const form = useForm<EwaybillFormValues>({
    resolver: zodResolver(ewaybillSchema),
    defaultValues: {
      supplyType: "Outward",
      transactionType: "Regular",
      transactionSubType: "Supply",
      fromGstin: "", fromTradeName: "", fromAddr1: "", fromAddr2: "", fromPincode: "", fromStateCode: "",
      toGstin: "", toTradeName: "", toAddr1: "", toAddr2: "", toPincode: "", toStateCode: "",
      itemName: "", hsnCode: "", quantity: 1, unit: "NOS", taxableValue: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0, totalValue: 0,
      transporterDocNo: "", transporterDocDate: new Date().toISOString().split('T')[0], vehicleNo: "", vehicleType: "Regular", transportMode: "Road", distance: 0,
    },
  });

  const onSubmit = async (data: EwaybillFormValues) => {
    try {
      const res = await createEwaybill.mutateAsync({ data });
      toast({ title: "E-Way Bill Generated Successfully", description: `EWB No: ${res.ewbNumber}` });
      setLocation(`/ewaybills/${res.id}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: error.message || "An error occurred" });
    }
  };

  const calculateTotal = () => {
    const vals = form.getValues();
    const taxValue = Number(vals.taxableValue) || 0;
    const cgst = (taxValue * (Number(vals.cgstRate) || 0)) / 100;
    const sgst = (taxValue * (Number(vals.sgstRate) || 0)) / 100;
    const igst = (taxValue * (Number(vals.igstRate) || 0)) / 100;
    const cess = (taxValue * (Number(vals.cessRate) || 0)) / 100;
    const total = taxValue + cgst + sgst + igst + cess;
    form.setValue('totalValue', Number(total.toFixed(2)));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/ewaybills">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Generate New E-Way Bill</h2>
          <p className="text-muted-foreground">Fill in the details to generate an official E-Way Bill.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Part A - Consignment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="supplyType" render={({ field }) => (
                <FormItem><FormLabel>Supply Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Outward">Outward</SelectItem><SelectItem value="Inward">Inward</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="transactionType" render={({ field }) => (
                <FormItem><FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Regular">Regular</SelectItem><SelectItem value="Bill To Ship To">Bill To Ship To</SelectItem><SelectItem value="Bill From Dispatch From">Bill From Dispatch From</SelectItem><SelectItem value="Combination">Combination</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="transactionSubType" render={({ field }) => (
                <FormItem><FormLabel>Sub Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Supply">Supply</SelectItem><SelectItem value="Export">Export</SelectItem><SelectItem value="Job Work">Job Work</SelectItem><SelectItem value="SKD/CKD">SKD/CKD</SelectItem><SelectItem value="Recipient Not Known">Recipient Not Known</SelectItem><SelectItem value="For Own Use">For Own Use</SelectItem><SelectItem value="Exhibition or Fairs">Exhibition or Fairs</SelectItem><SelectItem value="Line Sales">Line Sales</SelectItem><SelectItem value="Others">Others</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-lg">From (Consignor) Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField control={form.control} name="fromGstin" render={({ field }) => (<FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input className="uppercase" maxLength={15} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="fromTradeName" render={({ field }) => (<FormItem><FormLabel>Trade Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="fromAddr1" render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="fromAddr2" render={({ field }) => (<FormItem><FormLabel>Address Line 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="fromPincode" render={({ field }) => (<FormItem><FormLabel>PIN Code</FormLabel><FormControl><Input maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="fromStateCode" render={({ field }) => (
                    <FormItem><FormLabel>State Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select State"/></SelectTrigger></FormControl>
                        <SelectContent className="max-h-60 overflow-y-auto">{INDIAN_STATES.map(s => <SelectItem key={`from-${s.code}`} value={s.code}>{s.code} - {s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-lg">To (Consignee) Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField control={form.control} name="toGstin" render={({ field }) => (<FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input className="uppercase" maxLength={15} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="toTradeName" render={({ field }) => (<FormItem><FormLabel>Trade Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="toAddr1" render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="toAddr2" render={({ field }) => (<FormItem><FormLabel>Address Line 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="toPincode" render={({ field }) => (<FormItem><FormLabel>PIN Code</FormLabel><FormControl><Input maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="toStateCode" render={({ field }) => (
                    <FormItem><FormLabel>State Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select State"/></SelectTrigger></FormControl>
                        <SelectContent className="max-h-60 overflow-y-auto">{INDIAN_STATES.map(s => <SelectItem key={`to-${s.code}`} value={s.code}>{s.code} - {s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <FormField control={form.control} name="itemName" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Item Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="hsnCode" render={({ field }) => (<FormItem><FormLabel>HSN Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="NOS/KGS" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="taxableValue" render={({ field }) => (<FormItem><FormLabel>Taxable Value (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onBlur={(e) => {field.onBlur(); calculateTotal();}} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="cgstRate" render={({ field }) => (<FormItem><FormLabel>CGST Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onBlur={(e) => {field.onBlur(); calculateTotal();}} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="sgstRate" render={({ field }) => (<FormItem><FormLabel>SGST Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onBlur={(e) => {field.onBlur(); calculateTotal();}} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="igstRate" render={({ field }) => (<FormItem><FormLabel>IGST Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onBlur={(e) => {field.onBlur(); calculateTotal();}} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="totalValue" render={({ field }) => (<FormItem><FormLabel>Total Value (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly className="bg-muted font-bold" /></FormControl><FormMessage /></FormItem>)}/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Part B - Transport Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="transportMode" render={({ field }) => (
                <FormItem><FormLabel>Mode of Transport</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Road">Road</SelectItem><SelectItem value="Rail">Rail</SelectItem><SelectItem value="Air">Air</SelectItem><SelectItem value="Ship">Ship</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="vehicleType" render={({ field }) => (
                <FormItem><FormLabel>Vehicle Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Regular">Regular</SelectItem><SelectItem value="Over Dimensional Cargo">Over Dimensional Cargo</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="vehicleNo" render={({ field }) => (<FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input className="uppercase" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="transporterDocNo" render={({ field }) => (<FormItem><FormLabel>Transporter Doc No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="transporterDocDate" render={({ field }) => (<FormItem><FormLabel>Transporter Doc Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="distance" render={({ field }) => (<FormItem><FormLabel>Distance (Km)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/ewaybills">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createEwaybill.isPending} size="lg">
              {createEwaybill.isPending ? "Generating..." : "Generate E-Way Bill"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
