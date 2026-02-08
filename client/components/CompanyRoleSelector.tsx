import { useState, useRef, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Users,
  Shield,
  Wrench,
  User,
  Crown,
  Plus,
  LogOut,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="w-4 h-4 text-purple-500" />,
  owner: <Crown className="w-4 h-4 text-yellow-500" />,
  manager: <Users className="w-4 h-4 text-blue-500" />,
  tech: <Wrench className="w-4 h-4 text-green-500" />,
  technician: <Wrench className="w-4 h-4 text-green-500" />,
  client: <User className="w-4 h-4 text-gray-500" />,
};

const roleColors: Record<string, string> = {
  admin:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  owner:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  tech: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  technician:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  client: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

export function CompanyRoleSelector() {
  const {
    companies,
    activeCompany,
    switchCompany,
    needsCompanySelection,
    signOut,
    isLoading,
  } = useSupabaseAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (needsCompanySelection && companies.length > 1) {
      setIsOpen(true);
    }
  }, [needsCompanySelection, companies.length]);

  const handleSwitchCompany = async (companyId: string) => {
    setIsSwitching(true);
    setIsOpen(false);

    try {
      const { success, error } = await switchCompany(companyId);
      if (success) {
        console.log("[CompanyRoleSelector] Switched company successfully");
        navigate("/dashboard");
      } else {
        console.error("[CompanyRoleSelector] Failed to switch:", error);
      }
    } catch (err) {
      console.error("[CompanyRoleSelector] Exception during switch:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateCompany = () => {
    navigate("/create-company");
  };

  const handleJoinCompany = () => {
    navigate("/join-company");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="min-w-[200px]">
        <Building2 className="w-4 h-4 mr-2 animate-pulse" />
        Loading...
      </Button>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleJoinCompany}>
          <Plus className="w-4 h-4 mr-2" />
          Join Company
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          className={cn(
            "min-w-[240px] justify-between gap-2",
            needsCompanySelection && "border-yellow-500 animate-pulse",
          )}
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {activeCompany?.company_name || "Select Company"}
            </span>
            {activeCompany?.role && (
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 text-xs",
                  roleColors[activeCompany.role] || "",
                )}
              >
                {roleIcons[activeCompany.role]}
                <span className="ml-1 capitalize">{activeCompany.role}</span>
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 shrink-0 transition-transform",
              isOpen && "rotate-180",
              isSwitching && "animate-spin",
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64"
        onCloseAutoFocus={(e) => {
          if (
            buttonRef.current &&
            !buttonRef.current.contains(e.target as Node)
          ) {
            setIsOpen(false);
          }
        }}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Your Companies</span>
          <Badge variant="outline" className="text-xs">
            {companies.length}{" "}
            {companies.length === 1 ? "company" : "companies"}
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {companies.map((company) => (
          <DropdownMenuItem
            key={company.company_id}
            onClick={() => handleSwitchCompany(company.company_id)}
            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2 w-full">
              {company.is_owner ? (
                <Crown className="w-4 h-4 text-yellow-500" />
              ) : (
                roleIcons[company.role] || <Building2 className="w-4 h-4" />
              )}
              <span className="font-medium truncate flex-1">
                {company.company_name}
              </span>
              {activeCompany?.company_id === company.company_id && (
                <Check className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 w-full text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className={cn("text-xs", roleColors[company.role] || "")}
              >
                {company.role}
              </Badge>
              {company.is_owner && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  Owner
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleCreateCompany}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Company</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleJoinCompany}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Join Company</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CompanyBanner() {
  const { activeCompany, companies, needsCompanySelection } = useSupabaseAuth();
  const navigate = useNavigate();

  if (needsCompanySelection && companies.length > 1) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Select a Company
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You belong to multiple companies. Please select one to continue.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/select-company")}
            className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900"
          >
            Select Now
          </Button>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-800 dark:text-blue-200">
              No Company Selected
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Create or join a company to get started.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/join-company")}>
              <Plus className="w-4 h-4 mr-2" />
              Join Company
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{activeCompany.company_name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className={roleColors[activeCompany.role]}
              >
                {roleIcons[activeCompany.role]}
                <span className="ml-1 capitalize">{activeCompany.role}</span>
              </Badge>
            </div>
          </div>
        </div>
        <CompanyRoleSelector />
      </div>
    </div>
  );
}
