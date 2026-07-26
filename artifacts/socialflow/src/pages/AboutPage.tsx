import * as React from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, Target, Zap } from "lucide-react";

export function AboutPage() {
  return (
    <div className="flex-1 bg-background text-foreground py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-4xl space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight"
          >
            Our Mission: Autopilot Social Growth
          </motion.h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            We are building the future of autonomous social media orchestration. Our platforms empower brands to publish copy and creatives seamlessly using AI agent intelligence.
          </p>
        </div>

        {/* Brand values */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 bg-card border border-border/40 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Goal-Driven AI</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
              Our models don't just generate text; they optimize copies for actual target conversions, organically growing your following across multiple social ecosystems.
            </p>
          </div>

          <div className="p-6 bg-card border border-border/40 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Safe & Encrypted</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
              We value security above all else. Your API keys, account secrets, and access tokens are fully encrypted with AES-256 before ever writing to database storage.
            </p>
          </div>
        </div>

        {/* Interactive Team timeline */}
        <div className="space-y-6 pt-12">
          <h2 className="text-2xl font-bold text-center">Platform Progress & Roadmap</h2>
          <div className="space-y-4">
            {[
              { year: "2024", title: "Project Launch", desc: "Formulated the initial AI caption generator framework and built basic scheduling queues." },
              { year: "2025", title: "Social OAuth 2.0 Integration", desc: "Added secure OAuth 2.0 connections for Facebook, Instagram, LinkedIn, and YouTube channels." },
              { year: "2026", title: "Super Admin & AES-256 Security", desc: "Built the comprehensive Enterprise Super Admin settings dashboard and database level credentials encryption." }
            ].map(item => (
              <div key={item.year} className="flex gap-4 border-l-2 border-primary/20 pl-6 relative py-2">
                <span className="absolute -left-1.5 top-5 w-3 h-3 rounded-full bg-primary" />
                <div>
                  <span className="text-xs font-bold text-primary">{item.year}</span>
                  <h4 className="font-bold text-sm mt-0.5">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
