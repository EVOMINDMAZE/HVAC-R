import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Mail,
  Trash2,
  Shield,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PageContainer } from "@/components/PageContainer";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  user_id: string;
  role: "admin" | "manager" | "tech" | "client";
  email?: string;
}

export default function Team() {
  const { user, role: myRole, session } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("tech");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [user]);

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/team", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch team");

      const result = await response.json();
      setMembers(result.data || []);
    } catch (error: any) {
      console.error("Error fetching team", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
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

      setInviteEmail("");
      setInviteName("");
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
    <PageContainer variant="standard" className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground mb-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your technicians and office staff.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Invite Column */}
        <Card className="md:col-span-1 h-fit bg-card/50 backdrop-blur-sm">
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
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-member-email">Email Address</Label>
                <Input
                  id="team-member-email"
                  type="email"
                  placeholder="john@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-member-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="team-member-role">
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
        </Card>

        {/* Team List Column */}
        <Card className="md:col-span-2 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Current Team</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
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
                        No team members found. Invite someone!
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
        </Card>
      </div>
    </PageContainer>
  );
}
