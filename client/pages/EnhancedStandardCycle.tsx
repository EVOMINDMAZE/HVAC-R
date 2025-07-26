import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calculator, TrendingUp, Thermometer, Gauge, Zap, Eye, Settings } from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";
import { EnhancedRefrigerantSelector } from "@/components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "@/components/CycleVisualization";
import { EquipmentDiagram } from "@/components/EquipmentDiagrams";
import { validateOperatingConditions, getRefrigerantById } from "@/lib/refrigerants";

interface StandardCycleFormData {
  refrigerant: string;
  evaporatorTemp: number;
  condenserTemp: number;
  superheat: number;
  subcooling: number;
}

interface StatePoint {
  name: string;
  temperature: number;
  pressure: number;
  enthalpy: number;
  entropy: number;
  quality?: number;
}

interface StandardCycleResult {
  cop: number;
  refrigerationEffect: number;
  workInput: number;
  heatRejection: number;
  statePoints: StatePoint[];
  volumetricCapacity?: number;
  dischargePressure?: number;
  suctionPressure?: number;
}

export function EnhancedStandardCycle() {
  const [formData, setFormData] = useState<StandardCycleFormData>({
    refrigerant: "R134a",
    evaporatorTemp: -10,
    condenserTemp: 40,
    superheat: 5,
    subcooling: 2,
  });

  const [calculationData, setCalculationData] = useState<StandardCycleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("calculation");

  const { addToast } = useToast();

  // Validate inputs when they change
  useEffect(() => {
    const errors: string[] = [];
    
    // Validate refrigerant operating conditions
    const evapValidation = validateOperatingConditions(formData.refrigerant, formData.evaporatorTemp);
    const condValidation = validateOperatingConditions(formData.refrigerant, formData.condenserTemp);
    
    errors.push(...evapValidation.errors);
    errors.push(...condValidation.errors);
    
    // Basic thermodynamic validation
    if (formData.evaporatorTemp >= formData.condenserTemp) {
      errors.push("Evaporator temperature must be lower than condenser temperature");
    }

    if (formData.superheat < 0) {
      errors.push("Superheat cannot be negative");
    }

    if (formData.subcooling < 0) {
      errors.push("Subcooling cannot be negative");
    }

    setValidationErrors(errors);
  }, [formData]);

  const handleInputChange = (field: keyof StandardCycleFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
    setError(null);
  };

  const handleSuggestedRangeApply = (evapTemp: number, condTemp: number) => {
    setFormData(prev => ({
      ...prev,
      evaporatorTemp: evapTemp,
      condenserTemp: condTemp
    }));
    
    addToast({
      type: 'success',
      title: 'Range Applied',
      description: 'Recommended operating temperatures have been applied'
    });
  };

  const handleCalculate = async () => {
    if (validationErrors.length > 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please fix the input errors before calculating'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.calculateStandardCycle(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Transform API response to match our interface
      const transformedResult: StandardCycleResult = {
        cop: result.data?.performance_metrics?.cop || 0,
        refrigerationEffect: result.data?.performance_metrics?.refrigeration_effect || 0,
        workInput: result.data?.performance_metrics?.work_input || 0,
        heatRejection: result.data?.performance_metrics?.heat_rejection || 0,
        volumetricCapacity: result.data?.performance_metrics?.volumetric_capacity,
        dischargePressure: result.data?.pressures?.discharge,
        suctionPressure: result.data?.pressures?.suction,
        statePoints: result.data?.state_points ? Object.entries(result.data.state_points).map(([key, point]: [string, any]) => ({
          name: key,
          temperature: point.temperature || 0,
          pressure: point.pressure || 0,
          enthalpy: point.enthalpy || 0,
          entropy: point.entropy || 0,
          quality: point.quality
        })) : []
      };

      setCalculationData(transformedResult);
      setActiveTab("results");

      addToast({
        type: 'success',
        title: 'Calculation Complete',
        description: 'Standard cycle analysis completed successfully'
      });

    } catch (err: any) {
      console.error('Calculation error:', err);
      setError(err.message || 'Failed to calculate cycle');
      
      addToast({
        type: 'error',
        title: 'Calculation Failed',
        description: err.message || 'An error occurred during calculation'
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform calculation data for visualization
  const visualizationData = calculationData ? {
    points: calculationData.statePoints.map((point, index) => ({
      id: point.name,
      name: point.name,
      temperature: point.temperature,
      pressure: point.pressure,
      enthalpy: point.enthalpy,
      entropy: point.entropy,
      quality: point.quality,
      // Simple positioning for P-h diagram (this would be more sophisticated in reality)
      x: (point.enthalpy - 100) * 2, // Scale and offset for visualization
      y: 200 - Math.log(point.pressure / 1000) * 30 // Log scale for pressure
    })),
    refrigerant: formData.refrigerant,
    cycleType: 'standard' as const
  } : undefined;

  const selectedRefrigerant = getRefrigerantById(formData.refrigerant);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Standard Cycle Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Advanced refrigeration cycle calculation with real-time visualization and validation
          </p>
        </div>

        <ApiServiceStatus />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calculation" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualization
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Equipment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculation" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Cycle Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enhanced Refrigerant Selection */}
                  <EnhancedRefrigerantSelector
                    value={formData.refrigerant}
                    onChange={(value) => handleInputChange('refrigerant', value)}
                    evaporatorTemp={formData.evaporatorTemp}
                    condenserTemp={formData.condenserTemp}
                    onSuggestedRangeApply={handleSuggestedRangeApply}
                    showValidation={true}
                  />

                  {/* Temperature Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="evaporatorTemp" className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-500" />
                        Evaporator Temperature (°C)
                      </Label>
                      <Input
                        id="evaporatorTemp"
                        type="number"
                        value={formData.evaporatorTemp}
                        onChange={(e) => handleInputChange('evaporatorTemp', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="condenserTemp" className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        Condenser Temperature (°C)
                      </Label>
                      <Input
                        id="condenserTemp"
                        type="number"
                        value={formData.condenserTemp}
                        onChange={(e) => handleInputChange('condenserTemp', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Superheat and Subcooling */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="superheat">Superheat (°C)</Label>
                      <Input
                        id="superheat"
                        type="number"
                        value={formData.superheat}
                        onChange={(e) => handleInputChange('superheat', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcooling">Subcooling (°C)</Label>
                      <Input
                        id="subcooling"
                        type="number"
                        value={formData.subcooling}
                        onChange={(e) => handleInputChange('subcooling', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* API Error */}
                  {error && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Calculate Button */}
                  <Button
                    onClick={handleCalculate}
                    disabled={loading || validationErrors.length > 0}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate Standard Cycle
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Real-time Equipment Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <EquipmentDiagram
                      type="complete-cycle"
                      width={400}
                      height={300}
                      animated={isAnimating}
                      refrigerant={selectedRefrigerant?.name}
                      showLabels={true}
                    />
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAnimating(!isAnimating)}
                    >
                      {isAnimating ? 'Stop Animation' : 'Start Animation'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="visualization">
            <CycleVisualization
              cycleData={visualizationData}
              isAnimating={isAnimating}
              onAnimationToggle={() => setIsAnimating(!isAnimating)}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {calculationData ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">COP</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {calculationData.cop.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Cooling Effect</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {calculationData.refrigerationEffect.toFixed(1)}
                        </div>
                        <div className="text-sm text-green-600">kJ/kg</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Gauge className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Work Input</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {calculationData.workInput.toFixed(1)}
                        </div>
                        <div className="text-sm text-orange-600">kJ/kg</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span className="font-medium">Heat Rejection</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {calculationData.heatRejection.toFixed(1)}
                        </div>
                        <div className="text-sm text-red-600">kJ/kg</div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    {calculationData.volumetricCapacity && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="font-medium">Volumetric Capacity</div>
                        <div className="text-xl font-bold text-purple-600">
                          {calculationData.volumetricCapacity.toFixed(1)} kJ/m³
                        </div>
                      </div>
                    )}

                    {/* Save Calculation */}
                    <SaveCalculation
                      calculationType="Enhanced Standard Cycle"
                      inputs={formData}
                      results={calculationData}
                      disabled={!calculationData}
                    />
                  </CardContent>
                </Card>

                {/* State Points Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>State Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">State</th>
                            <th className="text-left p-2">T (°C)</th>
                            <th className="text-left p-2">P (kPa)</th>
                            <th className="text-left p-2">h (kJ/kg)</th>
                            <th className="text-left p-2">s (kJ/kg-K)</th>
                            <th className="text-left p-2">Quality</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationData.statePoints.map((point, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{point.name}</td>
                              <td className="p-2">{point.temperature.toFixed(1)}</td>
                              <td className="p-2">{(point.pressure / 1000).toFixed(1)}</td>
                              <td className="p-2">{point.enthalpy.toFixed(1)}</td>
                              <td className="p-2">{point.entropy.toFixed(3)}</td>
                              <td className="p-2">
                                {point.quality !== undefined ? (
                                  <Badge variant="secondary">
                                    {(point.quality * 100).toFixed(1)}%
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run a calculation to see results</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle>Refrigeration Equipment Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Compressor</h3>
                    <EquipmentDiagram type="compressor" animated={isAnimating} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Condenser</h3>
                    <EquipmentDiagram type="condenser" animated={isAnimating} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Expansion Valve</h3>
                    <EquipmentDiagram type="expansion-valve" animated={isAnimating} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Evaporator</h3>
                    <EquipmentDiagram type="evaporator" animated={isAnimating} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

// Content component for use within Dashboard tabs (no header)
export function EnhancedStandardCycleContent() {
  // Same content as above but without Header and Footer
  return <div>Enhanced Standard Cycle Content for Dashboard</div>;
}
