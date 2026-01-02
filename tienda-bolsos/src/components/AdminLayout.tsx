import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Pedidos",
    url: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Productos",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Configuración",
    url: "/admin/settings",
    icon: Settings,
  },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <div className="mt-auto p-4">
               <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/">
                      <LogOut />
                      <span>Volver a la tienda</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6 bg-muted/10">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
