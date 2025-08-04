import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Target, Save } from "lucide-react";
import { useUpdateEmployeeProfile } from "@/services/employeeProfile/EmployeeProfileReactQueryService";
import type { EmployeeProfile } from "@/services/employeeProfile/types";

interface ProfileGoalsDialogProps {
  profile: EmployeeProfile;
  userRole: string;
}

export function ProfileGoalsDialog({ profile, userRole }: ProfileGoalsDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    monthly_sales_target: profile.monthly_sales_target,
    quarterly_sales_target: profile.quarterly_sales_target,
    yearly_sales_target: profile.yearly_sales_target,
    commission_rate: profile.commission_rate * 100, // Convert to percentage for display
    bonus_threshold: profile.bonus_threshold,
  });

  const updateProfile = useUpdateEmployeeProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        updates: {
          ...formData,
          commission_rate: formData.commission_rate / 100, // Convert back to decimal
        }
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Set Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="responsive-dialog-medium">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Update Performance Goals
          </DialogTitle>
          <DialogDescription>
            Set your targets and commission structure for the current period
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {userRole === 'salesperson' && (
            <>
              {/* Sales Targets */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-900">Sales Targets</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_target" className="text-sm font-medium">
                      Monthly Target
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="monthly_target"
                        type="number"
                        step="0.01"
                        value={formData.monthly_sales_target}
                        onChange={(e) => handleInputChange('monthly_sales_target', e.target.value)}
                        className="pl-8 touch-friendly-input"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quarterly_target" className="text-sm font-medium">
                      Quarterly Target
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="quarterly_target"
                        type="number"
                        step="0.01"
                        value={formData.quarterly_sales_target}
                        onChange={(e) => handleInputChange('quarterly_sales_target', e.target.value)}
                        className="pl-8 touch-friendly-input"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearly_target" className="text-sm font-medium">
                      Yearly Target
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="yearly_target"
                        type="number"
                        step="0.01"
                        value={formData.yearly_sales_target}
                        onChange={(e) => handleInputChange('yearly_sales_target', e.target.value)}
                        className="pl-8 touch-friendly-input"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission & Bonus */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-900">Commission & Bonus</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate" className="text-sm font-medium">
                      Commission Rate
                    </Label>
                    <div className="relative">
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                        className="pr-8 touch-friendly-input"
                        placeholder="5.0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus_threshold" className="text-sm font-medium">
                      Bonus Threshold
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="bonus_threshold"
                        type="number"
                        step="0.01"
                        value={formData.bonus_threshold}
                        onChange={(e) => handleInputChange('bonus_threshold', e.target.value)}
                        className="pl-8 touch-friendly-input"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Information Box */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">How Goals Work</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Monthly targets are used for bonus calculations</li>
              <li>• Commission is earned on sales above your target</li>
              <li>• Bonus threshold is the minimum sales needed for bonus eligibility</li>
              <li>• Goals can be updated monthly by managers</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={updateProfile.isPending}
              className="w-full touch-friendly-large"
            >
              {updateProfile.isPending ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Goals
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full touch-friendly-large"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}