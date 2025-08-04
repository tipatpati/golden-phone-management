import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, History, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile, usePerformanceLogs } from "@/services/employeeProfile/EmployeeProfileReactQueryService";
import { EmployeeProfileCard } from "@/components/profile/EmployeeProfileCard";
import { ProfileGoalsDialog } from "@/components/profile/ProfileGoalsDialog";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorBoundaryWithRetry } from "@/components/common/ErrorBoundaryWithRetry";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";

export default function Profile() {
  const { userRole, username } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useCurrentUserProfile();
  const { data: performanceLogs, isLoading: logsLoading } = usePerformanceLogs();

  if (profileLoading) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">
              No employee profile has been set up for your account yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your manager to set up your employee profile and performance tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundaryWithRetry>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-6 border-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Profile
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{username}</span>
                </div>
                {userRole && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                    {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              {profile && (
                <ProfileGoalsDialog profile={profile} userRole={userRole || 'salesperson'} />
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="xl:col-span-2 space-y-6">
            {profile ? (
              <EmployeeProfileCard 
                profile={profile} 
                userRole={userRole || 'salesperson'} 
                showDetailedMetrics={true}
              />
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to Your Profile</h3>
                  <p className="text-muted-foreground mb-4">
                    Your employee profile is being set up. Contact your manager to configure your goals and tracking.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest performance updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : performanceLogs && performanceLogs.length > 0 ? (
                  <div className="space-y-3">
                    {performanceLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          <span className="text-sm font-medium capitalize">
                            {log.metric_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.metric_type === 'sales' ? `€${log.metric_value.toFixed(2)}` : log.metric_value}
                          {log.achievement_type && ` • ${log.achievement_type.replace('_', ' ')}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity yet. Start working toward your goals!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <ModuleNavCards currentModule="profile" />
          </div>
        </div>
      </div>
    </ErrorBoundaryWithRetry>
  );
}