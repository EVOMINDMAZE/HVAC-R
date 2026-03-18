import {
  Loader2,
  Trash2,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import { useToast } from "@/components/ui/use-toast";


import { PageContainer } from "@/components/PageContainer";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const TEAM_UI_COPY = {
  loadErrorTitle: "Unable to load team members.",
  loadErrorDescription:
    "Check your connection and try again. If it keeps failing, sign in again.",
  emptyTable: "No team members yet. Send an invite to get started.",
};

export default function Team() {
  const { user, role: myRole, session } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("tech");
  const [inviting, setInviting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string; role?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; name?: boolean; role?: boolean }>({});

  // Validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!isValidEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'name':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;
      case 'role':
        if (!value) {
          error = 'Role is required';
        }
        break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {
      email: validateField('email', inviteEmail),
      name: validateField('name', inviteName),
      role: validateField('role', inviteRole),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.name && !newErrors.role;
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === 'email' ? inviteEmail : field === 'name' ? inviteName : inviteRole;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (!user || !session?.access_token) return;
    fetchTeam();
  }, [user, session?.access_token]);

  const fetchTeam = async () => {
    if (!session?.access_token) return;
    setLoadError(null);
    try {
      const url = "/api/team";
      console.log("Fetching team from:", url);
      console.log("Authorization token present:", !!session?.access_token);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status, response.statusText);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log("Response text (first 500 chars):", responseText.substring(0, 500));
      
      if (!response.ok) {
        console.error("Response not OK, text:", responseText);
        throw new Error("Failed to fetch team");
      }

      const result = JSON.parse(responseText);
      console.log("Parsed result:", result);
      setMembers(result.data || []);
    } catch (error: any) {
      console.error("Error fetching team", error);
      console.error("Error stack:", error.stack);
      setMembers([]);
      setLoadError(error?.message || TEAM_UI_COPY.loadErrorDescription);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show errors
    setTouched({ email: true, name: true, role: true });
    
    // Validate form before submitting
    if (!validateForm()) {
      return; // validation errors displayed
    }
    
    setInviting(true);

    try {
      if (!session?.access_token) {
        throw new Error("You are not authenticated. Please sign in again.");
      }
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          full_name: inviteName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation");
      }

      toast({
        title: "Invitation Sent",
        description: `Invited ${inviteEmail} as ${inviteRole}.`,
      });

      // Reset form and errors
      setInviteEmail("");
      setInviteName("");
      setErrors({});
      setTouched({});
      fetchTeam(); // Refresh list
    } catch (error: any) {
      toast({
        title: "Invite Failed",
        description: error.message || "Could not send invitation.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleUpdate = async (
    userId: string,
    newRole: "admin" | "manager" | "tech",
  ) => {
    try {
      if (!session?.access_token) {
        throw new Error("You are not authenticated. Please sign in again.");
      }
      const response = await fetch("/api/team/role", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role");
      }

      toast({
        title: "Role Updated",
        description: `Successfully changed member role to ${newRole}.`,
      });
      fetchTeam();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this team member? This will delete their role mapping.",
      )
    )
      return;
    try {
      if (!session?.access_token) {
        throw new Error("You are not authenticated. Please sign in again.");
      }
      const response = await fetch("/api/team/member", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove member");
      }

      toast({
        title: "Member Removed",
        description: "The team member's role has been revoked.",
      });
      fetchTeam();
    } catch (error: any) {
      toast({
        title: "Removal Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <AppPageHeader
        kicker="Account"
        title="Team Management"
        subtitle="Manage roles, permissions, and staff invitations from one workspace."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        }
      />

      <div className="grid gap-8 md:grid-cols-3">
        {/* Invite Column */}
        <AppSectionCard className="h-fit p-0 md:col-span-1">
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>
              Send an email invitation to join your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-member-name">Full Name</Label>
                <Input
                  id="team-member-name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => {
                    setInviteName(e.target.value);
                    if (touched.name) {
                      const error = validateField('name', e.target.value);
                      setErrors(prev => ({ ...prev, name: error }));
                    }
                  }}
                  onBlur={handleBlur('name')}
                  required
                  className={touched.name && errors.name ? "border-destructive" : ""}
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-member-email">Email Address</Label>
                <Input
                  id="team-member-email"
                  type="email"
                  placeholder="john@example.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (touched.email) {
                      const error = validateField('email', e.target.value);
                      setErrors(prev => ({ ...prev, email: error }));
                    }
                  }}
                  onBlur={handleBlur('email')}
                  required
                  className={touched.email && errors.email ? "border-destructive" : ""}
                />
                {touched.email && errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-member-role">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => {
                  setInviteRole(value);
                  setTouched(prev => ({ ...prev, role: true }));
                  const error = validateField('role', value);
                  setErrors(prev => ({ ...prev, role: error }));
                }}>
                  <SelectTrigger id="team-member-role" className={touched.role && errors.role ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technician</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    {myRole === "admin" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {touched.role && errors.role && (
                  <p className="text-sm text-destructive">{errors.role}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={inviting}>
                {inviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Send Invite
              </Button>
            </form>
          </CardContent>
        </AppSectionCard>

        {/* Team List Column */}
        <AppSectionCard className="p-0 md:col-span-2">
          <CardHeader>
            <CardTitle>Current Team</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : loadError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">
                  {TEAM_UI_COPY.loadErrorTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={fetchTeam}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-6 text-muted-foreground"
                      >
                        {TEAM_UI_COPY.emptyTable}
                      </TableCell>
                    </TableRow>
                  )}
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {member.role[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {member.user_id === user?.id
                                ? "You"
                                : member.email || "User"}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {member.user_id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.user_id === user?.id ? (
                          <Badge
                            variant={
                              member.role === "admin"
                                ? "default"
                                : member.role === "manager"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {member.role}
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(newRole) =>
                              handleRoleUpdate(member.user_id, newRole as any)
                            }
                            disabled={
                              !(
                                myRole === "admin" ||
                                (myRole === "manager" &&
                                  member.role !== "admin")
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tech">Technician</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              {myRole === "admin" && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(myRole === "admin" ||
                          (myRole === "manager" && member.role !== "admin")) &&
                          member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(member.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </AppSectionCard>
      </div>
    </PageContainer>
  );
}
