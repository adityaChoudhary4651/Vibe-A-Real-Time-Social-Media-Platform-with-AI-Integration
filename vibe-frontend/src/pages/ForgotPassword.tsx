import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success("Password reset request sent!");
      setIsSubmitted(true);
      if (data.devResetUrl) {
        // Local dev link helper
        setDevResetUrl(data.devResetUrl);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-3xl">V</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Forgot Password</h1>
          <p className="text-muted-foreground">
            We'll help you reset your password and get back on Vibe.
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-300 to-blue-500 hover:opacity-90 transition-opacity font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center bg-card border border-border p-6 rounded-2xl"
          >
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-400 animate-pulse-soft" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong className="text-foreground">{email}</strong>, we have sent instructions to reset your password.
              </p>
            </div>

            {devResetUrl && (
              <div className="mt-4 p-4 bg-secondary/50 border border-primary/30 rounded-xl text-left space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Development Mode Helper:
                </p>
                <p className="text-xs text-muted-foreground">
                  No SMTP credentials required. Click below to reset your password directly:
                </p>
                <a
                  href={devResetUrl.replace(/^https?:\/\/[^\/]+/, "")}
                  className="inline-block w-full text-center py-2 px-3 bg-primary text-primary-foreground font-semibold rounded-lg text-sm transition-colors hover:bg-primary/90"
                >
                  Go to Reset Password Page
                </a>
              </div>
            )}
          </motion.div>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
