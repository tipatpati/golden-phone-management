import React from "react";
import { FormField } from "@/components/common/FormField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLIENT_TYPE_OPTIONS } from "./types";
import { ClientBusinessInfoProps } from "./types";

export function ClientBusinessInfo({
  formData,
  onFieldChange,
  getFieldError
}: ClientBusinessInfoProps) {
  return (
    <div className="space-y-4">
      {/* Client Type Selection */}
      <Tabs 
        value={formData.type || 'individual'} 
        onValueChange={(value) => onFieldChange('type', value as 'individual' | 'business')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual (B2C)</TabsTrigger>
          <TabsTrigger value="business">Business (B2B)</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="individual" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                required
                value={formData.first_name || ''}
                onChange={(value) => onFieldChange('first_name', value)}
                placeholder="John"
                error={getFieldError('first_name')}
              />
              <FormField
                label="Last Name"
                required
                value={formData.last_name || ''}
                onChange={(value) => onFieldChange('last_name', value)}
                placeholder="Doe"
                error={getFieldError('last_name')}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="business" className="space-y-4 mt-0">
            <FormField
              label="Company Name"
              required
              value={formData.company_name || ''}
              onChange={(value) => onFieldChange('company_name', value)}
              placeholder="Acme Corporation"
              error={getFieldError('company_name')}
            />
            <FormField
              label="Contact Person"
              value={formData.contact_person || ''}
              onChange={(value) => onFieldChange('contact_person', value)}
              placeholder="John Doe, Sales Manager"
              error={getFieldError('contact_person')}
              description="Primary contact person at the company"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}