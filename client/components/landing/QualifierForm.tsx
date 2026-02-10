import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface QualifierFormValues {
  role: string;
  teamSize: string;
  monthlyJobs: string;
  email: string;
  challenge: string;
}

interface QualifierFormProps {
  onSubmit: (values: QualifierFormValues) => void;
}

const initialState: QualifierFormValues = {
  role: "",
  teamSize: "",
  monthlyJobs: "",
  email: "",
  challenge: "",
};

export function QualifierForm({ onSubmit }: QualifierFormProps) {
  const [values, setValues] = useState<QualifierFormValues>(initialState);

  const updateField = (field: keyof QualifierFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="landing-surface rounded-2xl p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="qualifier-role">Role</Label>
          <select
            id="qualifier-role"
            className="landing-select"
            value={values.role}
            onChange={(event) => updateField("role", event.target.value)}
            required
          >
            <option value="" disabled>
              Select role
            </option>
            <option value="owner_manager">Owner / Manager</option>
            <option value="technician">Technician / Lead Tech</option>
            <option value="entrepreneur">Entrepreneur / New Shop</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifier-team">Team size</Label>
          <select
            id="qualifier-team"
            className="landing-select"
            value={values.teamSize}
            onChange={(event) => updateField("teamSize", event.target.value)}
            required
          >
            <option value="" disabled>
              Select team size
            </option>
            <option value="1-3">1-3</option>
            <option value="4-10">4-10</option>
            <option value="11-25">11-25</option>
            <option value="26+">26+</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifier-jobs">Monthly jobs range</Label>
          <select
            id="qualifier-jobs"
            className="landing-select"
            value={values.monthlyJobs}
            onChange={(event) => updateField("monthlyJobs", event.target.value)}
            required
          >
            <option value="" disabled>
              Select monthly jobs
            </option>
            <option value="1-30">1-30</option>
            <option value="31-100">31-100</option>
            <option value="101-250">101-250</option>
            <option value="251+">251+</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifier-email">Email</Label>
          <Input
            id="qualifier-email"
            type="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="qualifier-challenge">Primary challenge</Label>
        <Textarea
          id="qualifier-challenge"
          placeholder="What is the main operational issue you want to fix first?"
          value={values.challenge}
          onChange={(event) => updateField("challenge", event.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use this to route you to the right onboarding path.
        </p>
        <Button type="submit">Send qualification and book next step</Button>
      </div>
    </form>
  );
}
