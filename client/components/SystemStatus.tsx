import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export function SystemStatus() {
  // Check if we're in development mode and if APIs are configured
  const hasExternalAPI = true; // External calculation API is always available
  const hasInternalAPI = !!process.env.VITE_API_BASE_URL; // Internal API depends on env var
  
  // Only show status if there are issues to report
  if (hasExternalAPI && hasInternalAPI) {
    return null;
  }

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 mb-2">System Status</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-yellow-700">Calculation Services</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              
              {!hasInternalAPI && (
                <div className="flex items-center justify-between">
                  <span className="text-yellow-700">User Account Features</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Limited
                  </Badge>
                </div>
              )}
            </div>
            
            {!hasInternalAPI && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Some account features (subscription management, user profiles) 
                  are currently running in demo mode. All calculation tools are fully functional.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
