
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type RepairFormData } from "../types";

interface AdditionalInfoSectionProps {
  formData: RepairFormData;
  setFormData: (data: RepairFormData) => void;
}

export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="estimated_completion_date">Data Completamento Stimata</Label>
        <Input
          id="estimated_completion_date"
          type="date"
          value={formData.estimated_completion_date}
          onChange={(e) => setFormData({...formData, estimated_completion_date: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Note aggiuntive sulla riparazione"
        />
      </div>
    </>
  );
};
