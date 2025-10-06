import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Award, Heart } from "lucide-react";

export function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-blue-600 bg-blue-100">
            About Simulateon
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Engineering Excellence in 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}HVAC&R
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're dedicated to empowering HVAC&R engineers with professional-grade tools 
            for thermodynamic analysis and refrigeration system optimization.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-white shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center">
                <Target className="h-6 w-6 mr-3" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">
                To provide HVAC&R engineers with the most accurate, efficient, and user-friendly 
                tools for thermodynamic calculations and system analysis. We believe in making 
                complex engineering calculations accessible without compromising on precision.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center">
                <Heart className="h-6 w-6 mr-3" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">
                To become the leading platform for HVAC&R engineering calculations worldwide, 
                helping engineers design more efficient, sustainable, and innovative refrigeration 
                systems that contribute to a greener future.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white shadow-lg border-gray-200 text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Engineering Team</h3>
                <p className="text-gray-600">
                  Experienced HVAC&R engineers with decades of combined industry experience
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-gray-200 text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Development Team</h3>
                <p className="text-gray-600">
                  Software engineers specializing in scientific computing and user experience
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-gray-200 text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Research Team</h3>
                <p className="text-gray-600">
                  Continuous research into new refrigerants and advanced thermodynamic models
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values Section */}
        <Card className="bg-white shadow-lg border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-center text-2xl">Our Core Values</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Accuracy</h4>
                <p className="text-gray-600">
                  Every calculation is verified against industry standards and validated with real-world data.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Innovation</h4>
                <p className="text-gray-600">
                  Continuously improving our algorithms and adding support for new refrigerants and systems.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Sustainability</h4>
                <p className="text-gray-600">
                  Supporting the transition to environmentally friendly refrigerants and efficient systems.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Community</h4>
                <p className="text-gray-600">
                  Building a community of engineers who share knowledge and best practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
