import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { login, register } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";
import { GamepadIcon, Mail } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const { toast } = useToast();
  const { setUser, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await login({ username, password });
        setUser(user);
        // Refresh user state to ensure authentication is properly updated
        await refreshUser();
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Force immediate redirect to dashboard
        window.location.href = "/";
      } else {
        if (!email) {
          toast({
            title: "Email required",
            description: "Please provide an email address to register.",
            variant: "destructive",
          });
          return;
        }
        
        const user = await register({ username, password, email });
        setUser(user);
        // Refresh user state to ensure authentication is properly updated
        await refreshUser();
        toast({
          title: "Registration successful",
          description: "Please verify your email to continue.",
        });
        
        // Show email verification modal instead of redirecting
        setShowEmailVerification(true);
      }
    } catch (error) {
      toast({
        title: isLogin ? "Login failed" : "Registration failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <GamepadIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TicTac 3x5</h1>
          <p className="text-slate-400">Strategic Tic-Tac-Toe Reimagined</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isLogin 
                ? "Enter your credentials to access your account"
                : "Enter your details to create a new account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Email is required for account verification and recovery
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
              </Button>
            </form>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Email Verification Modal */}
        {showEmailVerification && (
          <EmailVerificationModal 
            email={email}
            onClose={() => {
              setShowEmailVerification(false);
              setLocation("/");
            }}
          />
        )}
      </div>
    </div>
  );
}