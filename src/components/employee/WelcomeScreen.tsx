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
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-5 sm:p-7 lg:p-12 mb-10 relative overflow-hidden transition-all duration-500 hover:bg-white/15 hover:border-white/30 animate-fade-in">
          {/* Decorative background elements */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
            {/* Left Section - Logo and User Info */}
            <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-6 h-full">
              {/* Logo */}
              <div className="flex justify-center lg:justify-start">
                <img 
                  src={goldenPhoneLogo} 
                  alt="Golden Phone Logo" 
                  className="w-full max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/30 hover:border-white/40 hover:from-white/20 hover:to-white/10 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02]">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
                    <span className="text-[11px] text-white/80 uppercase tracking-[0.15em] font-bold">Utente Attivo</span>
                  </div>
                  <div className="px-3 py-1.5 bg-white/25 hover:bg-white/30 rounded-full text-xs font-black text-white backdrop-blur-sm border border-white/30 shadow-inner transition-colors duration-200">
                    ADMIN
                  </div>
                </div>
                
                {/* User Details */}
                <div className="flex items-center gap-3.5">
                  <div className="relative bg-gradient-to-br from-white/30 to-white/15 rounded-xl p-2.5 border border-white/30 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 rounded-xl"></div>
                    <UserCheck className="relative h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg sm:text-xl font-black text-white drop-shadow-lg truncate">{config.name}</div>
                    <div className="text-xs text-white/70 font-medium">Sistema di Gestione</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Center Section - Date & Time (Hero Feature) */}
            <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center h-full">
              <div className="w-full max-w-lg bg-gradient-to-br from-white/25 via-white/15 to-white/5 backdrop-blur-xl rounded-[2rem] px-6 py-8 lg:py-10 border-2 border-white/50 hover:border-white/60 transition-all duration-300 shadow-[0_25px_70px_rgba(255,255,255,0.2)] hover:shadow-[0_30px_80px_rgba(255,255,255,0.3)] hover:scale-[1.01] relative overflow-hidden">
                {/* Inner glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-[2rem]"></div>
                
                <div className="relative text-center space-y-5">
                  {/* Date Header */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-white/30 rounded-xl p-2 backdrop-blur-sm border border-white/40 shadow-lg">
                      <Calendar className="h-5 w-5 text-white drop-shadow-lg" />
                    </div>
                    <span className="text-sm sm:text-base text-white font-bold tracking-wide drop-shadow-lg">{currentDate}</span>
                  </div>
                  
                  {/* Time Display - Main Hero */}
                  <div className="flex items-center justify-center gap-4 lg:gap-5">
                    <div className="bg-gradient-to-br from-white/30 to-white/20 rounded-2xl p-3 backdrop-blur-sm border-2 border-white/40 shadow-2xl">
                      <Clock className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white drop-shadow-2xl" />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 blur-2xl"></div>
                      <span className="relative text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] [text-shadow:_0_0_30px_rgb(255_255_255_/_40%)]">
                        {currentTime}
                      </span>
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="pt-2">
                    <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                      <span className="text-[11px] text-white/90 uppercase tracking-[0.25em] font-black">Ora Corrente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section - Store Info */}
            <div className="lg:col-span-3 xl:col-span-3 flex items-stretch h-full">
              <div className="w-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl px-6 py-7 border border-white/30 hover:border-white/40 hover:from-white/20 hover:to-white/10 transition-all duration-300 flex flex-col justify-center shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02]">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/20">
                  <div className="relative bg-gradient-to-br from-white/30 to-white/15 rounded-xl p-2.5 border border-white/30 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 rounded-xl"></div>
                    <Store className="relative h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                  <span className="text-[11px] text-white/80 uppercase tracking-[0.15em] font-bold">Punto Vendita</span>
                </div>
                
                {/* Store Details */}
                <div className="space-y-2 pl-0.5">
                  <div className="text-xs sm:text-sm font-semibold text-white/80 tracking-wide">Nome du magasin</div>
                  <div className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg tracking-tight leading-none">CORSO</div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 h-1 bg-gradient-to-r from-white/40 via-white/20 to-transparent rounded-full"></div>
                  </div>
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