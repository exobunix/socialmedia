import * as React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Calendar, BarChart2, Shield, Users, Zap, Image, Video, Mail, MessageSquare
} from "lucide-react";

export function FeaturesPage() {
  return (
    <div className="flex-1 bg-background text-foreground overflow-x-hidden py-16 md:py-24">
      {/* Grid Mesh */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-[10%] w-[350px] h-[350px] rounded-full bg-primary/30 blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 space-y-24">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black tracking-tight"
          >
            Orchestrate All Your Social Channels with <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">AI Autopilot</span>
          </motion.h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed">
            From smart caption suggestions to deep cross-channel analysis, SocialFlow AI gives you the complete toolset to maximize reach.
          </p>
        </div>

        {/* 3D Dashboard Perspective Showcase */}
        <div className="flex justify-center my-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-4xl p-1 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-500/30 shadow-2xl relative"
            style={{
              perspective: "1200px",
              transformStyle: "preserve-3d"
            }}
          >
            <div 
              className="bg-card border border-border/80 rounded-xl p-6 md:p-8 space-y-6"
              style={{
                transform: "rotateX(12deg) rotateY(-5deg) translateZ(0)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            >
              {/* Fake dashboard headers */}
              <div className="flex justify-between items-center border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-xs font-semibold ml-2">Console Monitor v2.0</span>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/20 font-bold">LIVE METRICS</Badge>
              </div>

              {/* Fake dashboard metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary/30 p-4 rounded-lg border border-border/40 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Reach</span>
                  <div className="text-xl md:text-2xl font-extrabold text-primary mt-1">142.8k</div>
                  <span className="text-[9px] text-emerald-500 font-semibold">+18.5% today</span>
                </div>
                <div className="bg-secondary/30 p-4 rounded-lg border border-border/40 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">AI Generations</span>
                  <div className="text-xl md:text-2xl font-extrabold text-purple-500 mt-1">1,240</div>
                  <span className="text-[9px] text-muted-foreground font-semibold">99.8% uptime</span>
                </div>
                <div className="bg-secondary/30 p-4 rounded-lg border border-border/40 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Ad Conversion</span>
                  <div className="text-xl md:text-2xl font-extrabold text-emerald-500 mt-1">4.82%</div>
                  <span className="text-[9px] text-emerald-500 font-semibold">Goal achieved</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features list */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[
            { icon: Sparkles, color: "text-primary", title: "Autonomous Copywriting", desc: "Our advanced language models scan your keywords, analyze what's trending, and formulate ready-to-publish copywriting tailored to your target network constraints." },
            { icon: Calendar, color: "text-purple-500", title: "Visual Publishing Timeline", desc: "Plan, rearrange, and queue schedule streams. Use visual grid interfaces to drag and drop assets, modify caption drafts, and inspect publishing histories." },
            { icon: Image, color: "text-amber-500", title: "AI Image Synthesizers", desc: "Integrate Stable Diffusion and DALL-E directly. Prompt unique creatives, change aspect ratios, and export HD resolution outputs into your media libraries." },
            { icon: BarChart2, color: "text-emerald-500", title: "Comprehensive Reporting", desc: "Collect statistics across profiles. Track likes, shares, reactions, organic search visibility, and client conversions in aggregate charts." }
          ].map((f, idx) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-start gap-4 p-6 bg-card border border-border/40 rounded-2xl hover:border-primary/20 transition-all"
            >
              <div className={`p-3 bg-secondary rounded-xl ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-semibold">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple Badge mock if not imported
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </span>
  );
}
