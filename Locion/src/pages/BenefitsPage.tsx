import Header from "@/components/lovalbe/Header";
import Benefits from "@/components/lovalbe/Benefits";
import Footer from "@/components/lovalbe/Footer";
import { useEffect, useState } from "react";

const BenefitsPage = () => {
  const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
  const [bgUrl, setBgUrl] = useState<string>("");
  useEffect(() => {
    const site = (() => {
      try {
        const o = window.location.origin;
        return o.endsWith("/") ? o : `${o}/`;
      } catch { return "http://localhost:8000/"; }
    })();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/webconfig/public/banners/`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          const first = data.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0];
          const url = typeof first.image === "string" ? first.image : "";
          if (url) setBgUrl(url);
        } else {
          const sres = await fetch(`${API_BASE}/webconfig/public/settings/?site=${encodeURIComponent(site)}`);
          const sdata = await sres.json();
          if (sres.ok && sdata && typeof sdata.logo === "string") {
            const logo = sdata.logo.startsWith("http") ? sdata.logo : `${API_BASE}${sdata.logo}`;
            setBgUrl(logo);
          }
        }
      } catch {}
    })();
  }, []);
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10" style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
      <div className="fixed inset-0 -z-10 bg-black/40" />
      <Header />
      <main className="pt-24">
        <Benefits />
      </main>
      <Footer />
    </div>
  );
};

export default BenefitsPage;
