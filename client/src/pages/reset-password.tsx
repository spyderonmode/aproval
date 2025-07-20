import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, XCircle } from "lucide-react";
import { parseErrorMessage } from "@/lib/errorUtils";
import { t } from "@/lib/i18n";

export default function ResetPassword() {
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!resetCode.trim()) {
      setError(t('pleaseEnterResetCode'));
      setIsLoading(false);
      return;
    }

    if (resetCode.length !== 6 || !/^\d+$/.test(resetCode)) {
      setError(t('resetCodeMustBe6Digits'));
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinLength'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetCode, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: t('passwordReset'),
          description: t('passwordResetSuccessfully'),
        });
      } else {
        setError(parseErrorMessage(data.error || t('failedToResetPassword')));
        toast({
          title: t('error'),
          description: parseErrorMessage(data.error || t('failedToResetPassword')),
          variant: "destructive",
        });
      }
    } catch (error) {
      setError(t('failedToResetTryAgain'));
      toast({
        title: t('error'),
        description: t('failedToResetTryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full w-fit">
            {isSuccess ? (
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : error ? (
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            ) : (
              <div className="bg-blue-100 p-3 rounded-full">
                <KeyRound className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-white text-xl">
            {isSuccess ? t('passwordResetComplete') : error ? t('resetFailed') : t('resetPassword')}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {isSuccess 
              ? t('passwordResetSuccessfully')
              : error 
                ? t('issueResettingPassword')
                : t('enterResetCodeAndPassword')
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-900 border-red-700">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {isSuccess ? (
            <>
              <Alert className="bg-green-900 border-green-700">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Your password has been reset successfully. You can now log in with your new password.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Continue to Login
              </Button>
            </>
          ) : !error ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetCode" className="text-slate-300">Reset Code</Label>
                <Input
                  id="resetCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-slate-700 border-slate-600 text-white text-center text-2xl font-mono letter-spacing-wide"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}