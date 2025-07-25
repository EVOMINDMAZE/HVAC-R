import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Phone, 
  Calendar,
  Shield,
  Bell,
  Key,
  CreditCard,
  Download,
  Trash2,
  Camera
} from "lucide-react";

// Mock user data
const mockUser = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@company.com",
  company: "HVAC Solutions Inc.",
  role: "Senior HVAC Engineer",
  phone: "+1 (555) 123-4567",
  location: "New York, NY",
  avatar: "",
  joinedDate: "2024-01-01",
  plan: "Professional",
  calculationsUsed: 24,
  calculationsLimit: 100
};

export function Profile() {
  const { user: authUser, updateUser } = useSupabaseAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Initialize user state with real data when available, fallback to mock
  const initialUser = authUser ? {
    id: authUser.id,
    firstName: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || "User",
    lastName: authUser.user_metadata?.last_name || "",
    email: authUser.email || "",
    company: authUser.user_metadata?.company || "",
    role: authUser.user_metadata?.role || "",
    phone: authUser.phone || "",
    location: authUser.user_metadata?.location || "",
    avatar: authUser.user_metadata?.avatar_url || "",
    joinedDate: authUser.created_at?.split('T')[0] || "2024-01-01",
    plan: "Free",
    calculationsUsed: 0,
    calculationsLimit: 10
  } : mockUser;

  const [user, setUser] = useState(initialUser);

  // Update local state when auth user changes
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        firstName: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || "User",
        lastName: authUser.user_metadata?.last_name || "",
        email: authUser.email || "",
        company: authUser.user_metadata?.company || "",
        role: authUser.user_metadata?.role || "",
        phone: authUser.phone || "",
        location: authUser.user_metadata?.location || "",
        avatar: authUser.user_metadata?.avatar_url || "",
        joinedDate: authUser.created_at?.split('T')[0] || "2024-01-01",
        plan: "Free",
        calculationsUsed: 0,
        calculationsLimit: 10
      });
    }
  }, [authUser]);

  const handleSave = async () => {
    if (!authUser) {
      addToast({
        type: 'error',
        title: 'Not Authenticated',
        description: 'Please sign in to save changes'
      });
      return;
    }

    setLoading(true);
    try {
      // Update user metadata in Supabase
      const { error } = await updateUser({
        data: {
          first_name: user.firstName,
          last_name: user.lastName,
          company: user.company,
          role: user.role,
          location: user.location,
        }
      });

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to save profile changes'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-blue-900">Account Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white border border-blue-200">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Billing
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      variant="secondary"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-gray-600">{user.role}</p>
                    <p className="text-sm text-gray-500">
                      Member since {new Date(user.joinedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        value={user.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={user.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={user.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="company"
                        value={user.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        value={user.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Update Password
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                  <p className="text-gray-600 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-white shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Billing & Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Plan: {user.plan}</h3>
                    <p className="text-blue-700 mb-4">
                      You have used {user.calculationsUsed} of {user.calculationsLimit} calculations this month.
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(user.calculationsUsed / user.calculationsLimit) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Billing Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Billing History
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-red-600 mb-2">Danger Zone</h4>
                    <p className="text-gray-600 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="bg-white shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  <div className="space-y-4">
                    {[
                      "Email notifications for calculation results",
                      "Weekly usage summary",
                      "Product updates and news",
                      "Security alerts"
                    ].map((notification, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700">{notification}</span>
                        <input
                          type="checkbox"
                          defaultChecked={index < 2}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Default Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultUnits">Default Temperature Units</Label>
                      <Select defaultValue="celsius">
                        <SelectTrigger className="border-blue-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="celsius">Celsius (°C)</SelectItem>
                          <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                          <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultPressure">Default Pressure Units</Label>
                      <Select defaultValue="kpa">
                        <SelectTrigger className="border-blue-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kpa">kPa</SelectItem>
                          <SelectItem value="bar">bar</SelectItem>
                          <SelectItem value="psi">psi</SelectItem>
                          <SelectItem value="mpa">MPa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
