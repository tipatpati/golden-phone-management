import React from "react";
import { useNavigate } from "react-router-dom";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Wrench, 
  TrendingUp, 
  FileText, 
  Building2,
  BarChart3,
  Settings,
  DollarSign,
  CheckCircle,
  Calendar
} from "lucide-react";

interface WelcomeScreenProps {
  userRole: UserRole;
}

interface ModuleButton {
  title: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
  bgColor: string;
  feature?: string | string[];
  permission?: string;
}

export function WelcomeScreen({ userRole }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const config = ROLE_CONFIGS[userRole];

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Caricamento...</h2>
          <p className="text-gray-600">Preparazione del tuo spazio di lavoro...</p>
        </div>
      </div>
    );
  }

  // Define all possible modules with their properties
  const allModules: ModuleButton[] = [
    {
      title: "GARENTILLE",
      icon: ShoppingCart,
      route: "/sales",
      color: "text-white",
      bgColor: "bg-[#2563eb] hover:bg-[#1e40af]", // Blue like "GARANZIA" in reference
      feature: ["gestione_vendite", "elaborazione_vendite", "supervisione_vendite"]
    },
    {
      title: "RIPARAZIONI",
      icon: Wrench,
      route: "/repairs",
      color: "text-white",
      bgColor: "bg-[#dc2626] hover:bg-[#b91c1c]", // Red like "RIPARAZIONE" in reference
      feature: "gestione_riparazioni"
    },
    {
      title: "INVENTARIO",
      icon: Package,
      route: "/inventory",
      color: "text-white",
      bgColor: "bg-[#059669] hover:bg-[#047857]", // Green like "MAGAZZINO" in reference
      feature: "gestione_completa_inventario"
    },
    {
      title: "CLIENTI",
      icon: Users,
      route: "/clients",
      color: "text-white",
      bgColor: "bg-[#0891b2] hover:bg-[#0e7490]", // Cyan like "Stato Garanzia" in reference
      feature: "gestione_clienti"
    },
    {
      title: "FORNITORI",
      icon: Building2,
      route: "/suppliers",
      color: "text-white",
      bgColor: "bg-[#f59e0b] hover:bg-[#d97706]", // Orange/Yellow like "ORDINE" in reference
      feature: "gestione_ordini"
    },
    {
      title: "DIPENDENTI",
      icon: Users,
      route: "/employees",
      color: "text-white",
      bgColor: "bg-[#6b7280] hover:bg-[#4b5563]", // Gray like "Statistiche" in reference
      feature: "gestione_dipendenti"
    },
    {
      title: "FINANZE",
      icon: DollarSign,
      route: "/finances",
      color: "text-white",
      bgColor: "bg-[#7c3aed] hover:bg-[#6d28d9]", // Purple like "PANORAMICA" in reference
      feature: "gestione_finanziaria"
    },
    {
      title: "PROFILO",
      icon: Settings,
      route: "/profile",
      color: "text-white",
      bgColor: "bg-[#1f2937] hover:bg-[#111827]" // Dark like "Documento di Garanzia" in reference
    }
  ];

  // Filter modules based on user role and features
  const availableModules = allModules.filter(module => {
    if (!module.feature) return true; // Always show modules without feature restrictions (like profile)
    if (Array.isArray(module.feature)) {
      return module.feature.some(f => config.features.includes(f));
    }
    return config.features.includes(module.feature);
  });

  const currentDate = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                GOLDEN TRADE O&A SRL
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-lg text-blue-600 font-semibold">
                  Utente Connesso: {config.name}
                </span>
                <span className="text-gray-600">admin</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Data: {currentDate}</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {currentTime}
              </div>
              <div className="text-right mt-2">
                <span className="text-blue-600 font-semibold">Nome du magasin</span>
                <div className="text-gray-600">CORSO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {availableModules.map((module, index) => {
            const IconComponent = module.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(module.route)}
                className={`
                  ${module.bgColor}
                  ${module.color}
                  rounded-2xl p-8 
                  shadow-xl hover:shadow-2xl 
                  transform hover:scale-105 
                  transition-all duration-300 
                  border-0
                  min-h-[140px]
                  flex flex-col items-center justify-center
                  font-bold text-xl
                  active:scale-95
                `}
              >
                <IconComponent className="h-12 w-12 mb-4" />
                <span className="text-center leading-tight">
                  {module.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          © 2025 GOLDEN TRADE O&A SRL. Tutti i diritti sono riservati.
        </div>
      </div>
    </div>
  );
}