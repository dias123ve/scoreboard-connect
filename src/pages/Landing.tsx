import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Users, ArrowRight, BookOpen, CheckCircle } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ScoreTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              <BarChart3 className="h-4 w-4" />
              Simple Score Management
            </span>
          </div>
          
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Track Student Scores
            <span className="block text-primary">Effortlessly</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Teachers upload scores via Excel, students view their progress with beautiful histograms. 
            No complexity, just results.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Upload className="h-6 w-6" />}
            title="Excel Upload"
            description="Teachers upload student scores using a simple Excel template. No manual data entry."
            delay="0.4s"
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Teacher Codes"
            description="Students connect to teachers using unique codes. Simple and secure connection."
            delay="0.5s"
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Score Histograms"
            description="Students view their score progression over time with beautiful visual charts."
            delay="0.6s"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-foreground">How It Works</h2>
          
          <div className="mt-12 space-y-8">
            <Step number={1} title="Teachers Register" description="Sign up as a teacher and get a unique teacher code for your subject." />
            <Step number={2} title="Students Connect" description="Students enter the teacher code to connect and receive scores." />
            <Step number={3} title="Upload Scores" description="Teachers upload scores via Excel. Scores are automatically distributed." />
            <Step number={4} title="View Progress" description="Students see their scores displayed as histograms for each subject." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl gradient-primary p-8 text-center shadow-card md:p-12">
          <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
            Ready to simplify score tracking?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join teachers and students who are already using ScoreTrack.
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="lg" className="mt-8 bg-card text-primary hover:bg-card/90">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ScoreTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ScoreTrack. Simple score management for education.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: string;
}) => (
  <div 
    className="rounded-2xl bg-card p-8 shadow-card transition-all duration-300 hover:scale-[1.02] animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      {icon}
    </div>
    <h3 className="mt-6 text-xl font-semibold text-card-foreground">{title}</h3>
    <p className="mt-3 text-muted-foreground">{description}</p>
  </div>
);

const Step = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
      {number}
    </div>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Landing;
