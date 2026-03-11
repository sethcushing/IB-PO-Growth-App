import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dimensionsAPI, responsesAPI, cyclesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Eye,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const rubricLabels = {
  1: { label: 'Not yet', description: 'This isn\'t something I do consistently' },
  2: { label: 'Sometimes', description: 'I\'m working on this but it\'s not consistent' },
  3: { label: 'Usually', description: 'I do this regularly with some room to grow' },
  4: { label: 'Often', description: 'This is a strength — I do it well most of the time' },
  5: { label: 'Always', description: 'I\'m a role model in this area' }
};

const AssessmentPage = () => {
  const { cycleId, poId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [dimensions, setDimensions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cycle, setCycle] = useState(null);
  const [isViewMode, setIsViewMode] = useState(searchParams.get('view') === 'true');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [poName, setPOName] = useState('');

  // Determine rater type based on user role
  const getRaterType = () => {
    if (user?.role === 'ProductOwner') return 'Self';
    if (user?.role === 'AgileCoach') return 'Coach';
    if (user?.role === 'Manager') return 'Manager';
    return 'Self';
  };

  const raterType = getRaterType();

  useEffect(() => {
    fetchData();
  }, [cycleId, poId]);

  const fetchData = async () => {
    try {
      const [dimensionsRes, cycleRes, existingRes] = await Promise.all([
        dimensionsAPI.getQuestionsByDimension(),
        cyclesAPI.getActive(),
        responsesAPI.get(cycleId, poId).catch(() => ({ data: null }))
      ]);

      setDimensions(dimensionsRes.data);
      setCycle(cycleRes.data);

      // Load existing responses if any
      if (existingRes.data) {
        // Handle array of responses (admin/exec view)
        const responseData = Array.isArray(existingRes.data) 
          ? existingRes.data.find(r => r.rater_type === raterType) 
          : existingRes.data;
        
        if (responseData?.items) {
          const existingResponses = {};
          responseData.items.forEach(item => {
            existingResponses[item.question_id] = {
              score: item.score,
              comment: item.comment || ''
            };
          });
          setResponses(existingResponses);
          setIsSubmitted(!responseData.is_draft);
          if (!responseData.is_draft) {
            setIsViewMode(true);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load assessment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = dimensions.reduce((sum, d) => sum + (d.questions?.length || 0), 0);
  const answeredQuestions = Object.values(responses).filter(r => r.score !== null && r.score !== undefined).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleScoreChange = (questionId, score) => {
    if (isViewMode) return;
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        score: prev[questionId]?.score === score ? null : score
      }
    }));
  };

  const handleCommentChange = (questionId, comment) => {
    if (isViewMode) return;
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        comment
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = Object.entries(responses).map(([questionId, data]) => ({
        question_id: questionId,
        score: data.score,
        comment: data.comment || null
      }));

      await responsesAPI.save({
        cycle_id: cycleId,
        po_id: poId,
        rater_type: raterType,
        items
      });

      toast.success('Progress saved');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Check for unanswered questions
    const unanswered = totalQuestions - answeredQuestions;
    if (unanswered > 0) {
      toast.warning(`You have ${unanswered} unanswered questions`, {
        description: 'Please review before submitting'
      });
      return;
    }

    setSubmitting(true);
    try {
      const items = Object.entries(responses).map(([questionId, data]) => ({
        question_id: questionId,
        score: data.score,
        comment: data.comment || null
      }));

      await responsesAPI.submit({
        cycle_id: cycleId,
        po_id: poId,
        rater_type: raterType,
        items
      });

      toast.success('Assessment submitted successfully!');
      setIsSubmitted(true);
      setIsViewMode(true);
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionText = (question) => {
    if (raterType === 'Self') return question.text_self;
    if (raterType === 'Coach') return question.text_coach;
    return question.text_manager;
  };

  // Calculate dimension scores for view mode
  const getDimensionScore = (dimension) => {
    const dimQuestions = dimension.questions || [];
    const scores = dimQuestions
      .map(q => responses[q.id]?.score)
      .filter(s => s != null);
    
    if (scores.length === 0) return null;
    
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const normalized = ((avg - 1) / 4) * 100;
    return normalized;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-500">Loading assessment...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          {!isViewMode && (
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="save-progress-btn"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Progress'}
            </Button>
          )}
          {isViewMode && isSubmitted && (
            <Badge className="bg-lime-100 text-lime-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Submitted
            </Badge>
          )}
        </div>

        {/* Progress Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl font-bold text-slate-900">
                  {raterType} Assessment
                </h1>
                {isViewMode && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    View Mode
                  </Badge>
                )}
              </div>
              <p className="text-slate-600">{cycle?.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-heading font-bold text-lime-600">
                {Math.round(progress)}%
              </div>
              <div className="text-sm text-slate-500">
                {answeredQuestions}/{totalQuestions} answered
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* All Dimensions - Single Scrollable View */}
        <div className="space-y-10">
          {dimensions.map((dim, dimIndex) => {
            const dimQuestions = dim.questions || [];
            const dimAnswered = dimQuestions.filter(q => responses[q.id]?.score != null).length;
            const isComplete = dimAnswered === dimQuestions.length;
            const dimScore = isViewMode ? getDimensionScore(dim) : null;

            return (
              <div key={dim.id} className="space-y-6" id={`dimension-${dimIndex}`}>
                {/* Dimension Header */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 border-l-lime-500">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center text-lg font-bold text-lime-700">
                        {dimIndex + 1}
                      </span>
                      <div>
                        <h2 className="font-heading text-xl font-semibold text-slate-900">
                          {dim.name}
                        </h2>
                        <p className="text-slate-600 text-sm">{dim.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Complete
                        </span>
                      )}
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                        Weight: {dim.weight}%
                      </span>
                      {isViewMode && dimScore != null && (
                        <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm font-medium">
                          Score: {dimScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions for this dimension */}
                <div className="space-y-4 pl-4 border-l-2 border-slate-200 ml-5">
                  {dimQuestions.map((question, qIndex) => (
                    <div key={question.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium leading-relaxed">
                            {getQuestionText(question)}
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
                      <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => handleScoreChange(question.id, score)}
                            disabled={isViewMode}
                            className={`rubric-option ${
                              responses[question.id]?.score === score ? 'selected' : ''
                            } ${isViewMode ? 'cursor-default' : ''}`}
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
                          Evidence / Example {isViewMode ? '' : '(optional)'}
                        </label>
                        <Textarea
                          value={responses[question.id]?.comment || ''}
                          onChange={(e) => handleCommentChange(question.id, e.target.value)}
                          placeholder={isViewMode ? 'No comment provided' : 'Add context or examples to support your rating...'}
                          className="resize-none"
                          rows={2}
                          disabled={isViewMode}
                          data-testid={`comment-${question.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit / Back Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {!isViewMode && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-lime-600 hover:bg-lime-700 text-white"
              data-testid="submit-assessment-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          )}
        </div>

        {/* Unanswered Warning */}
        {!isViewMode && answeredQuestions < totalQuestions && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              {totalQuestions - answeredQuestions} question(s) remaining. Complete all questions before submitting.
            </p>
          </div>
        )}

        {/* View Mode Info */}
        {isViewMode && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <Eye className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <p className="text-sm text-slate-600">
              You are viewing a completed assessment. Scroll through all dimensions to see responses and scores.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssessmentPage;
