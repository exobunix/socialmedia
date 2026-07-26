import * as React from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";

export function CareersPage() {
  const jobs = [
    { title: "Senior AI Engineer (NLP/LLMs)", dept: "Engineering", loc: "Remote (Global)", type: "Full-Time" },
    { title: "Senior React Developer (Vite/Tailwind)", dept: "Frontend", loc: "Remote (APAC)", type: "Full-Time" },
    { title: "Growth Marketing Specialist", dept: "Growth", loc: "Remote (US)", type: "Full-Time" }
  ];

  return (
    <div className="flex-1 bg-background text-foreground py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-4xl space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Help Us Build Social Autopilot</h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            We are a fully remote global team engineering modern tools for marketing automation. Join us to build next-generation AI workflows.
          </p>
        </div>

        {/* Listings */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3">Open Positions</h2>
          {jobs.map((job, idx) => (
            <motion.div 
              key={job.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 bg-card border border-border/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="space-y-1">
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {job.dept}
                </span>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                <div className="flex gap-4 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.loc}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.type}</span>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
                Apply Now <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
