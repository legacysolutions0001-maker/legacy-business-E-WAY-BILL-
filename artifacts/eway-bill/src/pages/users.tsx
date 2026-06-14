import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useCreateUser, useUpdateUser, useDeleteUser, useListCompanies, getListCompaniesQueryKey, User } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, UsersIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required").or(z.string().optional()),
  companyId: z.coerce.number().min(1, "Company is required"),
  role: z.enum(["super_admin", "company_user"]),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const listParams = selectedCompany !== "all" ? { companyId: Number(selectedCompany) } : undefined;
  
  const { data: users, isLoading } = useListUsers(listParams, { query: { queryKey: getListUsersQueryKey(listParams) } });
  const { data: companies } = useListCompanies({ query: { queryKey: getListCompaniesQueryKey() } });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      companyId: 0,
      role: "company_user",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        const updateData: any = { role: data.role };
        if (data.password) updateData.password = data.password;
        await updateUser.mutateAsync({ id: editingUser.id, data: updateData });
        toast({ title: "User updated successfully" });
      } else {
        if (!data.password) throw new Error("Password is required for new users");
        await createUser.mutateAsync({ data: data as any });
        toast({ title: "User created successfully" });
      }
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "An error occurred" });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: "",
      companyId: user.companyId,
      role: user.role as any,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser.mutateAsync({ id });
        toast({ title: "User deleted" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete user" });
      }
    }
  };

  const handleOpenNew = () => {
    setEditingUser(null);
    form.reset({
      username: "",
      password: "",
      companyId: selectedCompany !== "all" ? Number(selectedCompany) : 0,
      role: "company_user",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage system users and access roles.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies?.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew}>
                <Plus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update the user details below." : "Enter the details for the new user."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl><Input {...field} disabled={!!editingUser} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{editingUser ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select disabled={!!editingUser} onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies?.map((company) => (
                              <SelectItem key={company.id} value={company.id.toString()}>{company.name} ({company.code})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="company_user">Company User</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                      {editingUser ? "Update" : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UsersIcon className="h-8 w-8 opacity-20" />
                      <p>No users found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.companyName}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                        {user.role === 'super_admin' ? 'Super Admin' : 'Company User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user.id)}>
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
