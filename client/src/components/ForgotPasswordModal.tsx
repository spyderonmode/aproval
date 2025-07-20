import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, AlertTriangle, Mail } from "lucide-react";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Reset Code Sent",
          description: data.message,
        });
      } else {
        // Show more detailed error information if available
        const errorMessage = data.details 
          ? `${data.error}\n\nDetails: ${data.details}`
          : data.error || "Failed to send reset email.";
        
        toast({
          title: "Email Service Issue",
          description: errorMessage,
          variant: "destructive",
        });
        setShowTroubleshooting(true);
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to send reset email. Please check your internet connection.",
        variant: "destructive",
      });
      setShowTroubleshooting(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Email Test Failed",
          description: data.recommendation || "Failed to send test email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not test email delivery.",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <KeyRound className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-white text-xl">
            {isSuccess ? "Reset Email Sent" : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {isSuccess 
              ? "Check your email for your password reset code"
              : "Enter your email address to receive a password reset code"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuccess ? (
            <>
              <Alert className="bg-green-900 border-green-700">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  If an account with this email exists, a password reset code has been sent.
                </AlertDescription>
              </Alert>
              
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 space-y-3">
                <h4 className="text-blue-300 font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Delivery Tips
                </h4>
                <div className="text-sm text-blue-200 space-y-2">
                  <div>• Check your <strong>spam/junk folder</strong> first</div>
                  <div>• Look for emails from <strong>admin@darkester.online</strong></div>
                  <div>• Wait up to 5 minutes for delivery</div>
                  <div>• Add our sender to your contacts to improve delivery</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    onClose();
                    setLocation('/reset-password');
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Enter Reset Code
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Back to Login
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-300">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </Button>
                
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
              
              {showTroubleshooting && (
                <Alert className="bg-amber-900 border-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-200">
                    <div className="space-y-2">
                      <div className="font-medium">Email delivery issue detected</div>
                      <div className="text-sm space-y-1">
                        <div>• Email service might be temporarily unavailable</div>
                        <div>• Check if your email address is correct</div>
                        <div>• Try using a different email provider (Gmail, Yahoo, etc.)</div>
                        <div>• Contact support if the problem persists</div>
                      </div>
                      <Button
                        onClick={handleTestEmail}
                        disabled={isTestingEmail}
                        variant="outline" 
                        size="sm"
                        className="mt-2 bg-amber-800 border-amber-600 text-amber-100 hover:bg-amber-700"
                      >
                        {isTestingEmail ? 'Testing...' : 'Test Email Delivery'}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </form>
          )}
          
          <div className="text-xs text-slate-500 text-center">
            Remember your password? Return to login to sign in.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}