
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type RepairFormData } from "../types";

interface DeviceInfoSectionProps {
  formData: RepairFormData;
  setFormData: (data: RepairFormData) => void;
}

export const DeviceInfoSection: React.FC<DeviceInfoSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device">Dispositivo *</Label>
          <Input
            id="device"
            value={formData.device}
            onChange={(e) => setFormData({...formData, device: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imei">IMEI</Label>
          <Input
            id="imei"
            value={formData.imei}
            onChange={(e) => setFormData({...formData, imei: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="issue">Problema *</Label>
        <Textarea
          id="issue"
          value={formData.issue}
          onChange={(e) => setFormData({...formData, issue: e.target.value})}
          required
        />
      </div>
    </>
  );
};
