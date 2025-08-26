import React from "react";

export function SalesLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Garentille Management
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">Loading garentille...</p>
        </div>
      </div>
    </div>
  );
}