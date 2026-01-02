import Header from "@/components/lovalbe/Header";
import Products from "@/components/lovalbe/Products";
import Footer from "@/components/lovalbe/Footer";

const ProductsPage = () => {
  return (
    <div className="min-h-screen relative bg-background">
      <Header />
      <main className="pt-24">
        <Products />
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
