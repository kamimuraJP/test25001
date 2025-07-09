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
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { useLocation } from "wouter";

function Router() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleQuickClockIn = () => {
    setLocation("/mobile-clockin");
  };

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
