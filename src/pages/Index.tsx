import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Settings, Users, TrendingUp, Crown, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
const Index = () => {
  const features = [{
    title: "Sales Management",
    description: "Track and manage all your sales transactions with ease",
    icon: TrendingUp,
    gradient: "from-blue-500 to-purple-600"
  }, {
    title: "Repair Services",
    description: "Manage device repairs and track technician progress",
    icon: Smartphone,
    gradient: "from-purple-500 to-pink-600"
  }, {
    title: "Inventory Control",
    description: "Keep track of stock levels and product management",
    icon: Settings,
    gradient: "from-green-500 to-blue-600"
  }, {
    title: "Client Management",
    description: "Maintain customer relationships and contact information",
    icon: Users,
    gradient: "from-orange-500 to-red-600"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              GOLDEN PHONE
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete management solution for your mobile repair business. 
              Track sales, manage repairs, control inventory, and maintain customer relationships.
            </p>
          </div>
          
          {/* Simplified Login Options */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link to="/admin-login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <Crown className="mr-2 h-5 w-5" />
                Store Owner
              </Button>
            </Link>
            <Link to="/employee-login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <UserCheck className="mr-2 h-5 w-5" />
                Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-center justify-center text-sm text-blue-600 group-hover:text-blue-700 transition-colors">
                  Learn More
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Stats Section */}
        

        {/* Quick Access for Settings */}
        <div className="text-center">
          <Link to="/api-settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Settings className="h-4 w-4" />
            API Settings
          </Link>
        </div>
      </div>
    </div>;
};
export default Index;