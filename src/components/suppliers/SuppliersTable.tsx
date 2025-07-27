import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { ContactSupplierDialog } from "./ContactSupplierDialog";
import { useSuppliers } from "@/services/useSuppliers";
import { cn } from "@/lib/utils";

interface SuppliersTableProps {
  searchTerm: string;
}

export function SuppliersTable({ searchTerm }: SuppliersTableProps) {
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<any>(null);
  const [contactingSupplier, setContactingSupplier] = useState<any>(null);
  const { data: suppliers, isLoading } = useSuppliers();

  const filteredSuppliers = suppliers?.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead className="hidden sm:table-cell">Contact</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="truncate">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {supplier.contact_person && `${supplier.contact_person}`}
                        {supplier.email && ` • ${supplier.email}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{supplier.contact_person || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{supplier.email || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{supplier.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={supplier.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs",
                        supplier.status === 'active' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      )}
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                        <DropdownMenuItem 
                          onClick={() => setContactingSupplier(supplier)}
                          className="cursor-pointer"
                          disabled={!supplier.email}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setEditingSupplier(supplier)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingSupplier(supplier)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditSupplierDialog
        supplier={editingSupplier}
        open={!!editingSupplier}
        onOpenChange={(open) => !open && setEditingSupplier(null)}
      />

      <DeleteSupplierDialog
        supplier={deletingSupplier}
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
      />

      <ContactSupplierDialog
        supplier={contactingSupplier}
        open={!!contactingSupplier}
        onOpenChange={(open) => !open && setContactingSupplier(null)}
      />
    </>
  );
}