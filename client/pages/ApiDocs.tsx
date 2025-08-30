import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Code, 
  Search, 
  PlayCircle, 
  FileText, 
  Key,
  Database,
  Send,
  CheckCircle,
  Copy,
  ExternalLink
} from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/calculate-standard",
    title: "Standard Cycle Calculation",
    description: "Calculate thermodynamic properties for a standard vapor compression cycle",
    parameters: {
      refrigerant: { type: "string", required: true, description: "Refrigerant name (e.g., 'R134a', 'R410A')" },
      evap_temp_c: { type: "number", required: true, description: "Evaporator temperature in Celsius" },
      cond_temp_c: { type: "number", required: true, description: "Condenser temperature in Celsius" },
      superheat_c: { type: "number", required: true, description: "Superheat in Celsius" },
      subcooling_c: { type: "number", required: true, description: "Subcooling in Celsius" }
    },
    example: {
      request: {
        refrigerant: "R134a",
        evap_temp_c: -10,
        cond_temp_c: 40,
        superheat_c: 5,
        subcooling_c: 5
      },
      response: {
        data: {
          performance: {
            cop: 3.999,
            work_of_compression_kj_kg: 41.57,
            refrigeration_effect_kj_kg: 166.24
          },
          state_points: {
            "1_compressor_inlet": { temp_c: -5 },
            "2_compressor_outlet": { temp_c: 67.39 },
            "3_expansion_valve_inlet": { temp_c: 35 },
            "4_evaporator_inlet": { vapor_quality: 0.309 }
          }
        }
      }
    }
  },
  {
    method: "POST",
    path: "/compare-refrigerants",
    title: "Refrigerant Comparison",
    description: "Compare performance characteristics of multiple refrigerants",
    parameters: {
      refrigerants: { type: "array", required: true, description: "Array of refrigerant names to compare" },
      cycle_params: { type: "object", required: true, description: "Cycle parameters for comparison" }
    },
    example: {
      request: {
        refrigerants: ["R134a", "R410A"],
        cycle_params: {
          refrigerant: "placeholder",
          evap_temp_c: -10,
          cond_temp_c: 40,
          superheat_c: 5,
          subcooling_c: 5
        }
      },
      response: {
        data: {
          results: [
            {
              refrigerant: "R134a",
              performance: { cop: 3.999, work_of_compression_kj_kg: 41.57 }
            },
            {
              refrigerant: "R410A", 
              performance: { cop: 4.123, work_of_compression_kj_kg: 39.84 }
            }
          ]
        }
      }
    }
  },
  {
    method: "POST",
    path: "/calculate-cascade",
    title: "Cascade Cycle Calculation",
    description: "Calculate performance for cascade refrigeration systems",
    parameters: {
      lt_cycle: { type: "object", required: true, description: "Low-temperature cycle parameters" },
      ht_cycle: { type: "object", required: true, description: "High-temperature cycle parameters" },
      cascade_hx_delta_t_c: { type: "number", required: true, description: "Cascade heat exchanger temperature difference" }
    },
    example: {
      request: {
        lt_cycle: {
          refrigerant: "R744",
          evap_temp_c: -40,
          cond_temp_c: -10,
          superheat_c: 5,
          subcooling_c: 5
        },
        ht_cycle: {
          refrigerant: "R134a",
          evap_temp_c: -15,
          cond_temp_c: 40,
          superheat_c: 5,
          subcooling_c: 5
        },
        cascade_hx_delta_t_c: 5
      },
      response: {
        data: {
          overall_performance: { cop: 2.623 },
          lt_cycle_performance: { cop: 7.159, work_of_compression_kj_kg: 27.6 },
          ht_cycle_performance: { cop: 4.717, work_of_compression_kj_kg: 54.06 }
        }
      }
    }
  }
];

const supportedRefrigerants = [
  "R134a", "R290", "R410A", "R404A", "R448A", "R32", "R744", "R507A", "R1234yf", "R1234ze(E)"
];

export function ApiDocs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="landing" />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-blue-600 bg-blue-100">
            API Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Calculation 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}API Reference
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Complete API reference for thermodynamic calculations. Integrate our calculation 
            engine into your applications with RESTful endpoints.
          </p>
        </div>

        {/* API Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-6 text-center">
              <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Base URL</h3>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                https://simulateon-backend-new.onrender.com
              </code>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-green-200">
            <CardContent className="p-6 text-center">
              <Send className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Type</h3>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                application/json
              </code>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-purple-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Format</h3>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                JSON
              </code>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          {filteredEndpoints.map((endpoint, index) => (
            <Card key={index} className="bg-white shadow-lg border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">{endpoint.method}</Badge>
                    <code className="text-lg font-mono">{endpoint.path}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEndpoint(selectedEndpoint === endpoint.path ? null : endpoint.path)}
                  >
                    {selectedEndpoint === endpoint.path ? "Hide" : "Show"} Details
                  </Button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{endpoint.title}</h3>
                  <p className="text-gray-600 mt-1">{endpoint.description}</p>
                </div>
              </CardHeader>
              
              {selectedEndpoint === endpoint.path && (
                <CardContent className="p-6">
                  {/* Parameters */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Request Parameters</h4>
                    <div className="space-y-3">
                      {Object.entries(endpoint.parameters).map(([param, info]) => (
                        <div key={param} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                          <code className="font-mono text-sm bg-white px-2 py-1 rounded border">
                            {param}
                          </code>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {info.type}
                              </Badge>
                              {info.required && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{info.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">Request Example</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(endpoint.example.request, null, 2))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(endpoint.example.request, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">Response Example</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(endpoint.example.response, null, 2))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(endpoint.example.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Supported Refrigerants */}
        <Card className="mt-12 bg-white shadow-lg border-blue-200">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Supported Refrigerants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {supportedRefrigerants.map((refrigerant) => (
                <Badge
                  key={refrigerant}
                  variant="outline"
                  className="justify-center py-2 text-center"
                >
                  {refrigerant}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              All refrigerants use industry-standard NIST property data for accurate calculations.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg border-green-200">
            <CardContent className="p-6 text-center">
              <PlayCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Try It Live</h3>
              <p className="text-gray-600 mb-4">Test the API directly in your browser</p>
              <Button variant="outline" className="border-green-200 hover:bg-green-50">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Playground
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-6 text-center">
              <Code className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Examples</h3>
              <p className="text-gray-600 mb-4">Integration examples in multiple languages</p>
              <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                View Examples
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-purple-200">
            <CardContent className="p-6 text-center">
              <Key className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get API Key</h3>
              <p className="text-gray-600 mb-4">Sign up for API access and rate limits</p>
              <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
