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
      bgColor: "bg-[#3b82f6]/50 hover:bg-[#3b82f6]/70 border-[#60a5fa] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(59,130,246,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(59,130,246,1)]", // Brighter blue neon
      feature: ["gestione_vendite", "elaborazione_vendite", "supervisione_vendite"]
    },
    {
      title: "RIPARAZIONI",
      icon: CircuitBoard,
      route: "/repairs",
      color: "text-white",
      bgColor: "bg-[#ef4444]/50 hover:bg-[#ef4444]/70 border-[#f87171] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(239,68,68,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(239,68,68,1)]", // Brighter red neon
      feature: "gestione_riparazioni"
    },
    {
      title: "INVENTARIO",
      icon: Package,
      route: "/inventory",
      color: "text-white",
      bgColor: "bg-[#10b981]/50 hover:bg-[#10b981]/70 border-[#34d399] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(16,185,129,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(16,185,129,1)]", // Brighter green neon
      feature: "gestione_completa_inventario"
    },
    {
      title: "CLIENTI",
      icon: Users,
      route: "/clients",
      color: "text-white",
      bgColor: "bg-[#06b6d4]/50 hover:bg-[#06b6d4]/70 border-[#22d3ee] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(6,182,212,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(6,182,212,1)]", // Brighter cyan neon
      feature: "gestione_clienti"
    },
    {
      title: "FORNITORI",
      icon: Building2,
      route: "/suppliers",
      color: "text-white",
      bgColor: "bg-[#f59e0b]/50 hover:bg-[#f59e0b]/70 border-[#fbbf24] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(245,158,11,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(245,158,11,1)]", // Brighter orange neon
      feature: "gestione_ordini"
    },
    {
      title: "DIPENDENTI",
      icon: UserCheck,
      route: "/employees",
      color: "text-white",
      bgColor: "bg-[#8b5cf6]/50 hover:bg-[#8b5cf6]/70 border-[#a78bfa] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(139,92,246,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(139,92,246,1)]", // Brighter violet neon
      feature: "gestione_dipendenti"
    },
    {
      title: "FINANZE",
      icon: Euro,
      route: "/finances",
      color: "text-white",
      bgColor: "bg-[#a855f7]/50 hover:bg-[#a855f7]/70 border-[#c084fc] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(168,85,247,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(168,85,247,1)]", // Brighter purple neon
      feature: "gestione_finanziaria"
    },
    {
      title: "PROFILO",
      icon: Settings,
      route: "/profile",
      color: "text-white",
      bgColor: "bg-[#64748b]/50 hover:bg-[#64748b]/70 border-[#94a3b8] hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3),0_0_40px_rgba(148,163,184,0.7)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(148,163,184,1)]" // Brighter slate neon
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
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-4 sm:p-6 lg:p-10 mb-8 relative overflow-hidden transition-all duration-500 hover:bg-white/15 hover:border-white/30 animate-fade-in">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
            {/* Left Section - Logo and User Info */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              {/* Logo */}
              <div className="flex justify-center lg:justify-start">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <img 
                    src={goldenPhoneLogo} 
                    alt="Golden Phone Logo" 
                    className="h-14 lg:h-16 xl:h-18 w-auto"
                  />
                </div>
              </div>
              
              {/* User Info Card */}
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-white/30 hover:bg-white/15 hover:border-white/40 transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider font-semibold">Utente Attivo</div>
                  <div className="px-2.5 py-1 bg-white/20 rounded-full text-[10px] sm:text-xs font-bold text-white backdrop-blur-sm border border-white/20">
                    admin
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-white/25 to-white/10 rounded-xl p-2 border border-white/20">
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-lg" />
                  </div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold text-white drop-shadow-md">{config.name}</div>
                </div>
              </div>
            </div>
            
            {/* Center Section - Date & Time (Hero Feature) */}
            <div className="lg:col-span-6 flex items-center">
              <div className="w-full bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-lg rounded-3xl px-6 py-8 lg:py-10 border-2 border-white/40 hover:border-white/50 transition-all duration-300 shadow-[0_20px_60px_rgba(255,255,255,0.15)] hover:shadow-[0_25px_70px_rgba(255,255,255,0.25)] hover:scale-[1.02]">
                <div className="text-center space-y-4">
                  {/* Date */}
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="bg-white/20 rounded-lg p-1.5 backdrop-blur-sm">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/95 font-semibold tracking-wide">{currentDate}</span>
                  </div>
                  
                  {/* Time - Main Feature */}
                  <div className="flex items-center justify-center gap-3 lg:gap-4">
                    <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm border border-white/30">
                      <Clock className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white drop-shadow-lg" />
                    </div>
                    <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                      {currentTime}
                    </span>
                  </div>
                  
                  {/* Label */}
                  <div className="pt-2">
                    <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-[0.2em] font-bold">Ora Corrente</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section - Store Info */}
            <div className="lg:col-span-3 flex items-stretch">
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl px-5 py-6 border border-white/30 hover:bg-white/15 hover:border-white/40 transition-all duration-200 flex flex-col justify-center shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-white/25 to-white/10 rounded-xl p-2.5 border border-white/20">
                    <Store className="h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider font-semibold">Punto Vendita</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">Nome du magasin</div>
                  <div className="text-2xl sm:text-3xl font-black text-white drop-shadow-md tracking-tight">CORSO</div>
                </div>
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