import * as React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex-1 bg-background text-foreground py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-5xl space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Get in Touch</h1>
          <p className="text-muted-foreground text-sm font-semibold">
            Have questions about pricing, API access, custom integrations, or custom enterprise terms? Reach out to us.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-stretch max-w-4xl mx-auto">
          {/* Details */}
          <div className="flex-1 space-y-8 bg-secondary/20 p-6 md:p-8 rounded-2xl border border-border/40">
            <h2 className="text-xl font-bold">Contact Details</h2>
            
            <div className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-foreground">Email Support</div>
                  <div>support@socialflow.ai</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-foreground">Sales Hotline</div>
                  +1 (555) 019-2834
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-foreground">HQ Office</div>
                  100 Pine Street, San Francisco, CA
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex-[1.5] bg-card p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold">Message Sent Successfully!</h3>
                <p className="text-xs text-muted-foreground font-semibold">Our sales team will get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</label>
                  <input required className="w-full h-11 rounded-lg border border-border bg-background px-3 py-2 text-xs" placeholder="Adarsh deep" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Email Address</label>
                  <input required type="email" className="w-full h-11 rounded-lg border border-border bg-background px-3 py-2 text-xs" placeholder="adarsh@gmail.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Message</label>
                  <textarea required className="w-full h-32 rounded-lg border border-border bg-background px-3 py-2 text-xs resize-none" placeholder="Write your message here..." />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
