import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { 
  ClipboardCheck, 
  BarChart3, 
  Users, 
  ArrowRight, 
  Shield, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const steps = [
    {
      icon: Users,
      title: "Invite",
      description: "Assign assessors to each Product Owner - managers, partners, and self",
      color: "bg-lime-100 text-lime-700"
    },
    {
      icon: ClipboardCheck,
      title: "Assess",
      description: "Complete structured assessments across 8 key competency dimensions",
      color: "bg-emerald-100 text-emerald-700"
    },
    {
      icon: BarChart3,
      title: "Executive Insights",
      description: "View scorecards, heatmaps, and alignment analysis across your organization",
      color: "bg-sky-100 text-sky-700"
    }
  ];

  const trustItems = [
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Lock, text: "Anonymous by default" },
    { icon: CheckCircle2, text: "GDPR compliant" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-lime-50/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-xl text-slate-900">APO Assessment</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-lime-600 hover:bg-lime-700 text-white"
                data-testid="go-to-dashboard-btn"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-slate-600 hover:text-slate-900"
                  data-testid="login-nav-btn"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-lime-600 hover:bg-lime-700 text-white"
                  data-testid="get-started-btn"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 text-lime-700 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Product Owner Maturity Assessment
              </div>
              
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
                Measure & Elevate Your{' '}
                <span className="text-lime-600">Product Owner</span>{' '}
                Capabilities
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                A consulting-grade assessment platform that provides 360° visibility into 
                PO maturity through self, partner, and manager evaluations with executive-ready insights.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="bg-lime-600 hover:bg-lime-700 text-white px-8 py-6 text-lg"
                  data-testid="hero-cta-btn"
                >
                  Start Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-6 text-lg border-slate-300"
                  data-testid="learn-more-btn"
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-fade-in delay-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-lime-400/20 to-emerald-400/20 rounded-3xl blur-3xl" />
              <div className="relative glass-panel p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-6 space-y-3">
                    <div className="text-sm text-slate-500">Org Average</div>
                    <div className="text-4xl font-heading font-bold text-lime-600">72.4</div>
                    <div className="text-xs text-slate-400">Performing Band</div>
                  </div>
                  <div className="glass-card p-6 space-y-3">
                    <div className="text-sm text-slate-500">Alignment Index</div>
                    <div className="text-4xl font-heading font-bold text-emerald-600">85%</div>
                    <div className="text-xs text-slate-400">Self vs Partner</div>
                  </div>
                  <div className="glass-card p-6 col-span-2 space-y-3">
                    <div className="text-sm text-slate-500">Completion Rate</div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-lime-500 h-3 rounded-full" style={{ width: '87%' }} />
                    </div>
                    <div className="text-right text-sm text-slate-600 font-medium">87% Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A streamlined 3-step process to gain actionable insights into your PO organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="relative glass-card p-8 hover:shadow-lg transition-shadow duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-heading font-bold">
                  {index + 1}
                </div>
                <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center mb-6`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring Model */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900">
                Consulting-Grade Scoring Model
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Our weighted maturity index evaluates POs across 8 dimensions with a 1-5 rubric scale, 
                computing normalized scores and alignment metrics.
              </p>
              
              <div className="space-y-4">
                {[
                  { label: 'Strategy & Outcomes', weight: 15, score: 74 },
                  { label: 'Customer & Discovery', weight: 12, score: 68 },
                  { label: 'Backlog & Prioritization', weight: 15, score: 82 },
                  { label: 'Delivery Partnership', weight: 12, score: 71 }
                ].map((dim) => (
                  <div key={dim.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 font-medium">{dim.label}</span>
                      <span className="text-slate-500">Weight: {dim.weight}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-lime-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${dim.score}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8 animate-fade-in delay-200">
              <h3 className="font-heading text-lg font-semibold text-slate-900 mb-6">
                Maturity Bands
              </h3>
              <div className="space-y-3">
                {[
                  { band: 'Elite', range: '85-100', color: 'bg-lime-600 text-white' },
                  { band: 'Leading', range: '65-84', color: 'bg-emerald-100 text-emerald-700' },
                  { band: 'Performing', range: '45-64', color: 'bg-lime-100 text-lime-700' },
                  { band: 'Developing', range: '25-44', color: 'bg-amber-100 text-amber-700' },
                  { band: 'Foundational', range: '0-24', color: 'bg-slate-100 text-slate-700' }
                ].map((item) => (
                  <div key={item.band} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.color}`}>
                      {item.band}
                    </span>
                    <span className="text-slate-600 font-mono text-sm">{item.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 px-6 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8">
            {trustItems.map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-slate-600">
                <item.icon className="w-5 h-5 text-lime-600" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
            Ready to assess your PO organization?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Get started with our demo environment and see how the APO Assessment Tool 
            can transform your product organization.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold px-10 py-6 text-lg"
            data-testid="cta-btn"
          >
            Start Free Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lime-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-medium text-white">APO Assessment</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2025 APO Assessment Tool. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
