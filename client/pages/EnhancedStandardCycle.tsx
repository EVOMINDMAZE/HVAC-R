import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Loader2, Calculator, Eye, FileText, Wrench, Play, Pause, RotateCcw } from 'lucide-react';
import { EnhancedRefrigerantSelector } from '../components/EnhancedRefrigerantSelector';
import { CycleVisualization } from '../components/CycleVisualization';
import { EquipmentDiagrams } from '../components/EquipmentDiagrams';
import { RefrigerantProperties, validateCycleConditions, getRefrigerantById } from '../lib/refrigerants';

interface CalculationResults {
  point_1: {
    temperature_c: number;
    pressure_kpa: number;
    enthalpy_kj_kg: number;
    entropy_kj_kg_k: number;
    density_kg_m3: number;
    quality?: number;
  };
  point_2: {
    temperature_c: number;
    pressure_kpa: number;
    enthalpy_kj_kg: number;
    entropy_kj_kg_k: number;
    density_kg_m3: number;
  };
  point_3: {
    temperature_c: number;
    pressure_kpa: number;
    enthalpy_kj_kg: number;
    entropy_kj_kg_k: number;
    density_kg_m3: number;
  };
  point_4: {
    temperature_c: number;
    pressure_kpa: number;
    enthalpy_kj_kg: number;
    entropy_kj_kg_k: number;
    density_kg_m3: number;
    quality?: number;
  };
  performance: {
    cop: number;
    cooling_capacity_kw: number;
    compressor_work_kw: number;
    heat_rejection_kw: number;
    mass_flow_rate_kg_s: number;
    volumetric_flow_rate_m3_s: number;
  };
  refrigerant: string;
  cycle_type: 'standard';
}

interface CycleAnimationState {
  isAnimating: boolean;
  currentPoint: number;
  animationSpeed: number;
}

// Content-only version for embedding in other pages
export function EnhancedStandardCycleContent() {
  const [formData, setFormData] = useState({
    refrigerant: 'R134a',
    evap_temp_c: -10,
    cond_temp_c: 45,
    superheat_c: 5,
    subcooling_c: 2
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<RefrigerantProperties | null>(null);
  const [animationState, setAnimationState] = useState<CycleAnimationState>({
    isAnimating: false,
    currentPoint: 1,
    animationSpeed: 1000
  });

  const handleInputChange = useCallback((field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  }, []);

  const handleRefrigerantChange = useCallback((refrigerant: string) => {
    setFormData(prev => ({ ...prev, refrigerant }));
    const refProps = getRefrigerantById(refrigerant);
    setSelectedRefrigerant(refProps);
    
    if (refProps) {
      const warnings = validateCycleConditions(refProps, {
        evaporatorTemp: formData.evap_temp_c,
        condenserTemp: formData.cond_temp_c,
        superheat: formData.superheat_c,
        subcooling: formData.subcooling_c
      });
      setValidationWarnings(warnings);
    }
    setError(null);
  }, [formData.evap_temp_c, formData.cond_temp_c, formData.superheat_c, formData.subcooling_c]);

  const validateInputs = useCallback(() => {
    if (formData.evap_temp_c >= formData.cond_temp_c) {
      setError('Evaporator temperature must be lower than condenser temperature');
      return false;
    }
    if (formData.superheat_c < 0 || formData.subcooling_c < 0) {
      setError('Superheat and subcooling must be positive values');
      return false;
    }
    return true;
  }, [formData]);

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('https://simulateon-backend.onrender.com/calculate-standard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      if (responseData.data) {
        setResults(responseData.data);
        setAnimationState(prev => ({ ...prev, currentPoint: 1 }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimation = () => {
    setAnimationState(prev => ({
      ...prev,
      isAnimating: !prev.isAnimating
    }));
  };

  const resetAnimation = () => {
    setAnimationState(prev => ({
      ...prev,
      isAnimating: false,
      currentPoint: 1
    }));
  };

  const adjustAnimationSpeed = (speed: number) => {
    setAnimationState(prev => ({
      ...prev,
      animationSpeed: speed
    }));
  };

  const formatValue = (value: number, unit: string, decimals: number = 2) => {
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const cycleData = results ? {
    points: [
      {
        id: '1',
        name: 'Evaporator Outlet',
        temperature: results.point_1?.temperature_c || results.state_points?.[0]?.temperature_c || 0,
        pressure: results.point_1?.pressure_kpa || results.state_points?.[0]?.pressure_kpa || 0,
        enthalpy: results.point_1?.enthalpy_kj_kg || results.state_points?.[0]?.enthalpy_kj_kg || 0,
        entropy: results.point_1?.entropy_kj_kg_k || results.state_points?.[0]?.entropy_kj_kg_k || 0,
        quality: results.point_1?.quality,
        x: 0, // Will be calculated by CycleVisualization
        y: 0
      },
      {
        id: '2',
        name: 'Compressor Outlet',
        temperature: results.point_2?.temperature_c || results.state_points?.[1]?.temperature_c || 0,
        pressure: results.point_2?.pressure_kpa || results.state_points?.[1]?.pressure_kpa || 0,
        enthalpy: results.point_2?.enthalpy_kj_kg || results.state_points?.[1]?.enthalpy_kj_kg || 0,
        entropy: results.point_2?.entropy_kj_kg_k || results.state_points?.[1]?.entropy_kj_kg_k || 0,
        quality: results.point_2?.quality,
        x: 0,
        y: 0
      },
      {
        id: '3',
        name: 'Condenser Outlet',
        temperature: results.point_3?.temperature_c || results.state_points?.[2]?.temperature_c || 0,
        pressure: results.point_3?.pressure_kpa || results.state_points?.[2]?.pressure_kpa || 0,
        enthalpy: results.point_3?.enthalpy_kj_kg || results.state_points?.[2]?.enthalpy_kj_kg || 0,
        entropy: results.point_3?.entropy_kj_kg_k || results.state_points?.[2]?.entropy_kj_kg_k || 0,
        quality: results.point_3?.quality,
        x: 0,
        y: 0
      },
      {
        id: '4',
        name: 'Expansion Valve Outlet',
        temperature: results.point_4?.temperature_c || results.state_points?.[3]?.temperature_c || 0,
        pressure: results.point_4?.pressure_kpa || results.state_points?.[3]?.pressure_kpa || 0,
        enthalpy: results.point_4?.enthalpy_kj_kg || results.state_points?.[3]?.enthalpy_kj_kg || 0,
        entropy: results.point_4?.entropy_kj_kg_k || results.state_points?.[3]?.entropy_kj_kg_k || 0,
        quality: results.point_4?.quality,
        x: 0,
        y: 0
      }
    ],
    refrigerant: results.refrigerant || formData.refrigerant,
    cycleType: 'standard' as const
  } : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Standard Refrigeration Cycle</h1>
        <p className="text-gray-600">
          Advanced cycle analysis with real-time visualization and equipment simulation
        </p>
      </div>

      <Tabs defaultValue="calculation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculation
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2" disabled={!results}>
            <Eye className="h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!results}>
            <FileText className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2" disabled={!results}>
            <Wrench className="h-4 w-4" />
            Equipment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cycle Parameters</CardTitle>
                <CardDescription>
                  Configure refrigerant and operating conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="refrigerant">Refrigerant</Label>
                  <EnhancedRefrigerantSelector
                    value={formData.refrigerant}
                    onChange={handleRefrigerantChange}
                    className="mt-2"
                  />
                  {selectedRefrigerant && (
                    <div className="mt-2 text-sm text-gray-600">
                      <Badge variant="outline" className="mr-2">
                        {selectedRefrigerant.safety_class}
                      </Badge>
                      GWP: {selectedRefrigerant.gwp} | ODP: {selectedRefrigerant.odp}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="evap_temp">Evaporator Temperature (°C)</Label>
                    <Input
                      id="evap_temp"
                      type="number"
                      value={formData.evap_temp_c}
                      onChange={(e) => handleInputChange('evap_temp_c', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cond_temp">Condenser Temperature (°C)</Label>
                    <Input
                      id="cond_temp"
                      type="number"
                      value={formData.cond_temp_c}
                      onChange={(e) => handleInputChange('cond_temp_c', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="superheat">Superheat (°C)</Label>
                    <Input
                      id="superheat"
                      type="number"
                      value={formData.superheat_c}
                      onChange={(e) => handleInputChange('superheat_c', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subcooling">Subcooling (°C)</Label>
                    <Input
                      id="subcooling"
                      type="number"
                      value={formData.subcooling_c}
                      onChange={(e) => handleInputChange('subcooling_c', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {validationWarnings.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <strong>Operating Condition Warnings:</strong>
                      <ul className="mt-1 ml-4 list-disc">
                        {validationWarnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleCalculate} 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Cycle
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Validation</CardTitle>
                <CardDescription>
                  CoolProp integration and property verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRefrigerant ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Critical Temperature:</span>
                        <div>{selectedRefrigerant.limits.critical_temp_c.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <span className="font-medium">Critical Pressure:</span>
                        <div>{(selectedRefrigerant.limits.critical_pressure_kpa / 1000).toFixed(1)} MPa</div>
                      </div>
                      <div>
                        <span className="font-medium">Min Temperature:</span>
                        <div>{selectedRefrigerant.limits.min_temp_c.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <span className="font-medium">Max Temperature:</span>
                        <div>{selectedRefrigerant.limits.max_temp_c.toFixed(1)}°C</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <span className="font-medium">CoolProp Support:</span>
                      <Badge 
                        variant={selectedRefrigerant.coolpropSupport === 'full' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {selectedRefrigerant.coolpropSupport}
                      </Badge>
                    </div>
                    
                    {selectedRefrigerant.applications && (
                      <div>
                        <span className="font-medium">Applications:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedRefrigerant.applications.map((app, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Select a refrigerant to view properties
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                P-h Diagram Visualization
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAnimation}
                    disabled={!results}
                  >
                    {animationState.isAnimating ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAnimation}
                    disabled={!results}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Interactive pressure-enthalpy diagram with cycle animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results && cycleData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Label>Animation Speed:</Label>
                    <div className="flex gap-2">
                      {[500, 1000, 2000].map(speed => (
                        <Button
                          key={speed}
                          variant={animationState.animationSpeed === speed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => adjustAnimationSpeed(speed)}
                        >
                          {speed === 500 ? 'Fast' : speed === 1000 ? 'Normal' : 'Slow'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CycleVisualization
                    cycleData={cycleData}
                    isAnimating={animationState.isAnimating}
                    animationSpeed={animationState.animationSpeed}
                    currentPoint={animationState.currentPoint}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Calculate a cycle to view the P-h diagram visualization
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cycle Performance</CardTitle>
                <CardDescription>Overall system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {results.performance.cop.toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-800">Coefficient of Performance</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatValue(results.performance.cooling_capacity_kw, 'kW')}
                        </div>
                        <div className="text-sm text-green-800">Cooling Capacity</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatValue(results.performance.compressor_work_kw, 'kW')}
                        </div>
                        <div className="text-sm text-orange-800">Compressor Work</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {formatValue(results.performance.heat_rejection_kw, 'kW')}
                        </div>
                        <div className="text-sm text-red-800">Heat Rejection</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Mass Flow Rate:</span>
                        <span className="font-mono">{formatValue(results.performance.mass_flow_rate_kg_s, 'kg/s', 4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volumetric Flow Rate:</span>
                        <span className="font-mono">{formatValue(results.performance.volumetric_flow_rate_m3_s, 'm³/s', 6)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No results available. Calculate a cycle first.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Points</CardTitle>
                <CardDescription>Thermodynamic properties at each cycle point</CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    {[
                      { point: results.point_1, label: 'Point 1 - Evaporator Outlet', color: 'blue' },
                      { point: results.point_2, label: 'Point 2 - Compressor Outlet', color: 'red' },
                      { point: results.point_3, label: 'Point 3 - Condenser Outlet', color: 'green' },
                      { point: results.point_4, label: 'Point 4 - Expansion Outlet', color: 'orange' }
                    ].map(({ point, label, color }, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className={`font-medium text-${color}-600 mb-2`}>{label}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>T: {formatValue(point.temperature_c, '°C')}</div>
                          <div>P: {formatValue(point.pressure_kpa, 'kPa', 0)}</div>
                          <div>h: {formatValue(point.enthalpy_kj_kg, 'kJ/kg')}</div>
                          <div>s: {formatValue(point.entropy_kj_kg_k, 'kJ/kg·K', 3)}</div>
                          <div>ρ: {formatValue(point.density_kg_m3, 'kg/m³')}</div>
                          {point.quality !== undefined && (
                            <div>x: {formatValue(point.quality * 100, '%')}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No results available. Calculate a cycle first.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Diagrams</CardTitle>
              <CardDescription>
                Interactive system components with refrigerant flow visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <EquipmentDiagrams 
                  cycleData={cycleData}
                  isAnimating={animationState.isAnimating}
                  animationSpeed={animationState.animationSpeed}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Calculate a cycle to view equipment diagrams
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Standalone page version with header and footer
export function EnhancedStandardCycle() {
  return <EnhancedStandardCycleContent />;
}
