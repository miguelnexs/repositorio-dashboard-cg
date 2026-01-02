import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, Users, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  // Mock data for Plan 1 (MVP)
  const stats = [
    {
      title: "Ventas Totales",
      value: "$1,234,567",
      description: "+20.1% desde el mes pasado",
      icon: DollarSign,
    },
    {
      title: "Pedidos Pendientes",
      value: "12",
      description: "4 urgentes",
      icon: ShoppingBag,
    },
    {
      title: "Clientes Activos",
      value: "573",
      description: "+201 nuevos usuarios",
      icon: Users,
    },
    {
      title: "Stock Bajo",
      value: "7",
      description: "Productos con < 5 unidades",
      icon: AlertTriangle,
    },
  ];

  const recentOrders = [
    { id: "ORD001", customer: "Juan Pérez", total: "$120.000", status: "Pendiente", date: "2024-03-20" },
    { id: "ORD002", customer: "Ana García", total: "$85.000", status: "Enviado", date: "2024-03-19" },
    { id: "ORD003", customer: "Carlos Ruiz", total: "$240.000", status: "Entregado", date: "2024-03-19" },
    { id: "ORD004", customer: "Maria Lopez", total: "$45.000", status: "Pendiente", date: "2024-03-18" },
    { id: "ORD005", customer: "Pedro Diaz", total: "$150.000", status: "Cancelado", date: "2024-03-18" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Resumen de la actividad de tu tienda.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        order.status === "Entregado" ? "default" : 
                        order.status === "Pendiente" ? "secondary" : 
                        order.status === "Enviado" ? "outline" : "destructive"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{order.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
