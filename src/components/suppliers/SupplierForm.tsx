import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSuppliers } from "@/services/useSuppliers";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.string().optional(),
  credit_limit: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: any;
  onSuccess: () => void;
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const { toast } = useToast();
  const { createSupplier, updateSupplier } = useSuppliers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || {
      status: "active",
      credit_limit: 0,
    },
  });

  const status = watch("status");

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, ...data });
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        await createSupplier.mutateAsync(data);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Supplier Name *</Label>
          <Input
            id="name"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            {...register("contact_person")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register("phone")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register("address")}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tax_id">Tax ID</Label>
          <Input
            id="tax_id"
            {...register("tax_id")}
          />
        </div>

        <div>
          <Label htmlFor="credit_limit">Credit Limit</Label>
          <Input
            id="credit_limit"
            type="number"
            step="0.01"
            {...register("credit_limit", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="payment_terms">Payment Terms</Label>
        <Input
          id="payment_terms"
          {...register("payment_terms")}
          placeholder="e.g., Net 30, 2/10 Net 30"
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(value) => setValue("status", value as "active" | "inactive")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
        </Button>
      </div>
    </form>
  );
}