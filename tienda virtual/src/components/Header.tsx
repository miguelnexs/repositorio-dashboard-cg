import { Link } from "react-router-dom";
import { User, ShoppingCart } from "lucide-react";
import HamburgerMenu from "./HamburgerMenu";
import UserProfile from "./UserProfile";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import logoImage from "../../img/logo_Mesa de trabajo 1.png";

const Header = () => {
  const { isAuthenticated, user } = useAuth();
  const { totalItems } = useCart();

  return (
    <div className="bg-white border-b border-neutral-200 py-2 px-6">
      <div className="flex items-center justify-between">
        {/* Menu Hamburguesa */}
        <HamburgerMenu />
        
        {/* Logo Centrado */}
        <div className="flex-1 text-center">
          <Link to="/">
            <img 
              src={user?.tienda?.logo ? user.tienda.logo : logoImage} 
              alt={user?.tienda?.nombre || "CG by Caro Gonzalez"} 
              className="w-20 h-20 mx-auto object-contain"
            />
          </Link>
          {user?.tienda && (
            <p className="text-xs text-gray-600 mt-1 font-medium">
              {user.tienda.nombre}
            </p>
          )}
        </div>
        
        {/* Usuario */}
        <div className="flex items-center space-x-3 relative">
          {isAuthenticated && <UserProfile />}
          <Link to="/carrito" className="relative">
            <ShoppingCart className="w-6 h-6 text-neutral-800" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-neutral-900 text-white text-xs rounded-full px-1 min-w-[20px] text-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
