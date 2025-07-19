import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Settings, Users, TrendingUp, Crown, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

const Index = () => {
  const features = [
    {
      title: "Sales Management",
      description: "Track and manage all your sales transactions with ease",
      icon: TrendingUp,
      gradient: "from-blue-500 to-purple-600",
      role: "salesperson"
    },
    {
      title: "Repair Services", 
      description: "Manage device repairs and track technician progress",
      icon: Smartphone,
      gradient: "from-purple-500 to-pink-600",
      role: "manager"
    },
    {
      title: "Inventory Control",
      description: "Keep track of stock levels and product management", 
      icon: Settings,
      gradient: "from-green-500 to-blue-600",
      role: "inventory_manager"
    },
    {
      title: "Client Management",
      description: "Maintain customer relationships and contact information",
      icon: Users,
      gradient: "from-orange-500 to-red-600",
      role: "manager"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Section */}
        <div className="pt-12 sm:pt-16 pb-16 sm:pb-20 text-center">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-center mb-2">
                <Logo size={280} className="mx-auto w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] h-auto" />
              </div>
              <p className="text-base sm:text-lg lg:text-xl text-white/85 max-w-3xl mx-auto leading-relaxed px-4">
                Complete management solution for your mobile repair business. 
                Track sales, manage repairs, control inventory, and maintain customer relationships.
              </p>
            </div>
            
            {/* Login Options */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto pt-4">
              <Link to="/admin-login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-44 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium">
                  <Crown className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Store Owner
                </Button>
              </Link>
              <Link to="/employee-login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-44 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium">
                  <UserCheck className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Employee
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="pb-16 sm:pb-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Everything you need to manage your business
            </h2>
            <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto px-4">
              Streamline your operations with our comprehensive suite of business management tools
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to="/login"
                className="block group hover:shadow-2xl transition-all duration-500 shadow-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transform hover:-translate-y-2 border border-white/20 rounded-xl"
              >
                <div className="text-center pb-5 sm:pb-6 pt-6 sm:pt-8">
                  <div className={`mx-auto w-16 sm:w-20 h-16 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    <feature.icon className="h-8 sm:h-10 w-8 sm:w-10 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mb-3 sm:mb-4 px-4">
                    {feature.title}
                  </h3>
                </div>
                <div className="text-center space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6">
                  <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-center text-white/90 group-hover:text-white transition-colors font-medium text-sm sm:text-base">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t border-white/20 py-8 sm:py-12">
          <div className="text-center">
            <Link 
              to="/api-settings" 
              className="inline-flex items-center gap-2 sm:gap-3 text-white/75 hover:text-white transition-colors duration-200 bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm hover:shadow-md border border-white/20 text-sm sm:text-base"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium">API Settings</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
