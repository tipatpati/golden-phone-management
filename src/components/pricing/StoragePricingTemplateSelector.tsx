import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wand2, Plus, Trash2, Edit } from 'lucide-react';
import { StoragePricingTemplateEditor } from './StoragePricingTemplateEditor';
import { StoragePricingTemplateService } from '@/services/pricing/StoragePricingTemplateService';
import type { StoragePricingTemplate } from '@/types/pricingTemplates';
import type { UnitEntryForm } from '@/services/inventory/types';

interface StoragePricingTemplateSelectorProps {
  units: UnitEntryForm[];
  onUnitsChange: (units: UnitEntryForm[]) => void;
  title?: string;
  description?: string;
}

export function StoragePricingTemplateSelector({ 
  units, 
  onUnitsChange,
  title = "Storage Pricing Templates",
  description = "Apply default pricing templates based on storage capacity"
}: StoragePricingTemplateSelectorProps) {
  const [templates, setTemplates] = useState<StoragePricingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [lastAppliedResult, setLastAppliedResult] = useState<any>(null);
  const [forceApply, setForceApply] = useState(false);

  const loadTemplates = () => {
    setTemplates(StoragePricingTemplateService.getTemplates());
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;

    try {
      const result = StoragePricingTemplateService.applyTemplateDefaults(selectedTemplateId, units, undefined, forceApply);
      onUnitsChange(result.updatedUnits);
      setLastAppliedResult(result);
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  const handleTemplateCreated = (template: StoragePricingTemplate) => {
    loadTemplates();
    setSelectedTemplateId(template.id);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      StoragePricingTemplateService.deleteTemplate(templateId);
      loadTemplates();
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
      }
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const unitsWithStorage = units.filter(u => u.storage).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="flex gap-2">
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose a pricing template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.description && (
                    <span className="text-muted-foreground"> - {template.description}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <StoragePricingTemplateEditor onSave={handleTemplateCreated}>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </StoragePricingTemplateEditor>

          {selectedTemplate && (
            <>
              <StoragePricingTemplateEditor 
                template={selectedTemplate} 
                onSave={handleTemplateCreated}
              >
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </StoragePricingTemplateEditor>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleDeleteTemplate(selectedTemplate.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Template Preview */}
        {selectedTemplate && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Preview: {selectedTemplate.name}</div>
            <div className="flex flex-wrap gap-1">
              {selectedTemplate.rules.map((rule, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {rule.storage}GB: €{rule.purchasePrice || '0'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Force Apply Toggle */}
        <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
          <Switch
            id="force-apply"
            checked={forceApply}
            onCheckedChange={setForceApply}
          />
          <Label htmlFor="force-apply" className="text-sm">
            Force Apply (overwrite existing values)
          </Label>
        </div>

        {/* Apply Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {unitsWithStorage} units with storage specified
          </div>
          
          <Button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || unitsWithStorage === 0}
            variant="default"
            size="sm"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {forceApply ? 'Force Apply Template' : 'Apply Defaults'}
          </Button>
        </div>

        {/* Result Summary */}
        {lastAppliedResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              ✓ {forceApply ? 'Applied template pricing to' : 'Applied default pricing to'} {lastAppliedResult.appliedCount} units
              {lastAppliedResult.skippedCount > 0 && (
                <span className="text-yellow-700">
                  {', '}skipped {lastAppliedResult.skippedCount} units {forceApply ? '(no matching storage rule)' : '(already had values)'}
                </span>
              )}
            </div>
            {lastAppliedResult.errors.length > 0 && (
              <div className="text-xs text-red-600 mt-1">
                {lastAppliedResult.errors.join(', ')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}