import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";

export function BlogPage() {
  const posts = [
    {
      title: "10 AI Prompts to Double Your LinkedIn Engagement",
      desc: "Discover how to instruct LLMs to write compelling B2B posts, select hook sentences, and format text for the LinkedIn feed algorithm.",
      category: "Copywriting",
      readTime: "5 min read",
      date: "Jul 24, 2026"
    },
    {
      title: "How to Build a Multi-Channel Social Pipeline on Autopilot",
      desc: "Juggling X, Facebook, and Instagram can be exhausting. Here is a step-by-step blueprint to automate scheduling and responses safely.",
      category: "Automation",
      readTime: "8 min read",
      date: "Jul 20, 2026"
    },
    {
      title: "Understanding the X (Twitter) Algorithm Changes in 2026",
      desc: "X has modified how external links and image weights are calculated. Read our deep-dive analysis to keep your impressions high.",
      category: "Social Trends",
      readTime: "6 min read",
      date: "Jul 18, 2026"
    }
  ];

  return (
    <div className="flex-1 bg-background text-foreground py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-5xl space-y-16">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight flex items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            SocialFlow Blog
          </h1>
          <p className="text-muted-foreground text-sm font-semibold">
            Guides, blueprints, and insights on AI marketing and social automation.
          </p>
        </div>

        {/* Featured Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-lg hover:border-primary/20 transition-all"
        >
          <div className="flex-1 space-y-4">
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Featured Article
            </span>
            <h2 className="text-2xl md:text-3xl font-bold">Scaling Organic Growth: The Rise of AI Marketing Agents</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
              The marketing landscape is shifting from pure scheduling tools to autonomous AI agents that analyze performance, optimize copy, and automatically engage with followers.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold">
              <span>Jul 26, 2026</span>
              <span>•</span>
              <span>12 min read</span>
            </div>
          </div>
          <Button variant="outline" className="flex items-center gap-1.5 self-start md:self-auto font-bold">
            Read Article <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Grid List */}
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <motion.div 
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/40 flex flex-col justify-between hover:border-primary/25 hover:-translate-y-1 transition-all"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-primary" /> {post.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold line-clamp-2">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold line-clamp-3">{post.desc}</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mt-6">
                Read Post <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Button mock if needed
function Button({ children, className, variant, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors border border-border hover:bg-secondary/40 px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
}
