import { motion } from "framer-motion";
import { Quote, Star, MessageSquare, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { metrics } from "@/config/metrics";

// Placeholder for future real testimonials
// When real testimonials are collected, replace this array
const SHOW_PLACEHOLDER_TESTIMONIALS = metrics.testimonials.showPlaceholders; // Set to false when real testimonials are available
const testimonials: Array<{
  name: string;
  title: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
  verified: boolean;
  isPlaceholder?: boolean;
}> = SHOW_PLACEHOLDER_TESTIMONIALS ? [
  {
    name: "Alex Chen",
    title: "Senior HVAC Engineer",
    company: "Global Mechanical Solutions",
    content: "ThermoNeural cut our calculation time by 85%. The accuracy is spot‑on compared to manual methods. Our team now delivers client reports in minutes instead of hours.",
    rating: 5,
    avatar: "AC",
    verified: true,
    isPlaceholder: true,
  },
  {
    name: "Maria Rodriguez",
    title: "Refrigeration Systems Lead",
    company: "Sustainable Cooling Technologies",
    content: "The AI‑powered optimization suggestions have improved our system COP by 12%. The platform is intuitive and the support team is incredibly responsive.",
    rating: 5,
    avatar: "MR",
    verified: true,
    isPlaceholder: true,
  },
  {
    name: "James K. Wilson",
    title: "Principal Engineer",
    company: "ASHRAE Member",
    content: "As an educator, I recommend ThermoNeural to my students. It bridges the gap between theoretical thermodynamics and real‑world engineering practice.",
    rating: 5,
    avatar: "JW",
    verified: false,
    isPlaceholder: true,
  },
  {
    name: "Sarah Johnson",
    title: "Mechanical Engineering Director",
    company: "EcoCool Innovations",
    content: "We've standardized on ThermoNeural across our engineering team. The collaborative features and report automation have reduced project turnaround by 40%.",
    rating: 5,
    avatar: "SJ",
    verified: true,
    isPlaceholder: true,
  },
  {
    name: "David Park",
    title: "HVAC Design Specialist",
    company: "Urban Climate Solutions",
    content: "The refrigerant comparison tool helped us select optimal low-GWP alternatives for a major retrofit, saving $15k in annual operating costs.",
    rating: 5,
    avatar: "DP",
    verified: false,
    isPlaceholder: true,
  },
  {
    name: "Lisa Thompson",
    title: "Energy Efficiency Consultant",
    company: "Green Building Advisors",
    content: "ThermoNeural's professional reports give our clients confidence in our recommendations. The branded templates have elevated our firm's presentation standards.",
    rating: 5,
    avatar: "LT",
    verified: true,
    isPlaceholder: true,
  },
] : [];

export function TestimonialsSection() {
  const hasTestimonials = testimonials.length > 0;

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-background -z-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight/5 rounded-full blur-[120px] -z-20" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight font-mono">
            Trusted by Engineers
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
              {" "}Worldwide
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Join engineers who are transforming their workflow with ThermoNeural.
          </p>
        </motion.div>

        {hasTestimonials ? (
          <>
            {/* Disclaimer for placeholder testimonials */}
            {SHOW_PLACEHOLDER_TESTIMONIALS && (
              <div className="mb-8 p-4 bg-warning/10 border border-warning/30 rounded-lg text-center">
                <p className="text-sm text-warning font-medium">
                  {metrics.testimonials.placeholderDisclaimer}
                </p>
              </div>
            )}
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="relative"
                >
                  <div className="absolute -top-4 -left-2 opacity-20">
                    <Quote className="h-16 w-16 text-primary" />
                  </div>
                  <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6 italic">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                      {testimonial.name}
                      {testimonial.verified && !testimonial.isPlaceholder && (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/30">
                          Verified
                        </span>
                      )}
                      {testimonial.isPlaceholder && (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full border border-warning/30 font-medium">
                          Example
                        </span>
                      )}
                    </div>
                        <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                        <div className="text-xs text-primary">{testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Call to Action for User Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl mx-auto mt-16"
            >
              <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Share Your ThermoNeural Experience
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Join our community of HVAC&R professionals. Your feedback helps others discover 
                  the power of accurate thermodynamic analysis and drives our platform improvements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Your Review
                  </Button>
                  <Button variant="outline">
                    <Gift className="h-4 w-4 mr-2" />
                    Get {metrics.testimonials.reviewCredit.amount} Credit for Verified Review
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-6">
                  *{metrics.urgency.limitedTimeOffer}. {metrics.testimonials.reviewCredit.amount} {metrics.testimonials.reviewCredit.description} applied after verification.
                </p>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Be the First to Share Your Experience
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We&apos;re building a community of HVAC&R professionals who trust ThermoNeural 
                for their critical calculations. Share your experience and help others 
                discover the power of accurate thermodynamic analysis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Share Your Feedback
                </Button>
                <Button variant="outline">
                  <Gift className="h-4 w-4 mr-2" />
                  Get {metrics.testimonials.reviewCredit.amount} Credit for Review
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                *{metrics.urgency.limitedTimeOffer}. {metrics.testimonials.reviewCredit.amount} {metrics.testimonials.reviewCredit.description} applied after verification.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
