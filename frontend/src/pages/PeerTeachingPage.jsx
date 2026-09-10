import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  ThumbsUp,
  Heart,
  Star,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  X,
  Send
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { getHumanAvatar } from '../utils/avatarHelper';

export const PeerTeachingPage = () => {
  const { user, awardPoints } = useAuth();
  const { playCorrect, playAchievement } = useSound();

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);

  // New Question form
  const [questionFormData, setQuestionFormData] = useState({
    title: '',
    question: '',
    topic: 'React & Web',
    subject: 'Computer Science',
  });

  // New Answer form
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/peer/questions', {
        params: { search },
      });
      setPosts(data);
      if (data.length > 0 && !selectedPost) {
        setSelectedPost(data[0]);
      }
    } catch (err) {
      console.error('Failed to load peer posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search]);

  // Create Question
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/peer/questions', questionFormData);
      playCorrect();
      awardPoints(10);
      setPosts(prev => [data, ...prev]);
      setSelectedPost(data);
      setShowAskModal(false);
      setQuestionFormData({ title: '', question: '', topic: 'React & Web', subject: 'Computer Science' });
    } catch (err) {
      alert('Failed to post question: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit Answer (Peer Teaching)
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerContent.trim() || !selectedPost) return;

    setSubmittingAnswer(true);
    try {
      const { data } = await api.post(`/peer/questions/${selectedPost._id}/answers`, {
        content: answerContent.trim(),
      });
      playAchievement();
      awardPoints(25); // +25 Mentor XP for teaching!
      setSelectedPost(data.post);
      setPosts(prev => prev.map(p => p._id === data.post._id ? data.post : p));
      setAnswerContent('');
    } catch (err) {
      alert('Failed to post answer: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Vote on Answer
  const handleVote = async (answerId, voteType) => {
    if (!selectedPost) return;

    try {
      const { data } = await api.post(`/peer/questions/${selectedPost._id}/answers/${answerId}/vote`, {
        voteType,
      });
      playCorrect();
      setSelectedPost(data);
      setPosts(prev => prev.map(p => p._id === data._id ? data : p));
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Mark Best Answer
  const handleMarkBest = async (answerId) => {
    if (!selectedPost) return;

    try {
      const { data } = await api.post(`/peer/questions/${selectedPost._id}/answers/${answerId}/best`);
      playAchievement();
      setSelectedPost(data);
      setPosts(prev => prev.map(p => p._id === data._id ? data : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark best answer');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Peer Mentoring & Collaborative Knowledge</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900">
            👨‍🏫 Peer Teaching Hub
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Explain difficult topics to fellow students, vote on great answers, and earn Mentor Badges
          </p>
        </div>

        <button
          onClick={() => setShowAskModal(true)}
          className="px-5 py-3 rounded-2xl btn-duo-purple font-black text-xs sm:text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ask for Help (+10 XP)</span>
        </button>
      </div>

      {/* Main Grid: Question Feed vs Answer & Discussion Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Questions List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search peer questions..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-400"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold">Loading questions...</div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2">
              <p className="font-fun font-bold text-slate-700">No questions found</p>
              <p className="text-xs text-slate-400">Be the first to ask for help on a tricky topic!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const isSelected = selectedPost?._id === post._id;
                return (
                  <div
                    key={post._id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-4 rounded-3xl border-2 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-400 shadow-duo'
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-400 mb-1.5">
                      <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {post.topic}
                      </span>
                      {post.isResolved && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Best Answer Chosen
                        </span>
                      )}
                    </div>

                    <h3 className="font-fun text-base font-bold text-slate-900 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {post.question}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        By {post.author?.name || 'Student'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.answers?.length || 0} explanations
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Question Details & Peer Explanations */}
        <div className="lg:col-span-7">
          {selectedPost ? (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Question Header */}
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                    {selectedPost.topic}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Posted {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="font-fun text-2xl font-black text-slate-900 leading-snug">
                  {selectedPost.title}
                </h2>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.question}
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 font-semibold">
                  <img
                    src={getHumanAvatar(selectedPost.author)}
                    alt="avatar"
                    className="w-6 h-6 rounded-full bg-slate-100 object-cover"
                  />
                  <span>Asked by <strong className="text-slate-800">{selectedPost.author?.name}</strong></span>
                </div>
              </div>

              {/* Answers / Peer Explanations List */}
              <div className="space-y-4">
                <h3 className="font-fun text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>💡 Peer Explanations ({selectedPost.answers?.length || 0})</span>
                </h3>

                {selectedPost.answers?.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-slate-500 text-xs">
                    <p className="font-bold text-slate-700">No explanations posted yet.</p>
                    <p>Be the mentor! Explain this concept below and earn +25 Knowledge Points!</p>
                  </div>
                ) : (
                  selectedPost.answers.map((ans) => {
                    const isAuthorOfPost = user?.id === selectedPost.author?._id || user?._id === selectedPost.author?._id;
                    return (
                      <div
                        key={ans._id}
                        className={`p-5 rounded-3xl border-2 space-y-3 transition ${
                          ans.isBestAnswer
                            ? 'bg-amber-50/40 border-amber-400 shadow-sm'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={getHumanAvatar(ans.author)}
                              alt="author"
                              className="w-8 h-8 rounded-full bg-slate-100 object-cover"
                            />
                            <div>
                              <p className="font-fun font-bold text-xs text-slate-800">{ans.author?.name}</p>
                              <p className="text-[10px] text-slate-400">Peer Student</p>
                            </div>
                          </div>

                          {ans.isBestAnswer && (
                            <span className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>Best Answer</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {ans.content}
                        </p>

                        {/* Voting & Mentor Rewards Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVote(ans._id, 'helpful')}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Helpful ({ans.helpfulVotes?.length || 0})</span>
                            </button>

                            <button
                              onClick={() => handleVote(ans._id, 'love')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition"
                            >
                              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                              <span>Great Explanation ({ans.loveVotes?.length || 0})</span>
                            </button>
                          </div>

                          {isAuthorOfPost && !ans.isBestAnswer && (
                            <button
                              onClick={() => handleMarkBest(ans._id)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-duo-sm flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>Mark Best (+50 XP)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Submit Peer Answer Box */}
              <form onSubmit={handleAnswerSubmit} className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-fun font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-mentor-purple" />
                  <span>Teach Another Student & Earn +25 Points</span>
                </h4>

                <textarea
                  rows={4}
                  required
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="Explain this concept simply, step-by-step, or with an illustrative example..."
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-purple focus:outline-none resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingAnswer || !answerContent.trim()}
                    className="px-6 py-2.5 rounded-xl btn-duo-purple text-xs font-black flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingAnswer ? 'Posting...' : 'Post Explanation (+25 XP)'}</span>
                  </button>
                </div>
              </form>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center text-slate-400">
              Select a question on the left or post a new one to begin peer teaching.
            </div>
          )}
        </div>

      </div>

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAskModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-fun text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🙋‍♂️ Ask for Peer Help</span>
            </h2>

            <form onSubmit={handleAskQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Title *
                </label>
                <input
                  type="text"
                  required
                  value={questionFormData.title}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, title: e.target.value })}
                  placeholder="e.g. How does Virtual Memory handle Page Faults?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-purple focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={questionFormData.topic}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, topic: e.target.value })}
                    placeholder="Operating Systems"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={questionFormData.subject}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, subject: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-purple focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Details & What You Don't Understand *
                </label>
                <textarea
                  rows={4}
                  required
                  value={questionFormData.question}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                  placeholder="Explain what concept is confusing, what you've tried, or where you need peer clarification..."
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-purple focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl btn-duo-purple text-xs font-black flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish to Peer Community (+10 XP)</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PeerTeachingPage;
