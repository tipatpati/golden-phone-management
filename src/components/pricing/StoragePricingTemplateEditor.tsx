import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { STORAGE_OPTIONS } from '@/services/inventory/types';
import type { StoragePricingTemplate, StoragePricingRule } from '@/types/pricingTemplates';
import { StoragePricingTemplateService } from '@/services/pricing/StoragePricingTemplateService';

interface StoragePricingTemplateEditorProps {
  template?: StoragePricingTemplate;
  onSave?: (template: StoragePricingTemplate) => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export function StoragePricingTemplateEditor({ 
  template, 
  onSave, 
  onCancel,
  children 
}: StoragePricingTemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StoragePricingTemplate>>(() => 
    template || StoragePricingTemplateService.getDefaultTemplate()
  );

  const addRule = () => {
    const newRule: StoragePricingRule = {
      storage: 64,
      sellingPrice: 0,
      minPrice: 0,
      maxPrice: 0
    };
    
    setFormData(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRule]
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules?.filter((_, i) => i !== index) || []
    }));
  };

  const updateRule = (index: number, field: keyof StoragePricingRule, value: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules?.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      ) || []
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.rules?.length) {
      return;
    }

    try {
      let savedTemplate: StoragePricingTemplate;
      
      if (template?.id) {
        savedTemplate = StoragePricingTemplateService.updateTemplate(template.id, formData);
      } else {
        savedTemplate = StoragePricingTemplateService.saveTemplate(formData as any);
      }
      
      onSave?.(savedTemplate);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const resetToDefault = () => {
    setFormData(StoragePricingTemplateService.getDefaultTemplate());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {template ? 'Edit Template' : 'New Template'}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit' : 'Create'} Storage Pricing Template
          </DialogTitle>
          <DialogDescription>
            Set default prices based on storage capacity. These will be applied automatically to units.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., iPhone 15 Pricing"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>

          {/* Pricing Rules */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Pricing Rules</CardTitle>
                <CardDescription>Set prices for each storage variant</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetToDefault}
                  className="h-8"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Default
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addRule}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.rules?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pricing rules yet. Click "Add Rule" to create your first rule.
                  </div>
                )}
                
                {formData.rules?.map((rule, index) => (
                  <div key={index} className="grid grid-cols-5 gap-3 items-end p-3 border rounded-lg">
                    <div>
                      <Label className="text-xs">Storage</Label>
                      <Select
                        value={rule.storage.toString()}
                        onValueChange={(value) => updateRule(index, 'storage', parseInt(value))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STORAGE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Selling Price</Label>
                      <Input
                        type="number"
                        value={rule.sellingPrice || ''}
                        onChange={(e) => updateRule(index, 'sellingPrice', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Min Price</Label>
                      <Input
                        type="number"
                        value={rule.minPrice || ''}
                        onChange={(e) => updateRule(index, 'minPrice', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Max Price</Label>
                      <Input
                        type="number"
                        value={rule.maxPrice || ''}
                        onChange={(e) => updateRule(index, 'maxPrice', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(index)}
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsOpen(false);
              onCancel?.();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.rules?.length}>
              <Save className="h-4 w-4 mr-2" />
              {template ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}