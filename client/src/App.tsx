import React, { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import Dashboard from "@/pages/dashboard";
import MobileClockIn from "@/pages/mobile-clockin";
import LargeDisplay from "@/pages/large-display";
import AttendanceHistory from "@/pages/attendance-history";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, isLoading } = useAuth();

  const handleQuickClockIn = () => {
    setLocation("/mobile-clockin");
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show authenticated routes
  return (
    <Switch>
      <Route path="/">
        <div className="flex flex-col min-h-screen">
          <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Dashboard />
            </main>
          </div>
          <MobileNav onQuickClockIn={handleQuickClockIn} />
        </div>
      </Route>
      <Route path="/mobile-clockin">
        <div className="flex flex-col min-h-screen">
          <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <MobileClockIn />
            </main>
          </div>
          <MobileNav onQuickClockIn={handleQuickClockIn} />
        </div>
      </Route>
      <Route path="/large-display">
        <LargeDisplay />
      </Route>
      <Route path="/attendance">
        <div className="flex flex-col min-h-screen">
          <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <AttendanceHistory />
            </main>
          </div>
          <MobileNav onQuickClockIn={handleQuickClockIn} />
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
