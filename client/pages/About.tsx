import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Award, Heart } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function About() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-100 selection:text-orange-900">
      <Header variant="landing" />

      {/* Warm/Thermo Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/50 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-red-100/30 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-orange-700 bg-orange-100 border-orange-200">
            About ThermoNeural
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Engineering Excellence in
            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
              {" "}
              HVAC&R
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're dedicated to empowering HVAC&R engineers with
            professional-grade tools for thermodynamic analysis and
            refrigeration system optimization.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-border">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
              <CardTitle className="flex items-center text-white">
                <Target className="h-6 w-6 mr-3 text-white" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">
                To provide HVAC&R engineers with the most accurate, efficient,
                and user-friendly tools for thermodynamic calculations and
                system analysis. We believe in making complex engineering
                calculations accessible without compromising on precision.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-border">
            <CardHeader className="bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-t-xl">
              <CardTitle className="flex items-center text-white">
                <Heart className="h-6 w-6 mr-3 text-white" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">
                To become the leading platform for HVAC&R engineering
                calculations worldwide, helping engineers design more efficient,
                sustainable, and innovative refrigeration systems that
                contribute to a greener future.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Our Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-border text-center hover:-translate-y-1 transition-transform">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Engineering Team
                </h3>
                <p className="text-muted-foreground">
                  Experienced HVAC&R engineers with decades of combined industry
                  experience
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-border text-center hover:-translate-y-1 transition-transform">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Development Team
                </h3>
                <p className="text-muted-foreground">
                  Software engineers specializing in scientific computing and
                  user experience
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-border text-center hover:-translate-y-1 transition-transform">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Research Team
                </h3>
                <p className="text-muted-foreground">
                  Continuous research into new refrigerants and advanced
                  thermodynamic models
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values Section */}
        <Card className="bg-card/90 backdrop-blur-md shadow-xl border-border">
          <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
            <CardTitle className="text-center text-2xl text-white">
              Our Core Values
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-orange-600 mb-2">
                  Accuracy
                </h4>
                <p className="text-muted-foreground">
                  Every calculation is verified against industry standards and
                  validated with real-world data.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-600 mb-2">
                  Innovation
                </h4>
                <p className="text-muted-foreground">
                  Continuously improving our algorithms and adding support for
                  new refrigerants and systems.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-600 mb-2">
                  Sustainability
                </h4>
                <p className="text-muted-foreground">
                  Supporting the transition to environmentally friendly
                  refrigerants and efficient systems.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-600 mb-2">
                  Community
                </h4>
                <p className="text-muted-foreground">
                  Building a community of engineers who share knowledge and best
                  practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
