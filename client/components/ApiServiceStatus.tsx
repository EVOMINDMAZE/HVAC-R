import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface ServiceStatus {
  name: string;
  endpoint: string;
  status: "online" | "offline" | "checking";
  lastChecked?: Date;
  responseTime?: number;
}

export function ApiServiceStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Standard Cycle API",
      endpoint: "/calculate-standard",
      status: "checking",
    },
    {
      name: "Refrigerant Comparison API",
      endpoint: "/compare-refrigerants",
      status: "checking",
    },
    {
      name: "Cascade Cycle API",
      endpoint: "/calculate-cascade",
      status: "checking",
    },
  ]);

  const [isVisible, setIsVisible] = useState(false);

  const checkServiceHealth = async (
    service: ServiceStatus,
  ): Promise<ServiceStatus> => {
    const startTime = Date.now();
    try {
      // Use a simple HEAD request to check if service is responding (no body parsing needed)
      const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
        method: "HEAD",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      return {
        ...service,
        status: response.ok ? "online" : "offline",
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      console.log(`Service ${service.name} health check failed:`, error);
      return {
        ...service,
        status: "offline",
        lastChecked: new Date(),
      };
    }
  };

  const checkAllServices = async () => {
    setServices((prev) =>
      prev.map((service) => ({ ...service, status: "checking" })),
    );

    const updatedServices = await Promise.all(
      services.map((service) => checkServiceHealth(service)),
    );

    setServices(updatedServices);

    // Show status if any service is offline
    const hasOfflineService = updatedServices.some(
      (s) => s.status === "offline",
    );
    setIsVisible(hasOfflineService);
  };

  useEffect(() => {
    // Don't check services automatically on mount to avoid initial errors
    // User can manually trigger health checks when needed

    // Set up periodic health checks every 10 minutes (only after manual trigger)
    let interval: NodeJS.Timeout;
    if (isVisible) {
      interval = setInterval(checkAllServices, 10 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  // Don't show if all services are online
  if (!isVisible && !services.some((s) => s.status === "offline")) {
    return null;
  }

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "checking":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "offline":
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      case "checking":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Checking...</Badge>
        );
    }
  };

  const hasOfflineServices = services.some((s) => s.status === "offline");

  return (
    <Card
      className={`mb-6 ${hasOfflineServices ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
    >
      <CardHeader
        className={`${hasOfflineServices ? "bg-red-100" : "bg-yellow-100"}`}
      >
        <CardTitle className="flex items-center text-lg">
          <AlertTriangle
            className={`h-5 w-5 mr-2 ${hasOfflineServices ? "text-red-600" : "text-yellow-600"}`}
          />
          API Service Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {hasOfflineServices && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Some calculation services are currently unavailable. This may
              cause calculations to fail.
            </p>
            <p className="text-red-700 text-xs mt-1">
              The external calculation API may be experiencing downtime. Please
              try again later.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-md border"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  {service.lastChecked && (
                    <p className="text-xs text-gray-500">
                      Last checked: {service.lastChecked.toLocaleTimeString()}
                      {service.responseTime && ` (${service.responseTime}ms)`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(service.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={checkAllServices}
            disabled={services.some((s) => s.status === "checking")}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${services.some((s) => s.status === "checking") ? "animate-spin" : ""}`}
            />
            Refresh Status
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            Dismiss
          </Button>
        </div>

        {hasOfflineServices && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm font-medium">
              💡 Troubleshooting Tips:
            </p>
            <ul className="text-blue-700 text-xs mt-1 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>
                • The API server may be starting up (this can take 30-60
                seconds)
              </li>
              <li>• If problems persist, contact support</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
