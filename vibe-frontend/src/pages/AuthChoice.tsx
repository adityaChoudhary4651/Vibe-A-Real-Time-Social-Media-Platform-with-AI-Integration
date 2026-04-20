import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AuthChoice() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="space-y-4">
          <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-4xl">V</span>
          </div>
          <h1 className="text-4xl font-bold gradient-text">Vibe</h1>
          <p className="text-muted-foreground text-lg">
            Connect, share, and discover amazing content
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            asChild
            className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity text-base"
          >
            <Link to="/login">Sign In</Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            className="w-full h-12 text-base"
          >
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
