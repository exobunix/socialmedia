import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

export function PricingPage() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("monthly");

  const plans = [
    { name: "Free", price: 0, desc: "For individuals testing AI capabilities", features: ["1 Social Account connected", "10 Scheduled Queue Posts", "Standard AI caption helper", "Basic performance logs"] },
    { name: "Starter", price: 999, desc: "For independent creators starting out", popular: true, features: ["5 Social Accounts", "100 Scheduled Posts", "50 AI copy generations / mo", "Basic reach analytics reports", "Standard email support"] },
    { name: "Pro", price: 2499, desc: "For small teams and growing brands", features: ["15 Social Accounts", "Unlimited Scheduled Posts", "AI image studio access (DALL-E)", "3 Team members workspaces", "Priority support tickets", "Deep analytics dashboards"] },
    { name: "Agency", price: 5999, desc: "For large scaling marketing agencies", features: ["50 Social Accounts", "Unlimited everything", "Priority support ticket responses", "Full analytics CSV exports", "White label reporting exports", "Dedicated support manager"] }
  ];

  return (
    <div className="flex-1 bg-background text-foreground py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-6xl space-y-16">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Simple Pricing, Infinite Power</h1>
          <p className="text-muted-foreground text-lg font-medium">Billed monthly or yearly. Get 20% discount on yearly cycles.</p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-primary" : "text-muted-foreground"}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
              className="w-12 h-6 rounded-full bg-secondary border border-border p-1 relative flex items-center"
            >
              <motion.div 
                layout
                className="w-4 h-4 rounded-full bg-primary"
                animate={{ x: billingCycle === "monthly" ? 0 : 22 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-primary" : "text-muted-foreground"}`}>
              Yearly <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-4 gap-6 items-stretch">
          {plans.map(plan => {
            const price = billingCycle === "yearly" ? Math.floor(plan.price * 0.8) : plan.price;
            return (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-2xl flex flex-col justify-between relative transition-all ${
                  plan.popular 
                    ? 'bg-card border-2 border-primary shadow-xl shadow-primary/5 scale-105 z-10' 
                    : 'bg-card border border-border/50'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider left-1/2 -translate-x-1/2">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold mb-1.5">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-6 min-h-[32px]">{plan.desc}</p>
                  <div className="text-4xl font-extrabold mb-6 flex items-baseline">
                    ₹{price.toLocaleString()}
                    <span className="text-sm font-medium text-muted-foreground ml-1">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start text-xs text-muted-foreground font-semibold leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-primary mr-2 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full mt-auto font-bold"
                  onClick={() => setLocation('/register')}
                >
                  {plan.price === 0 ? "Get Started" : "Start Free Trial"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
