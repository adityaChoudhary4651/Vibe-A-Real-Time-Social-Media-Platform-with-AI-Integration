import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import PrivateRoute from "@/routes/PrivateRoute";

import Index from "./pages/Index";
import Search from "./pages/Search";
import Reels from "./pages/Reels";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Discover from "./pages/Discover";
import Communities from "./pages/Communities";
import Create from "./pages/Create";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthChoice from "./pages/AuthChoice";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import PostDetail from "./pages/PostDetail";
import VibeAI from "./pages/VibeAI";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* ===== PUBLIC ROUTES ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth" element={<AuthChoice />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ===== PROTECTED ROUTES ===== */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Index />} />
              {/* MAIN APP LAYOUT */}
              <Route element={<MainLayout />}>
                <Route path="/search" element={<Search />} />
                <Route path="/reels" element={<Reels />} />

                {/* PROFILE */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route
                  path="/profile/:username/followers"
                  element={<Followers />}
                />
                <Route
                  path="/profile/:username/following"
                  element={<Following />}
                />

                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/create" element={<Create />} />
                <Route path="/vibe-ai" element={<VibeAI />} />
              </Route>

              {/* ✅ POST DETAIL — OUTSIDE MAIN LAYOUT */}
              <Route path="/post/:postId" element={<PostDetail />} />
            </Route>

            {/* ===== FALLBACK ===== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
