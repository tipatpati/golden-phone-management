import React from "react";
import { useNavigate } from "react-router-dom";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { logger } from "@/utils/logger";
import goldenPhoneLogo from "@/assets/golden-phone-logo.png";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  CircuitBoard, 
  TrendingUp, 
  FileText, 
  Building2,
  BarChart3,
  Settings,
  Euro,
  CheckCircle,
  Calendar,
  UserCheck,
  Clock,
  Store
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
  
  logger.debug('WelcomeScreen Debug', { userRole, availableRoles: Object.keys(ROLE_CONFIGS) }, 'WelcomeScreen');
  
  const config = ROLE_CONFIGS[userRole];

  if (!config) {
    logger.error('No config found for role', { userRole }, 'WelcomeScreen');
    logger.debug('Available roles', { roles: Object.keys(ROLE_CONFIGS) }, 'WelcomeScreen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Errore di configurazione</h2>
          <p className="text-gray-600">Ruolo non riconosciuto: {userRole}</p>
          <p className="text-gray-500 text-sm mt-2">Ruoli disponibili: {Object.keys(ROLE_CONFIGS).join(', ')}</p>
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
      bgColor: "bg-[#2563eb]/30 hover:bg-[#2563eb]/40 border-[#2563eb] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(37,99,235,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(37,99,235,0.9)]", // Blue neon with white glow
      feature: ["gestione_vendite", "elaborazione_vendite", "supervisione_vendite"]
    },
    {
      title: "RIPARAZIONI",
      icon: CircuitBoard,
      route: "/repairs",
      color: "text-white",
      bgColor: "bg-[#dc2626]/30 hover:bg-[#dc2626]/40 border-[#dc2626] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(220,38,38,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(220,38,38,0.9)]", // Red neon with white glow
      feature: "gestione_riparazioni"
    },
    {
      title: "INVENTARIO",
      icon: Package,
      route: "/inventory",
      color: "text-white",
      bgColor: "bg-[#059669]/30 hover:bg-[#059669]/40 border-[#059669] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(5,150,105,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(5,150,105,0.9)]", // Green neon with white glow
      feature: "gestione_completa_inventario"
    },
    {
      title: "CLIENTI",
      icon: Users,
      route: "/clients",
      color: "text-white",
      bgColor: "bg-[#0891b2]/30 hover:bg-[#0891b2]/40 border-[#0891b2] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(8,145,178,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(8,145,178,0.9)]", // Cyan neon with white glow
      feature: "gestione_clienti"
    },
    {
      title: "FORNITORI",
      icon: Building2,
      route: "/suppliers",
      color: "text-white",
      bgColor: "bg-[#f59e0b]/30 hover:bg-[#f59e0b]/40 border-[#f59e0b] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(245,158,11,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(245,158,11,0.9)]", // Orange neon with white glow
      feature: "gestione_ordini"
    },
    {
      title: "DIPENDENTI",
      icon: UserCheck,
      route: "/employees",
      color: "text-white",
      bgColor: "bg-[#6b7280]/30 hover:bg-[#6b7280]/40 border-[#6b7280] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(107,114,128,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(107,114,128,0.9)]", // Gray neon with white glow
      feature: "gestione_dipendenti"
    },
    {
      title: "FINANZE",
      icon: Euro,
      route: "/finances",
      color: "text-white",
      bgColor: "bg-[#7c3aed]/30 hover:bg-[#7c3aed]/40 border-[#7c3aed] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(124,58,237,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(124,58,237,0.9)]", // Purple neon with white glow
      feature: "gestione_finanziaria"
    },
    {
      title: "PROFILO",
      icon: Settings,
      route: "/profile",
      color: "text-white",
      bgColor: "bg-[#1f2937]/30 hover:bg-[#1f2937]/40 border-[#94a3b8] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(148,163,184,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(148,163,184,0.9)]" // Light gray neon with white glow
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 p-6 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-40 h-40 bg-white/50 rounded-full blur-2xl"></div>
      </div>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-8 mb-8 relative overflow-hidden transition-all duration-500 hover:bg-white/15 hover:border-white/30">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Centered Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={goldenPhoneLogo} 
                alt="Golden Phone Logo" 
                className="h-20 lg:h-24 xl:h-28 w-auto"
              />
            </div>
            
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User Info */}
               <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-white" />
                  <span className="text-xs text-white/70 uppercase tracking-wide">Utente</span>
                </div>
                <div className="font-semibold text-white">{config.name}</div>
                <div className="text-sm text-white/80">admin</div>
              </div>
              
              {/* Date and Time */}
               <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-white" />
                  <span className="text-xs text-white/90">{currentDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-white" />
                  <span className="text-2xl font-bold text-white">{currentTime}</span>
                </div>
              </div>
              
              {/* Store Info */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4 text-white" />
                  <span className="text-xs text-white/70 uppercase tracking-wide">Negozio</span>
                </div>
                <div className="font-semibold text-white">Nome du magasin</div>
                <div className="text-lg font-bold text-white">CORSO</div>
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
                  backdrop-blur-md
                  border-2
                  rounded-3xl p-8 
                  transform hover:scale-105 
                  transition-all duration-300 
                  min-h-[140px]
                  flex flex-col items-center justify-center
                  font-bold text-xl
                  active:scale-95
                  drop-shadow-2xl
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 50}ms` }}
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
        <div className="text-center mt-12 text-white/50 text-sm drop-shadow-sm">
          © 2025 GOLDEN TRADE O&A SRL. Tutti i diritti sono riservati.
        </div>
      </div>
    </div>
  );
}