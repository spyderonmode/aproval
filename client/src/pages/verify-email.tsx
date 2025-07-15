import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          const data = await response.json();
          setVerificationStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          toast({
            title: "Email Verified",
            description: "Your email has been verified successfully. You can now log in.",
          });
        } else {
          const errorData = await response.json();
          setVerificationStatus('error');
          setMessage(errorData.error || 'Failed to verify email');
        }
      } catch (error) {
        setVerificationStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, [toast]);

  const handleLoginRedirect = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full w-fit">
            {verificationStatus === 'loading' && (
              <div className="bg-blue-100 p-3 rounded-full">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}
            {verificationStatus === 'success' && (
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}
            {verificationStatus === 'error' && (
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-white text-xl">
            {verificationStatus === 'loading' && 'Verifying Email...'}
            {verificationStatus === 'success' && 'Email Verified!'}
            {verificationStatus === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {verificationStatus === 'loading' && 'Please wait while we verify your email address'}
            {verificationStatus === 'success' && 'Your account has been successfully verified'}
            {verificationStatus === 'error' && 'There was an issue verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={`${
            verificationStatus === 'success' ? 'bg-green-900 border-green-700' : 
            verificationStatus === 'error' ? 'bg-red-900 border-red-700' : 
            'bg-slate-700 border-slate-600'
          }`}>
            <AlertDescription className={`${
              verificationStatus === 'success' ? 'text-green-300' : 
              verificationStatus === 'error' ? 'text-red-300' : 
              'text-slate-300'
            }`}>
              {message}
            </AlertDescription>
          </Alert>
          
          {verificationStatus !== 'loading' && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {verificationStatus === 'success' ? 'Continue to Login' : 'Back to Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}