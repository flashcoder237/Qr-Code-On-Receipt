// src/components/organisms/app-sidebar/app-sidebar.tsx - Version avec menus groupés
import { useState, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getFilteredMenuGroups } from "@/lib/constants/menu";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Shield,
  Key,
  Lock,
  ChevronDown
} from "lucide-react";

export function AppSidebar() {
  const [path, setPath] = useLocalStorage<string>("current_path", "receipts");
  const [configs] = useLocalStorage("academicConfigs", []);
  const [settings] = useLocalStorage("settings", {});
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Génération de Documents"]));

  // Détection du mode démo
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  // Utiliser les groupes de menu filtrés selon le mode et le type d'établissement
  const menuGroups = getFilteredMenuGroups(isDemoMode, (settings as any).establishmentType);

  // Calcul des statistiques pour les indicateurs
  const statistics = useMemo(() => {
    const totalConfigs = configs.length;
    const hasSettings = (settings as any).nameFrench && (settings as any).nameEnglish;
    const completionRate = hasSettings && totalConfigs > 0 ? 100 :
                          hasSettings || totalConfigs > 0 ? 50 : 0;

    return {
      totalConfigs,
      hasSettings,
      completionRate,
      recentActivity: totalConfigs > 0 || hasSettings
    };
  }, [configs, settings]);

  const getMenuItemStatus = (url: string) => {
    // En mode démo, les éléments restreints sont marqués comme désactivés
    if (isDemoMode && url === "qrcode") {
      return "demo-restricted";
    }
    
    switch (url) {
      case "config":
        return statistics.totalConfigs > 0 ? "completed" : "pending";
      case "settings":
        return statistics.hasSettings ? "completed" : "pending";
      case "receipts":
      case "attestation":
        return statistics.totalConfigs > 0 && statistics.hasSettings ? "ready" : "disabled";
      default:
        return "normal";
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "ready":
        return <Activity className="h-3 w-3 text-blue-500" />;
      case "disabled":
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
      case "demo-restricted":
        return <Lock className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getMenuItemTooltip = (_url: string, status: string) => {
    if (status === "demo-restricted") {
      return "Fonctionnalité non disponible en mode démo";
    }
    return "";
  };

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  };

  return (
    <Sidebar className="border-r bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      <SidebarHeader className="border-b bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Gestion des A&R
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rélevés et Attestations
              </p>
              {isDemoMode && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                  <AlertTriangle className="h-2 w-2 mr-1" />
                  DÉMO
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Alerte mode démo */}
        {isDemoMode && (
          <div className="mx-2 my-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Mode Démo Actif
              </span>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-400">
              Fonctionnalités limitées. Les documents générés auront un filigrane "DÉMO".
            </p>
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              <Shield className="h-3 w-3 inline mr-1" />
              QR Codes sur PDF désactivés
            </div>
          </div>
        )}

        {/* Indicateur de progression globale */}
        <div className="mx-2 my-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configuration
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {statistics.completionRate}%
            </span>
          </div>
          <Progress 
            value={statistics.completionRate} 
            className="h-2"
          />
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {statistics.completionRate === 100 
                ? "Prêt à générer" 
                : statistics.completionRate > 0 
                  ? "Configuration en cours" 
                  : "Configuration requise"
              }
            </span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuGroups.map((group) => {
                const isOpen = openGroups.has(group.title);
                const GroupIcon = group.icon;

                return (
                  <Collapsible
                    key={group.title}
                    open={isOpen}
                    onOpenChange={() => toggleGroup(group.title)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                        >
                          <GroupIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="flex-1 text-sm">{group.title}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-0 mt-1 space-y-1">
                          {group.items.map((item) => {
                            const status = getMenuItemStatus(item.url);
                            const isActive = item.url === path;
                            const isDisabled = status === "disabled" || status === "demo-restricted";
                            const tooltip = getMenuItemTooltip(item.url, status);
                            const ItemIcon = item.icon;

                            return (
                              <SidebarMenuSubItem key={item.url}>
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={() => !isDisabled && setPath(item.url)}
                                  className={`
                                    relative flex items-center gap-3 pl-10 pr-3 py-2.5 rounded-lg transition-all
                                    ${isActive
                                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                                      : isDisabled
                                        ? status === "demo-restricted"
                                          ? 'text-red-400 dark:text-red-600 cursor-not-allowed opacity-60'
                                          : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                                    ${!isDisabled && !isActive ? 'hover:shadow-sm' : ''}
                                  `}
                                  disabled={isDisabled}
                                  title={tooltip}
                                >
                                  <ItemIcon className="h-4 w-4" />
                                  <span className="flex-1 text-sm">{item.title}</span>

                                  {/* Indicateurs de statut */}
                                  <div className="flex items-center gap-2">
                                    {item.url === "config" && statistics.totalConfigs > 0 && (
                                      <Badge variant="secondary" className="text-xs px-2 py-0">
                                        {statistics.totalConfigs}
                                      </Badge>
                                    )}
                                    {status === "demo-restricted" && (
                                      <Badge variant="destructive" className="text-xs px-1 py-0">
                                        <Lock className="h-2 w-2" />
                                      </Badge>
                                    )}
                                    {getStatusIndicator(status)}
                                  </div>

                                  {/* Indicateur de sélection */}
                                  {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4 mx-2" />

        {/* Section de statut rapide */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Statut
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1 px-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Configs</span>
                <div className="flex items-center gap-1">
                  <Badge variant={statistics.totalConfigs > 0 ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                    {statistics.totalConfigs}
                  </Badge>
                  {statistics.totalConfigs > 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Paramètres</span>
                <div className="flex items-center gap-1">
                  {statistics.hasSettings ? (
                    <>
                      <Badge variant="default" className="text-xs px-1.5 py-0">OK</Badge>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">-</Badge>
                      <AlertCircle className="h-3 w-3 text-gray-400" />
                    </>
                  )}
                </div>
              </div>

              {/* Statut licence */}
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Licence</span>
                <div className="flex items-center gap-1">
                  {isDemoMode ? (
                    <>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-800">DÉMO</Badge>
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                    </>
                  ) : (
                    <>
                      <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-100 text-green-800">FULL</Badge>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
  <div className="p-3">
    {/* Bouton pour quitter le mode démo si en mode démo */}
    {isDemoMode && (
      <div className="mb-3">
        <Button
          onClick={() => setPath("licenseSettings")}
          variant="outline"
          size="sm"
          className="w-full text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          <Key className="h-3 w-3 mr-1" />
          Activer une licence
        </Button>
      </div>
    )}
    
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <Activity className="h-3 w-3" />
      <span>
        {isDemoMode 
          ? "Mode démo - Fonctionnalités limitées"
          : statistics.recentActivity 
            ? "Système configuré" 
            : "Configuration requise"
        }
      </span>
    </div>
    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
      Version 2.0.1 By Cédric TEFOYE{isDemoMode && "- DÉMO"}
    </div>
  </div>
</SidebarFooter>
    </Sidebar>
  );
}