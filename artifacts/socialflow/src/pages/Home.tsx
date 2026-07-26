import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Sparkles, Shield, Rocket, ArrowRight, BarChart2, Calendar, 
  MessageSquare, Users, Image as ImageIcon, Zap, ChevronDown, Check, Star
} from 'lucide-react';

// Reusable 3D Magnetic Cursor-tracking TiltCard
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  // Map mouse position to degree rotation in 3D space
  const rotateX = useTransform(y, [0, 300], [10, -10]);
  const rotateY = useTransform(x, [0, 400], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX);
    y.set(mouseY);
  }

  function handleMouseLeave() {
    x.set(200); // Reset position on leave
    y.set(150);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Home() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("monthly");
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
  
  // Interactive AI playground state
  const [playgroundPrompt, setPlaygroundPrompt] = React.useState("");
  const [playgroundResult, setPlaygroundResult] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const startGeneration = () => {
    if (!playgroundPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setPlaygroundResult("");
    
    const targetText = `🚀 Ready to scale your brand? Here are 3 SaaS growth hacks for 2026:\n\n1️⃣ Shift towards AI-first agent workflows 🤖\n2️⃣ Optimize user onboarding loops 📈\n3️⃣ Leverage cross-channel automatic distribution 🔗\n\n#SaaS #GrowthHacking #SocialFlowAI`;
    
    let index = 0;
    const interval = setInterval(() => {
      setPlaygroundResult(prev => prev + targetText.charAt(index));
      index++;
      if (index >= targetText.length) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 20);
  };

  const faqs = [
    { q: "How does the AI post scheduling work?", a: "Our scheduling queue uses machine learning models to analyze when your followers are most active across Facebook, Instagram, LinkedIn, and X. It then automatically publishes your queue items at those peak engagement windows." },
    { q: "Can I connect multiple client workspaces?", a: "Yes! Our Pro and Agency plans allow creating multiple separate workspaces, letting you manage social presence for different clients or projects with independent social connections, calendars, and team members." },
    { q: "Is there a limit to AI content generations?", a: "Each plan comes with a set amount of monthly AI credits. Upgrades to Pro or Agency provide higher quotas and access to premium models like GPT-4, Claude 3.5, and Stable Diffusion 3." },
    { q: "Can I cancel my subscription at any time?", a: "Absolutely! You can upgrade, downgrade, or cancel your subscription at any time directly from the Billing panel in your workspace settings with no lock-in contracts." }
  ];

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-x-hidden relative">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-primary/30 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[15%] w-[350px] h-[350px] rounded-full bg-purple-500/20 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 z-10">
        <div className="container mx-auto px-6 flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary mb-8 font-semibold tracking-wide backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            SocialFlow AI version 2.0 is officially live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl leading-[1.05] bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent"
          >
            Get Your Social Media <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">Automated in Clicks</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-3xl leading-relaxed font-medium"
          >
            The AI-first autopilot for social marketing. Design stunning visuals, compose high-converting copies, and schedule posts across all channels from one command dashboard.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <Button size="lg" className="h-13 px-10 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all" onClick={() => setLocation('/register')}>
              Start Autopilot Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-10 text-base font-semibold border-border/60 hover:bg-secondary/40">
              Watch 2-Min Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Floating Interactive Platform Preview (wrapped in 3D TiltCard) */}
      <section className="py-12 z-10 px-6 max-w-6xl mx-auto w-full">
        <p className="text-center text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">Hover cursor to tilt preview in 3D</p>
        <TiltCard className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden cursor-default">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            
            {/* Input Simulator Panel */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-xs font-semibold text-muted-foreground ml-2">AI Studio Sandbox</span>
              </div>
              <h3 className="text-xl font-extrabold flex items-center gap-1.5 mt-2">
                Type a prompt to test generation
              </h3>
              <textarea
                placeholder="e.g. Write a thread about SaaS growth hacks"
                value={playgroundPrompt}
                onChange={(e) => setPlaygroundPrompt(e.target.value)}
                className="w-full h-32 rounded-lg border border-border bg-background/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-medium"
              />
              <Button onClick={startGeneration} disabled={isGenerating || !playgroundPrompt.trim()} className="w-full h-11 font-semibold flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isGenerating ? "animate-bounce" : ""}`} />
                {isGenerating ? "Generating Content..." : "Generate Social Post"}
              </Button>
            </div>

            {/* Typewriter Output Simulator Panel */}
            <div className="flex-1 bg-background/40 border border-border/80 rounded-xl p-5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview Feed</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">LinkedIn / X</Badge>
                </div>
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-foreground min-h-[120px]">
                  {playgroundResult || "Your generated social copy will stream type here..."}
                </p>
              </div>
              {playgroundResult && (
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground font-semibold">
                  <span>Estimated Reach: ~15k impressions</span>
                  <span className="text-emerald-500">✓ Optimization: 98%</span>
                </div>
              )}
            </div>
          </div>
        </TiltCard>
      </section>

      {/* Floating Channels Banner */}
      <section className="py-8 bg-card/25 border-y border-border/40">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-widest text-muted-foreground mb-6 uppercase">Supports Multi-Channel Automatic Sync</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-14 opacity-60">
            {['Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok', 'X', 'Pinterest', 'Threads'].map(brand => (
              <span key={brand} className="text-lg font-extrabold tracking-tight hover:text-primary transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Scale Stats Counters */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Posts Automated", count: "50k+" },
              { label: "AI Creative Credits", count: "1.2M+" },
              { label: "Active Brands", count: "4,500+" },
              { label: "Network Uptime", count: "99.99%" }
            ].map(stat => (
              <div key={stat.label} className="p-6 bg-card border border-border/40 rounded-xl">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{stat.count}</div>
                <p className="text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Everything You Need to Scale</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">Bypass multiple tools. SocialFlow AI orchestrates copywriting, assets creation, distribution, and response tracking in one seamless flow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Sparkles, title: "AI Copywriter", desc: "Instantly draft contextual copies tailored to platform audiences (professional for LinkedIn, punchy for X)." },
              { icon: Calendar, title: "Automated Calendar", desc: "Queue up schedules weeks in advance and let our timezone scheduler deliver posts at peak traffic hours." },
              { icon: ImageIcon, title: "AI Image & Video Studio", desc: "Access cutting-edge models like Stable Diffusion, DALL-E, and Runway to render posts and video promos in-dashboard." },
              { icon: BarChart2, title: "Deep Analytics Insights", desc: "Unified dashboards tracing views, engagements, organic clicks, and conversions across linked channels." },
              { icon: Users, title: "Team & Approvals", desc: "Create workspaces for clients or teammates, verify copies in review draft states, and distribute workload." },
              { icon: MessageSquare, title: "Unified Social Inbox", desc: "Monitor replies, DMs, and reactions from connected profiles in a single Inbox to never miss a lead." }
            ].map((f, idx) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/40 shadow-sm transition-all hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials (People Using) Grid */}
      <section className="py-24 bg-card/25 border-y border-border/40">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Trusted by Content Teams</h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">Hear how startup founders, designers, and growth marketers scale social presence.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Jessica R.", role: "Founder, GrowthLoop", text: "SocialFlow AI saved us over 15 hours a week. The AI copywriter writes extremely professional and contextual posts for our LinkedIn company page that generated active inbound leads.", rating: 5 },
              { name: "Adarsh S.", role: "Brand Manager, AlphaLabs", text: "Connecting social profiles took less than 2 minutes. The 3D calendar scheduling queue works flawlessly, auto-publishing our graphics exactly when our users are active.", rating: 5 },
              { name: "Dev K.", role: "Solo Creator", text: "The Stable Diffusion image generation inside the panel is a game changer. I type a prompt, pick the aspect ratio, and queue the post directly in under a minute.", rating: 5 }
            ].map((t, idx) => (
              <motion.div 
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 bg-card border border-border/40 rounded-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground font-semibold italic">"{t.text}"</p>
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Toggle Section */}
      <section id="pricing" className="py-24 bg-card/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Flexible Plans, Unlimited Scale</h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">Billed monthly or yearly. Get 20% discount on yearly payments.</p>
            
            {/* Toggle switch */}
            <div className="flex items-center justify-center gap-3 mt-4">
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
                Yearly <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-1 py-0">Save 20%</Badge>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
            {[
              { name: "Free", price: 0, desc: "For individuals testing AI capabilities", features: ["1 Social Account connected", "10 Scheduled Queue Posts", "Standard AI caption helper"] },
              { name: "Starter", price: 999, desc: "For independent creators", popular: true, features: ["5 Social Accounts", "100 Scheduled Posts", "50 AI copy generations / mo", "Basic reach analytics reports"] },
              { name: "Pro", price: 2499, desc: "For small teams and startups", features: ["15 Social Accounts", "Unlimited Scheduled Posts", "AI image studio access (DALL-E)", "3 Team members workspaces"] },
              { name: "Agency", price: 5999, desc: "For large scaling marketing agencies", features: ["50 Social Accounts", "Unlimited everything", "Priority support ticket responses", "Full analytics CSV exports"] }
            ].map(plan => {
              const discountedPrice = billingCycle === "yearly" ? Math.floor(plan.price * 0.8) : plan.price;
              return (
                <div 
                  key={plan.name} 
                  className={`p-8 rounded-2xl flex flex-col justify-between relative transition-all ${
                    plan.popular 
                      ? 'bg-card border-2 border-primary shadow-xl shadow-primary/5 scale-105 z-10' 
                      : 'bg-card border border-border/50'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular Plan
                    </span>
                  )}
                  <div>
                    <h3 className="text-xl font-bold mb-1.5">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-6 min-h-[32px]">{plan.desc}</p>
                    <div className="text-4xl font-extrabold mb-6 flex items-baseline">
                      ₹{discountedPrice.toLocaleString()}
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
                    className="w-full mt-auto"
                    onClick={() => setLocation('/register')}
                  >
                    {plan.price === 0 ? "Get Started for Free" : "Start Free 7-Day Trial"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 max-w-3xl mx-auto w-full px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Frequently Asked Questions</h2>
          <p className="text-muted-foreground font-medium">Have questions about integrations or trials? We have answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-border/60 rounded-xl bg-card/45 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 font-bold text-left hover:bg-card/90 transition-colors text-sm md:text-base"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${activeFaq === idx ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-5 pt-0 text-xs md:text-sm text-muted-foreground leading-relaxed border-t border-border/40 font-medium bg-card/20">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="py-16 border-t border-border/30 bg-card/20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl text-primary">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">SF</div>
                <span>SocialFlow AI</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-semibold">
                Autonomous AI mission control for multi-channel social media automation. Create copies, synthesize visuals, and scheduling analytics inside one command panel.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">Features</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-semibold">
                <li><Link href="/features" className="hover:text-primary transition-colors">AI Generator</Link></li>
                <li><Link href="/features" className="hover:text-primary transition-colors">Timezone Scheduler</Link></li>
                <li><Link href="/features" className="hover:text-primary transition-colors">Multi-Channel Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-semibold">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground font-semibold gap-4">
            <p>© {new Date().getFullYear()} SocialFlow AI Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
