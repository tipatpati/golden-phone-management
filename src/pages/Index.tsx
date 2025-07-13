import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Settings, Users, TrendingUp, Crown, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { AuroraBackground } from "@/components/ui/aurora-background";

const Index = () => {
  const features = [
    {
      title: "Sales Management",
      description: "Track and manage all your sales transactions with ease",
      icon: TrendingUp,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Repair Services", 
      description: "Manage device repairs and track technician progress",
      icon: Smartphone,
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: "Inventory Control",
      description: "Keep track of stock levels and product management", 
      icon: Settings,
      gradient: "from-green-500 to-blue-600"
    },
    {
      title: "Client Management",
      description: "Maintain customer relationships and contact information",
      icon: Users,
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AuroraBackground 
        colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
        speed={1.0}
        blend={0.7}
        amplitude={1.0}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Section */}
        <div className="pt-16 pb-20 text-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex justify-center mb-2">
                <Logo size={320} className="mx-auto w-full max-w-xs md:max-w-lg h-auto" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                Complete management solution for your mobile repair business. 
                Track sales, manage repairs, control inventory, and maintain customer relationships.
              </p>
            </div>
            
            {/* Login Options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto pt-4">
              <Link to="/admin-login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-48 h-14 text-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Crown className="mr-3 h-6 w-6" />
                  Store Owner
                </Button>
              </Link>
              <Link to="/employee-login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-48 h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <UserCheck className="mr-3 h-6 w-6" />
                  Employee
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="pb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to manage your business
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Streamline your operations with our comprehensive suite of business management tools
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transform hover:-translate-y-2 border border-white/20">
                <CardHeader className="text-center pb-6 pt-8">
                  <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white leading-tight">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 pb-8">
                  <p className="text-white/70 leading-relaxed px-2">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-center text-white/90 group-hover:text-white transition-colors font-medium">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t border-white/20 py-12">
          <div className="text-center">
            <Link 
              to="/api-settings" 
              className="inline-flex items-center gap-3 text-white/70 hover:text-white transition-colors duration-200 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm hover:shadow-md border border-white/20"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">API Settings</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
