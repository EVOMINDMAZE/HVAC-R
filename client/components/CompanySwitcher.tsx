import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Company {
  company_id: string;
  company_name: string;
  role: string;
}

export function CompanySwitcher() {
  const [open, setOpen] = useState(false);
  const { companies, activeCompany, switchCompany, isLoading } =
    useSupabaseAuth();

  if (companies.length < 1) {
    return null;
  }

  const handleSwitch = async (companyId: string) => {
    const result = await switchCompany(companyId);
    setOpen(false);

    if (result.success) {
      toast({
        title: "Context Updated",
        description: "Switched active company successfully.",
      });
      window.location.reload();
    } else {
      toast({
        title: "Switch Failed",
        description: result.error || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedCompanies = [...companies].sort((a, b) =>
    a.company_name.localeCompare(b.company_name),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a company"
          className={cn(
            "w-[240px] justify-between ml-2 h-10 px-3 shadow-none border-dashed hover:border-solid transition-all hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-slate-200",
            open &&
              "bg-slate-50 text-slate-900 border-solid dark:bg-slate-800/50 dark:text-slate-200",
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-5 w-5 border border-border">
              <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                {activeCompany ? getInitials(activeCompany.company_name) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate w-[140px] text-left">
              {activeCompany?.company_name || "Select Team"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[240px] p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800"
        align="start"
      >
        <Command className="[&_[cmdk-input-wrapper]]:border-0 bg-transparent">
          <CommandList>
            <CommandInput
              placeholder="Find team..."
              className="!border-none !ring-0 !ring-offset-0 focus:!ring-0 focus:!border-none focus-visible:!ring-0 focus-visible:!outline-none"
            />
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup heading="Teams" className="p-1.5">
              {sortedCompanies.map((company) => {
                const isActive =
                  activeCompany?.company_id === company.company_id;
                return (
                  <CommandItem
                    key={company.company_id}
                    onSelect={() => handleSwitch(company.company_id)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors",
                      "data-[selected=true]:!bg-transparent hover:!bg-slate-50 dark:hover:!bg-slate-800",
                      "data-[selected=true]:!text-slate-900 dark:data-[selected=true]:!text-slate-50",
                      isActive &&
                        "text-slate-900 dark:text-slate-100 font-medium",
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                          {getInitials(company.company_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-medium">
                          {company.company_name}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
