import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingUp, Star, Award, CircleDollarSign } from "lucide-react";
import type { EmployeeProfile } from "@/services/employeeProfile/types";
import { employeeProfileService } from "@/services/employeeProfile/EmployeeProfileReactQueryService";

interface EmployeeProfileCardProps {
  profile: EmployeeProfile;
  userRole: string;
  showDetailedMetrics?: boolean;
}

export function EmployeeProfileCard({ profile, userRole, showDetailedMetrics = true }: EmployeeProfileCardProps) {
  const metrics = employeeProfileService.getRoleMetrics(profile, userRole);
  const bonusInfo = employeeProfileService.calculateBonusEligibility(profile);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `€${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)}/5`;
      case 'hours':
        return `${value.toFixed(1)}h`;
      default:
        return value.toString();
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      {/* Primary Metrics */}
      {metrics.primary.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Performance Targets</CardTitle>
            </div>
            <CardDescription>Track your progress toward monthly goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {metrics.primary.map((metric, index) => {
              const progress = employeeProfileService.calculateProgress(metric.current, metric.target);
              return (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{metric.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatValue(metric.current, metric.format)} / {formatValue(metric.target, metric.format)}
                      </p>
                    </div>
                    <Badge 
                      variant={progress >= 100 ? "default" : "secondary"}
                      className={progress >= 100 ? "bg-green-100 text-green-800" : ""}
                    >
                      {progress.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Progress 
                      value={progress} 
                      className="h-3"
                    />
                    {progress >= 100 && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <Trophy className="h-4 w-4" />
                        Target achieved!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Bonus Information for Sales Roles */}
      {userRole === 'salesperson' && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Bonus Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Current Bonus Earned</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{profile.current_bonus_earned.toFixed(2)}
                  </p>
                </div>
                <Badge 
                  variant={bonusInfo.eligible ? "default" : "secondary"}
                  className={bonusInfo.eligible ? "bg-green-100 text-green-800" : ""}
                >
                  {bonusInfo.eligible ? "Eligible" : "Not Eligible"}
                </Badge>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <p className="text-sm font-medium">{bonusInfo.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Commission Rate</p>
                  <p className="font-medium">{(profile.commission_rate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus Threshold</p>
                  <p className="font-medium">€{profile.bonus_threshold.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary Metrics */}
      {showDetailedMetrics && metrics.secondary.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </div>
            <CardDescription>Additional performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.secondary.map((metric, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-gray-900">
                      {formatValue(metric.value, metric.format)}
                    </p>
                    {metric.format === 'rating' && metric.value >= 4 && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                    {metric.format === 'percentage' && metric.value >= 90 && (
                      <Award className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements and Badges */}
      {(profile.achievements || profile.badges) && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-yellow-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Achievements & Badges</CardTitle>
            </div>
            <CardDescription>Your accomplishments and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(profile.achievements) && profile.achievements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Achievements</h4>
                  <div className="space-y-2">
                    {profile.achievements.slice(0, 3).map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">{achievement.title || 'Achievement'}</p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.date || 'Recently achieved'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {Array.isArray(profile.badges) && profile.badges.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.slice(0, 5).map((badge, index) => (
                      <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                        {badge.name || `Badge ${index + 1}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}