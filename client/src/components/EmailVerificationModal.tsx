import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendEmailVerification } from "@/lib/firebase";
import { Mail, CheckCircle } from "lucide-react";

interface EmailVerificationModalProps {
  email: string;
  onClose: () => void;
}

export function EmailVerificationModal({ email, onClose }: EmailVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSendVerification = async () => {
    setIsLoading(true);
    try {
      await sendEmailVerification(email);
      setIsSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link",
      });
    } catch (error) {
      toast({
        title: "Failed to send verification email",
        description: "Please try again later or contact support",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl text-white">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSent ? (
            <>
              <p className="text-slate-300 text-center">
                Would you like to verify your email address to secure your account?
              </p>
              <div className="bg-slate-700 p-3 rounded-lg">
                <Label className="text-slate-300 text-sm">Email Address</Label>
                <p className="text-white font-medium">{email}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSendVerification}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Sending..." : "Send Verification"}
                </Button>
              </div>
              <p className="text-sm text-slate-400 text-center mt-2">
                Email verification is required to access the dashboard
              </p>
            </>
          ) : (
            <>
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">
                  Verification email sent! Check your inbox and click the link to verify your account.
                </p>
                <Button
                  onClick={onClose}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continue to Game
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}