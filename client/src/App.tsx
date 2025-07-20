import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/LoadingScreen";
import { Component, useState, useEffect } from "react";

// Error boundary to catch white screen crashes
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  console.log('🔐 Router render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'location:', location);

  // Define public routes that don't require authentication
  const publicRoutes = ['/reset-password', '/verify-email', '/auth', '/'];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(location) || location.startsWith('/reset-password') || location.startsWith('/verify-email');

  // Show loading screen only for authenticated routes when still loading
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        {/* Main content */}
        <div className="relative text-center space-y-4">
          {/* Made By DarkLayer Studios with enhanced styling */}
          <div className="relative group">
            <div className="text-2xl md:text-3xl font-bold tracking-wide">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Made By
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-black text-3xl md:text-4xl tracking-wider animate-fade-in animation-delay-500">
                DarkLayer Studios
              </span>
            </div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-xl animate-pulse group-hover:blur-2xl transition-all duration-300"></div>
            
            {/* Sparkle effects */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-ping animation-delay-500"></div>
            <div className="absolute top-1/2 -left-4 w-1 h-1 bg-pink-400 rounded-full animate-ping animation-delay-1000"></div>
          </div>

          {/* Subtitle */}
          <p className="text-slate-400 text-sm md:text-base font-medium animate-fade-in animation-delay-1000 tracking-wide">
            Crafting Digital Experiences
          </p>
        </div>
      </div>
    );
  }

  console.log('🔐 About to render content - isAuthenticated:', isAuthenticated, 'user?.isEmailVerified:', user?.isEmailVerified, 'isPublicRoute:', isPublicRoute);

  // Handle public routes without authentication check
  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/auth">
          <Auth />
        </Route>
        <Route path="/">
          {isAuthenticated && user ? (
            user.isEmailVerified ? <Home /> : <Auth />
          ) : (
            <Auth />
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For protected routes, check authentication
  if (!isAuthenticated) {
    console.log('🔐 Rendering Auth component - user not authenticated');
    return <Auth />;
  }

  // If user is authenticated but email is not verified, redirect to auth for verification
  if (isAuthenticated && user && !user.isEmailVerified) {
    console.log('🔐 Rendering Auth component - email not verified');
    return <Auth />;
  }

  // User is authenticated and verified, show main app
  console.log('🔐 Rendering main app content');
  const content = (
    <Switch>
      <Route path="/auth">
        <Home />
      </Route>
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/not-found" component={NotFound} />
      <Route path="/">
        <Home />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );

  return (
    <ChatProvider currentUser={user}>
      {content}
    </ChatProvider>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2.5 seconds
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showLoading) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ThemeProvider>
              <TooltipProvider>
                <LoadingScreen />
              </TooltipProvider>
            </ThemeProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;