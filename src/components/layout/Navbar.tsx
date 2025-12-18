import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function Navbar() {
  const { profile, logout } = useAuth();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const isActivePath = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/timeline", label: "Timeline", icon: Calendar },
    { path: "/my-bookings", label: "Minhas Reservas", icon: User },
  ];

  const adminItems = isAdmin
    ? [
        { path: "/admin/users", label: "Usuários", icon: UsersIcon },
        { path: "/admin/rooms", label: "Salas", icon: Building2 },
        { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      ]
    : [];

  return (
    <nav className="fixed top-0 w-full border-b border-border/50 backdrop-blur-md shadow-card bg-white z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 hover:opacity-80 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-card group-hover:shadow-card-hover transition-all bg-gradient-to-br from-primary to-brand-secondary">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-800 bg-clip-text">
                Spot
              </span>
            </button>

            <div className="hidden md:flex items-center gap-1 ml-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActivePath(item.path)
                      ? "bg-blue-100 text-blue-800 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}

              {adminItems.length > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-200 mx-2"></div>
                  {adminItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        isActivePath(item.path)
                          ? "bg-purple-100 text-purple-800 shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 leading-none">
                  {profile?.full_name?.split(" ")[0] || "Usuário"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {profile?.department || "Colaborador"}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                >
                  <Avatar className="h-11 w-11 shadow-card">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="text-white font-semibold text-sm bg-gradient-to-br from-primary to-brand-secondary">
                      {getInitials(profile?.full_name || profile?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 shadow-card-hover"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Usuário"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                    {profile?.department && (
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {profile.department}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-bookings")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Minhas Reservas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-error focus:text-error"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
