import React from 'react';
import { useTheme } from '@/contexts/useTheme';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Laptop, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [cacheDuration, setCacheDuration] = React.useState('7');

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-3xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Settings</h2>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>
        
        <div className="grid gap-6">          {/* Appearance Settings */}
          <Card 
            variant="glass"
            hover="lift"
            animate
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how the application looks
                  </CardDescription>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-sm">
                  <Sun className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Theme Mode</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant={theme === "light" ? "gradient" : "glass"} 
                      className={cn(
                        "flex h-24 flex-col items-center justify-center gap-2 rounded-lg px-4 py-3 transition-all duration-300",
                        theme === "light" ? "shadow-md" : ""
                      )}
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-6 w-6" />
                      <span>Light</span>
                    </Button>                    <Button 
                      variant={theme === "dark" ? "gradient" : "glass"} 
                      className={cn(
                        "flex h-24 flex-col items-center justify-center gap-2 rounded-lg px-4 py-3 transition-all duration-300",
                        theme === "dark" ? "shadow-md" : ""
                      )}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-6 w-6" />
                      <span>Dark</span>
                    </Button>
                    <Button 
                      variant={theme === "system" ? "gradient" : "glass"} 
                      className={cn(
                        "flex h-24 flex-col items-center justify-center gap-2 rounded-lg px-4 py-3 transition-all duration-300",
                        theme === "system" ? "shadow-md" : ""
                      )}
                      onClick={() => setTheme("system")}>
                      <Laptop className="h-5 w-5" />
                      <span className="text-xs">System</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose a theme preference or use your system settings
                  </p>
                </div>
                <Separator />
              </div>
            </CardContent>
          </Card>
            {/* Cache Settings */}          <Card
            variant="glass"
            hover="scale"
            animate
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Cache Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how workout data is stored locally
                  </CardDescription>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-sm">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cacheDuration" className="text-sm font-medium mb-2 block">Cache Duration</Label>
                  <Select
                    value={cacheDuration}
                    onValueChange={setCacheDuration}
                  >
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Data older than this will be refreshed from the server when you're online
                  </p>
                </div>
              </div>
            </CardContent>            <CardFooter className="flex justify-end bg-muted/10 backdrop-blur-sm border-t border-t-border/30 px-6 py-4">
              <Button 
                variant="gradient" 
                className="gap-2 hover:scale-105 transition-transform rounded-lg shadow-sm hover:shadow-md"
              >
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
          
          {/* User Profile */}          <Card
            variant="glass"
            hover="glow"
            animate
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    User Profile
                  </CardTitle>
                  <CardDescription>
                    Manage your personal information
                  </CardDescription>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-sm">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-md">
                  <span className="text-lg font-medium">JD</span>
                </div>                <div>
                  <p className="text-base font-semibold">John Doe</p>
                  <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                </div>
                <Button 
                  variant="glass" 
                  size="sm" 
                  className="ml-auto hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  Edit Profile
                </Button>
              </div>
              <Separator />
              <div>
                <Label htmlFor="notifications" className="text-sm font-medium mb-2 block">Email Notifications</Label>
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3Z"/><path d="M19 17v1a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-1"/></svg>
                  <Label htmlFor="notifications" className="text-sm text-muted-foreground">Receive weekly workout summaries</Label>
                  <div className="ml-auto">
                    <Select defaultValue="weekly">
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
