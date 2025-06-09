// src/components/organisms/app-toolbar/app-toolbar.tsx - Version corrigée
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { 
  Bell, 
  Settings, 
  HelpCircle, 
  Keyboard, 
  Moon, 
  Sun, 
  User,
  Search,
  AlertTriangle,
  Command
} from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

interface ToolbarContextType {
  title: ReactNode;
  menu: ReactNode;
  setTitle: (title: ReactNode) => void;
  setMenu: (menu: ReactNode) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const ToolbarCtx = createContext<ToolbarContextType>({
  title: "",
  menu: <></>,
  setTitle: () => {},
  setMenu: () => {},
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
});

export const AppToolbarTitle = ({ children }: PropsWithChildren) => {
  const { setTitle } = useContext(ToolbarCtx);
  useEffect(() => setTitle(children), [children, setTitle]);
  return null;
};

export const AppToolbarMenu = ({ children }: PropsWithChildren) => {
  const { setMenu } = useContext(ToolbarCtx);
  useEffect(() => setMenu(children), [children, setMenu]);
  return null;
};

export function useAppToolbar() {
  const ctx = useContext(ToolbarCtx);
  if (!ctx)
    throw new Error("useAppToolbar must be used inside ToolbarCtx.Provider");
  return ctx;
}

export const AppToolbarProvider = ({ children }: PropsWithChildren) => {
  const [title, setTitle] = useState<ReactNode>("");
  const [menu, setMenu] = useState<ReactNode>(<></>);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>("notifications", []);
  const [isDarkMode, setIsDarkMode] = useLocalStorage("dark-mode", false);

  // Applique le mode sombre au chargement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Garde seulement les 10 dernières
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // Ouvrir la recherche
            addNotification({
              title: "Recherche",
              message: "Fonctionnalité de recherche à implémenter",
              type: "info"
            });
            break;
          case '/':
            e.preventDefault();
            // Ouvrir l'aide
            addNotification({
              title: "Aide",
              message: "Guide des raccourcis clavier disponible",
              type: "info"
            });
            break;
          case 'b':
            e.preventDefault();
            // Toggle sidebar (peut être implémenté plus tard)
            addNotification({
              title: "Sidebar",
              message: "Fonction toggle sidebar disponible",
              type: "info"
            });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const contextValue: ToolbarContextType = {
    menu,
    setMenu,
    setTitle,
    title,
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
  };

  return (
    <ToolbarCtx.Provider value={contextValue}>
      {children}
    </ToolbarCtx.Provider>
  );
};

export const AppToolbar = () => {
  const { menu, title, notifications, markAsRead, clearNotifications } = useAppToolbar();
  const [isDarkMode, setIsDarkMode] = useLocalStorage("dark-mode", false);
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "error": return "🔴";
      case "warning": return "🟡";
      case "success": return "🟢";
      default: return "🔵";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "Maintenant";
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-gray-800 dark:bg-gray-950/95">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {title}
              </h1>
              {/* Badge mode démo */}
              {isDemoMode && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  MODE DÉMO
                </Badge>
              )}
            </div>
          </div>

          {/* Centre - Barre de recherche rapide */}
          <div className="hidden md:flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher... (Ctrl+K)"
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                onFocus={() => {
                  // Placeholder pour la fonctionnalité de recherche
                }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="hidden md:inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                  <Command className="h-3 w-3 mr-1 inline" />K
                </kbd>
              </div>
            </div>
          </div>

          {/* Droite - Actions et notifications avec limitations démo */}
          <div className="flex items-center gap-2">
            {/* Menu personnalisé */}
            {menu}

            {/* Notifications avec limitation démo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                  {isDemoMode && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2">
                  <h3 className="font-semibold">
                    Notifications {isDemoMode && <span className="text-xs text-orange-600">(Démo)</span>}
                  </h3>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearNotifications}
                      className="text-xs"
                    >
                      Tout effacer
                    </Button>
                  )}
                </div>
                
                {isDemoMode && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2 bg-orange-50 border border-orange-200 mx-2 rounded text-xs text-orange-800">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Notifications limitées en mode démo
                    </div>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="p-3 cursor-pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm font-medium truncate ${
                                notification.read ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className={`text-xs truncate ${
                              notification.read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle dark mode */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="relative"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Menu utilisateur/paramètres */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil utilisateur</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Keyboard className="mr-2 h-4 w-4" />
                  <span>Raccourcis clavier</span>
                  <kbd className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded dark:bg-gray-800">
                    Ctrl+/
                  </kbd>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Aide et support</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Barre de raccourcis clavier */}
      <div className="hidden lg:flex items-center justify-center py-1 px-4 bg-gray-50 border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          {isDemoMode ? (
            <>
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">MODE DÉMO ACTIF</span>
              </div>
              <span>Fonctionnalités limitées</span>
              <span>Documents avec filigrane</span>
              <span>QR Codes sur PDF désactivés</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-700">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-700">K</kbd>
                <span className="ml-1">Rechercher</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-700">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-700">B</kbd>
                <span className="ml-1">Toggle sidebar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-700">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-700">/</kbd>
                <span className="ml-1">Aide</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};