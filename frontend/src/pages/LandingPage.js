import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, ArrowRight, CheckCircle2, Users, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleStartAssessment = () => {
    if (!name.trim()) {
      setError('Please enter your name to continue');
      return;
    }
    // Navigate to assessment with name
    navigate(`/assessment?name=${encodeURIComponent(name.trim())}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStartAssessment();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-lime-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-lime-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/30">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PO Journey</h1>
              <p className="text-slate-400 text-sm">Questionnaire Tool</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Measure & Grow Your<br />
              <span className="text-lime-400">Product Owner Skills</span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              A quick questionnaire to help you identify strengths and journey opportunities across key PO competencies.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              <span>20 questions across 8 key dimensions</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              <span>Takes about 10-15 minutes to complete</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              <span>Get personalized coaching recommendations</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-white">8</div>
              <div className="text-slate-400 text-sm">Dimensions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">20</div>
              <div className="text-slate-400 text-sm">Questions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">5</div>
              <div className="text-slate-400 text-sm">Journey Levels</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2025 PO Journey Questionnaire Tool
        </div>
      </div>

      {/* Right Panel - Start Assessment */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">PO Journey</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Start Your Questionnaire
            </h2>
            <p className="text-slate-600">
              Enter your name below to begin the questionnaire
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                className="h-12 text-lg"
                data-testid="name-input"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <Button
              onClick={handleStartAssessment}
              className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white text-lg font-medium"
              data-testid="start-assessment-btn"
            >
              Start Questionnaire
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <Users className="w-6 h-6 text-lime-600 mb-2" />
              <div className="text-sm font-medium text-slate-900">Self Questionnaire</div>
              <div className="text-xs text-slate-500">Rate yourself honestly</div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <BarChart3 className="w-6 h-6 text-lime-600 mb-2" />
              <div className="text-sm font-medium text-slate-900">Get Insights</div>
              <div className="text-xs text-slate-500">See your journey areas</div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500">
            Your responses will be saved to help track journey progress over time
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
