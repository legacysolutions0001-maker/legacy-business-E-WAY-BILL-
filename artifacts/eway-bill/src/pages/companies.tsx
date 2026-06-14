import { useState } from "react";
import { useListCompanies, getListCompaniesQueryKey, useCreateCompany, useUpdateCompany, useDeleteCompany, Company } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const companySchema = z.object({
  code: z.string().min(1, "Company code is required"),
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  gstin: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompaniesPage() {
  const { data: companies, isLoading } = useListCompanies({ query: { queryKey: getListCompaniesQueryKey() } });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      code: "",
      name: "",
      address: "",
      gstin: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      if (editingCompany) {
        await updateCompany.mutateAsync({ id: editingCompany.id, data });
        toast({ title: "Company updated successfully" });
      } else {
        await createCompany.mutateAsync({ data });
        toast({ title: "Company created successfully" });
      }
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "An error occurred" });
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      code: company.code,
      name: company.name,
      address: company.address || "",
      gstin: company.gstin || "",
      contactEmail: company.contactEmail || "",
      contactPhone: company.contactPhone || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        await deleteCompany.mutateAsync({ id });
        toast({ title: "Company deleted" });
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete company" });
      }
    }
  };

  const handleOpenNew = () => {
    setEditingCompany(null);
    form.reset({
      code: "",
      name: "",
      address: "",
      gstin: "",
      contactEmail: "",
      contactPhone: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground">Manage companies and their details.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
              <DialogDescription>
                {editingCompany ? "Update the company details below." : "Enter the details for the new company."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Code</FormLabel>
                        <FormControl><Input {...field} disabled={!!editingCompany} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createCompany.isPending || updateCompany.isPending}>
                    {editingCompany ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : companies?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Building2 className="h-8 w-8 opacity-20" />
                      <p>No companies found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                companies?.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.code}</TableCell>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.gstin || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{company.contactEmail}</div>
                        <div className="text-muted-foreground">{company.contactPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(company.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
