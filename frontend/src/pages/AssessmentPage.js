import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const rubricLabels = {
  1: { label: 'Not yet', description: 'This isn\'t something I do consistently' },
  2: { label: 'Sometimes', description: 'I\'m working on this but it\'s not consistent' },
  3: { label: 'Usually', description: 'I do this regularly with some room to grow' },
  4: { label: 'Often', description: 'This is a strength — I do it well most of the time' },
  5: { label: 'Always', description: 'I\'m a role model in this area' }
};

const AssessmentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const participantName = searchParams.get('name') || '';
  
  const [dimensions, setDimensions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  // Redirect if no name provided
  useEffect(() => {
    if (!participantName) {
      navigate('/');
    }
  }, [participantName, navigate]);

  // Fetch dimensions and questions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/assessment/questions`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        setDimensions(data.dimensions || []);
        
        // Initialize responses
        const initialResponses = {};
        data.dimensions?.forEach(dim => {
          dim.questions?.forEach(q => {
            initialResponses[q.id] = { score: null, comment: '' };
          });
        });
        setResponses(initialResponses);
      } catch (err) {
        console.error('Error fetching questions:', err);
        toast.error('Failed to load assessment questions');
      } finally {
        setLoading(false);
      }
    };
    
    if (participantName) {
      fetchData();
    }
  }, [participantName]);

  const totalQuestions = dimensions.reduce((sum, d) => sum + (d.questions?.length || 0), 0);
  const answeredQuestions = Object.values(responses).filter(r => r.score !== null && r.score !== undefined).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleScoreChange = (questionId, score) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        score: prev[questionId]?.score === score ? null : score
      }
    }));
  };

  const handleCommentChange = (questionId, comment) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        comment
      }
    }));
  };

  const handleSubmit = async () => {
    if (answeredQuestions < totalQuestions) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_name: participantName,
          responses: Object.entries(responses).map(([questionId, data]) => ({
            question_id: questionId,
            score: data.score,
            comment: data.comment || ''
          }))
        })
      });

      if (!res.ok) throw new Error('Failed to submit assessment');
      
      const data = await res.json();
      setResults(data);
      setIsSubmitted(true);
      toast.success('Questionnaire submitted successfully!');
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const getJourneyLevel = (score) => {
    if (score >= 85) return { level: 'Elite', color: 'bg-lime-600 text-white' };
    if (score >= 65) return { level: 'Leading', color: 'bg-emerald-100 text-emerald-700' };
    if (score >= 45) return { level: 'Performing', color: 'bg-lime-100 text-lime-700' };
    if (score >= 25) return { level: 'Developing', color: 'bg-amber-100 text-amber-700' };
    return { level: 'Foundational', color: 'bg-slate-100 text-slate-700' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Show results after submission
  if (isSubmitted && results) {
    const journeyInfo = getJourneyLevel(results.overall_score);
    
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">PO Journey Questionnaire</h1>
              <p className="text-sm text-slate-500">Results for {participantName}</p>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Overall Score */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Journey Score</h2>
            <div className="text-6xl font-bold text-lime-600 mb-4">
              {results.overall_score?.toFixed(1)}
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-medium ${journeyInfo.color}`}>
              <TrendingUp className="w-5 h-5" />
              {journeyInfo.level}
            </span>
          </div>

          {/* Dimension Scores */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Score by Dimension</h3>
            <div className="space-y-4">
              {results.dimension_scores?.map((ds, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium text-slate-700">{ds.dimension}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-lime-500 rounded-full transition-all duration-500"
                      style={{ width: `${ds.score}%` }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono text-sm text-slate-600">
                    {ds.score?.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Journey Recommendations</h3>
              <div className="space-y-4">
                {results.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-lime-50 border border-lime-200 rounded-lg">
                    <div className="font-medium text-slate-900 mb-1">{rec.dimension}</div>
                    <p className="text-sm text-slate-600">{rec.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="px-6"
            >
              Take Another Questionnaire
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Self Questionnaire</h1>
              <p className="text-sm text-slate-500">{participantName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-lime-600">{Math.round(progress)}%</div>
            <div className="text-sm text-slate-500">{answeredQuestions}/{totalQuestions} answered</div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Assessment Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* All Dimensions */}
        {dimensions.map((dim, dimIndex) => {
          const dimQuestions = dim.questions || [];
          const dimAnswered = dimQuestions.filter(q => responses[q.id]?.score != null).length;
          const isComplete = dimAnswered === dimQuestions.length;

          return (
            <div key={dim.id} className="space-y-4" id={`dimension-${dimIndex}`}>
              {/* Dimension Header */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl border-l-4 border-l-lime-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center text-lg font-bold text-lime-700">
                      {dimIndex + 1}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{dim.name}</h2>
                      <p className="text-slate-500 text-sm">{dim.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && (
                      <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Done
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 ml-5">
                {dimQuestions.map((question, qIndex) => (
                  <div key={question.id} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                        {qIndex + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium leading-relaxed">
                          {question.text_self}
                        </p>
                        {question.help_text && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                type="button"
                                className="mt-2 flex items-center gap-1.5 text-sm text-lime-600 hover:text-lime-700 transition-colors"
                              >
                                <HelpCircle className="w-4 h-4" />
                                <span>What does this mean?</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent 
                              side="bottom" 
                              align="start"
                              className="w-80 bg-slate-900 text-white p-4 rounded-xl shadow-xl border-0"
                            >
                              <p className="text-sm leading-relaxed">{question.help_text}</p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>

                    {/* Rubric Selector */}
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(question.id, score)}
                          className={`rubric-option ${
                            responses[question.id]?.score === score ? 'selected' : ''
                          }`}
                          data-testid={`rubric-${question.id}-${score}`}
                        >
                          <div className="score-badge">{score}</div>
                          <div className="text-xs font-medium text-slate-700">
                            {rubricLabels[score].label}
                          </div>
                          <div className="text-xs text-slate-500 text-center mt-1 hidden md:block">
                            {rubricLabels[score].description}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Comment Box */}
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">
                        Evidence / Example (optional)
                      </label>
                      <Textarea
                        value={responses[question.id]?.comment || ''}
                        onChange={(e) => handleCommentChange(question.id, e.target.value)}
                        placeholder="Add context or examples to support your rating..."
                        className="resize-none"
                        rows={2}
                        data-testid={`comment-${question.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting || answeredQuestions < totalQuestions}
            className="bg-lime-600 hover:bg-lime-700 text-white"
            data-testid="submit-assessment-btn"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Questionnaire'}
          </Button>
        </div>

        {/* Unanswered Warning */}
        {answeredQuestions < totalQuestions && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              {totalQuestions - answeredQuestions} question(s) remaining. Complete all questions before submitting.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssessmentPage;
