import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Thermometer,
  Gauge,
  Leaf,
  Shield,
  Search,
  TrendingUp,
  Star
} from 'lucide-react';
import {
  REFRIGERANT_DATABASE,
  validateOperatingConditions,
  getSuggestedOperatingRange,
  RefrigerantProperties,
  searchRefrigerants,
  getRefrigerantsByPopularity,
  POPULAR_REFRIGERANTS
} from '@/lib/refrigerants';

interface EnhancedRefrigerantSelectorProps {
  value: string;
  onChange: (value: string) => void;
  evaporatorTemp?: number;
  condenserTemp?: number;
  onSuggestedRangeApply?: (evapTemp: number, condTemp: number) => void;
  showValidation?: boolean;
  className?: string;
}

export function EnhancedRefrigerantSelector({
  value,
  onChange,
  evaporatorTemp,
  condenserTemp,
  onSuggestedRangeApply,
  showValidation = true,
  className
}: EnhancedRefrigerantSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [validationResults, setValidationResults] = useState<{
    evap: { valid: boolean; warnings: string[]; errors: string[] };
    cond: { valid: boolean; warnings: string[]; errors: string[] };
  } | null>(null);

  const selectedRefrigerant = REFRIGERANT_DATABASE.find(ref => ref.id === value);

  // Filter refrigerants based on search and category
  const filteredRefrigerants = REFRIGERANT_DATABASE.filter(ref => {
    const matchesSearch = ref.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ref.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ref.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ref.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Validate operating conditions when they change
  useEffect(() => {
    if (!value || !showValidation) {
      setValidationResults(null);
      return;
    }

    const evapValidation = evaporatorTemp !== undefined 
      ? validateOperatingConditions(value, evaporatorTemp) 
      : { valid: true, warnings: [], errors: [] };
    
    const condValidation = condenserTemp !== undefined 
      ? validateOperatingConditions(value, condenserTemp) 
      : { valid: true, warnings: [], errors: [] };

    setValidationResults({
      evap: evapValidation,
      cond: condValidation
    });
  }, [value, evaporatorTemp, condenserTemp, showValidation]);

  const handleSuggestedRangeApply = () => {
    if (!selectedRefrigerant || !onSuggestedRangeApply) return;
    
    const range = getSuggestedOperatingRange(value);
    if (range) {
      onSuggestedRangeApply(range.evaporatorTemp.recommended, range.condenserTemp.recommended);
    }
  };

  const getStatusIcon = (valid: boolean, hasWarnings: boolean) => {
    if (!valid) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (hasWarnings) return <Info className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const categories = [...new Set(REFRIGERANT_DATABASE.map(ref => ref.category))];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Refrigerant Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Refrigerants</Label>
              <Input
                id="search"
                placeholder="Search by name, ID, or full name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Select Refrigerant</Label>
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a refrigerant" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                {filteredRefrigerants.map(refrigerant => (
                  <SelectItem key={refrigerant.id} value={refrigerant.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: refrigerant.color }}
                        />
                        <span className="font-medium">{refrigerant.name}</span>
                        <span className="text-sm text-gray-500">({refrigerant.fullName})</span>
                      </div>
                      <div className="flex gap-1">
                        <Badge 
                          variant={refrigerant.coolpropSupport === 'full' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {refrigerant.coolpropSupport}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {refrigerant.safety}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selected Refrigerant Details */}
      {selectedRefrigerant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedRefrigerant.color }}
              />
              {selectedRefrigerant.name} - {selectedRefrigerant.fullName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Properties Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm font-medium">GWP</div>
                  <div className="text-sm text-gray-600">{selectedRefrigerant.globalWarmingPotential}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">Safety</div>
                  <div className="text-sm text-gray-600">{selectedRefrigerant.safety}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-sm font-medium">Critical Temp</div>
                  <div className="text-sm text-gray-600">
                    {(selectedRefrigerant.limits.criticalTemp - 273.15).toFixed(1)}°C
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">Critical Press</div>
                  <div className="text-sm text-gray-600">
                    {(selectedRefrigerant.limits.criticalPressure / 1000).toFixed(0)} kPa
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-700">{selectedRefrigerant.description}</p>
            </div>

            {/* Applications */}
            <div>
              <Label>Typical Applications</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedRefrigerant.applications.map(app => (
                  <Badge key={app} variant="outline" className="text-xs">
                    {app}
                  </Badge>
                ))}
              </div>
            </div>

            {/* CoolProp Support Warning */}
            {selectedRefrigerant.coolpropSupport !== 'full' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {selectedRefrigerant.coolpropSupport === 'limited' 
                    ? 'This refrigerant has limited CoolProp support. Some properties may not be available.'
                    : 'This refrigerant is not supported by CoolProp. Calculations may fail.'
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Suggested Operating Range */}
            {onSuggestedRangeApply && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recommended Operating Range
                  </h4>
                  <Button size="sm" onClick={handleSuggestedRangeApply}>
                    Apply Range
                  </Button>
                </div>
                {(() => {
                  const range = getSuggestedOperatingRange(value);
                  if (!range) return null;
                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Evaporator Temperature</div>
                        <div>Recommended: {range.evaporatorTemp.recommended.toFixed(1)}°C</div>
                        <div className="text-gray-600">
                          Range: {range.evaporatorTemp.min.toFixed(1)}°C to {range.evaporatorTemp.max.toFixed(1)}°C
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Condenser Temperature</div>
                        <div>Recommended: {range.condenserTemp.recommended.toFixed(1)}°C</div>
                        <div className="text-gray-600">
                          Range: {range.condenserTemp.min.toFixed(1)}°C to {range.condenserTemp.max.toFixed(1)}°C
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResults && showValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Operating Condition Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaporatorTemp !== undefined && (
              <div className="flex items-start gap-3">
                {getStatusIcon(validationResults.evap.valid, validationResults.evap.warnings.length > 0)}
                <div className="flex-1">
                  <div className="font-medium">Evaporator Temperature: {evaporatorTemp}°C</div>
                  {validationResults.evap.errors.map((error, idx) => (
                    <Alert key={idx} className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  ))}
                  {validationResults.evap.warnings.map((warning, idx) => (
                    <Alert key={idx} className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-yellow-700">{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {condenserTemp !== undefined && (
              <div className="flex items-start gap-3">
                {getStatusIcon(validationResults.cond.valid, validationResults.cond.warnings.length > 0)}
                <div className="flex-1">
                  <div className="font-medium">Condenser Temperature: {condenserTemp}°C</div>
                  {validationResults.cond.errors.map((error, idx) => (
                    <Alert key={idx} className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  ))}
                  {validationResults.cond.warnings.map((warning, idx) => (
                    <Alert key={idx} className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-yellow-700">{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
