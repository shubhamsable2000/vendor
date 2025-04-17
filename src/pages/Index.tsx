
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  FileText, 
  Clock, 
  BarChart2, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center py-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold">VF</span>
            </div>
            <span className="text-xl font-bold">Vendor Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </Link>
            <Link to="/create-rfx">
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            AI-Powered Procurement<br />Made <span className="text-primary">Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Automate your vendor outreach, negotiate effectively, and generate intelligent comparison reports — all in one elegant platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/create-rfx">
              <Button size="lg" className="gap-2">
                Create Your First RFx
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                View Dashboard
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create RFx</h3>
              <p className="text-muted-foreground">
                Describe what you want to buy and upload specifications in a simple guided flow.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Emails</h3>
              <p className="text-muted-foreground">
                Our AI generates personalized vendor emails that you can review and approve.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Negotiation</h3>
              <p className="text-muted-foreground">
                Let AI help negotiate better terms with intelligent suggested responses.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compare Offers</h3>
              <p className="text-muted-foreground">
                Automatically generate comparison tables to find the best vendor offering.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="bg-primary/10 rounded-2xl p-10 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to streamline your procurement?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Stop sending RFx emails manually and start leveraging AI to make your procurement process faster, smarter, and more efficient.
            </p>
            <Link to="/create-rfx">
              <Button size="lg" className="gap-2">
                Start Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">VF</span>
              </div>
              <span className="text-sm font-medium">Vendor Flow</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Help
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
