
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Settings, Users, TrendingUp, Crown, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      title: "Sales Management",
      description: "Track and manage all your sales transactions with ease",
      icon: TrendingUp,
      href: "/sales",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Repair Services",
      description: "Manage device repairs and track technician progress",
      icon: Smartphone,
      href: "/repairs",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: "Inventory Control",
      description: "Keep track of stock levels and product management",
      icon: Settings,
      href: "/inventory",
      gradient: "from-green-500 to-blue-600"
    },
    {
      title: "Client Management",
      description: "Maintain customer relationships and contact information",
      icon: Users,
      href: "/clients",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Login Options */}
        <div className="flex justify-end gap-4 mb-8">
          <Link to="/admin-login">
            <Button 
              variant="outline" 
              className="gap-2 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700 transition-all duration-300"
            >
              <Crown className="h-4 w-4" />
              Admin Login
            </Button>
          </Link>
          <Link to="/employee-login">
            <Button 
              variant="outline" 
              className="gap-2 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-300"
            >
              <UserCheck className="h-4 w-4" />
              Employee Login
            </Button>
          </Link>
        </div>

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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/admin-login">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started as Admin
                <Crown className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/employee-login">
              <Button 
                variant="outline" 
                size="lg" 
                className="shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
              >
                Employee Access
                <UserCheck className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-50 group-hover:to-purple-50 transition-all duration-300"
                  onClick={() => window.location.href = feature.href}
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-900 mb-2">500+</div>
              <div className="text-sm text-blue-600">Repairs Completed</div>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-900 mb-2">1,200+</div>
              <div className="text-sm text-purple-600">Happy Customers</div>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-900 mb-2">99%</div>
              <div className="text-sm text-yellow-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
