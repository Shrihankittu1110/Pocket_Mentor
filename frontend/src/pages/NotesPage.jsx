import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Sparkles,
  Zap,
  Layers,
  HelpCircle,
  Trash2,
  Search,
  Plus,
  X,
  Volume2,
  Clock,
  BookOpen,
  Filter
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import VoiceControls from '../components/common/VoiceControls';

export const NotesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { awardPoints } = useAuth();
  const { playCorrect, playFlip } = useSound();
  const { speak, pause, resume, stop, repeat, isSpeaking, isPaused } = useSpeechSynthesis();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(searchParams.get('action') === 'upload');
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' or 'upload'
  const [summaryModalNote, setSummaryModalNote] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Upload form state
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Computer Science',
    topic: '',
    pasteContent: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notes', {
        params: { search, subject: selectedSubject },
      });
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [search, selectedSubject]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title || 'Untitled Note');
      payload.append('subject', formData.subject || 'General');
      payload.append('topic', formData.topic || 'General');

      if (activeTab === 'paste') {
        if (!formData.pasteContent.trim()) {
          setUploadError('Please paste your study notes');
          setUploadLoading(false);
          return;
        }
        payload.append('pasteContent', formData.pasteContent);
      } else {
        if (!selectedFile) {
          setUploadError('Please select a TXT, PDF, or DOCX document file');
          setUploadLoading(false);
          return;
        }
        payload.append('file', selectedFile);
      }

      const { data } = await api.post('/notes', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      playCorrect();
      awardPoints(20);
      setShowUploadModal(false);
      setFormData({ title: '', subject: 'Computer Science', topic: '', pasteContent: '' });
      setSelectedFile(null);
      fetchNotes();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to process and upload notes.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const handleOpenSummary = async (note) => {
    setSummaryModalNote(note);
    if (!note.summary) {
      try {
        setGeneratingSummary(true);
        const { data } = await api.post(`/notes/${note._id}/summary`);
        setSummaryModalNote(prev => ({ ...prev, summary: data.summary }));
        // Update local list
        setNotes(prev => prev.map(n => n._id === note._id ? { ...n, summary: data.summary } : n));
      } catch (err) {
        alert('Failed to generate summary');
      } finally {
        setGeneratingSummary(false);
      }
    }
  };

  const handleGenerateFlashcards = async (note) => {
    try {
      playFlip();
      const { data } = await api.post('/flashcards/generate', {
        noteId: note._id,
        content: note.content,
        topic: note.topic || note.title,
      });
      awardPoints(15);
      navigate(`/flashcards?noteId=${note._id}`);
    } catch (err) {
      alert('Failed to generate flashcards: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleGenerateQuiz = async (note) => {
    try {
      playCorrect();
      const { data } = await api.post('/quizzes/generate', {
        noteId: note._id,
        content: note.content,
        topic: note.topic || note.title,
      });
      awardPoints(20);
      navigate(`/quiz?id=${data._id}`);
    } catch (err) {
      alert('Failed to generate quiz: ' + (err.response?.data?.message || err.message));
    }
  };

  const subjects = ['All', 'Computer Science', 'Mathematics', 'Engineering', 'Science', 'Business', 'General'];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-fun text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>📚 My Study Notes</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Upload class notes to generate instant summaries, flashcards, and quizzes
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 rounded-2xl btn-duo-green font-black text-sm flex items-center gap-2 shadow-duo-green"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Upload Notes (+20 XP)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, topics..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-mentor-green"
          />
        </div>

        {/* Subject Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedSubject === sub
                  ? 'bg-mentor-green text-white shadow-duo-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-mentor-green border-t-transparent rounded-full animate-spin"></div>
          <p className="font-fun text-slate-500 font-bold mt-2">Loading your notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-mentor-green mx-auto flex items-center justify-center text-3xl shadow-sm">
            📝
          </div>
          <div className="space-y-1">
            <h3 className="font-fun text-xl font-bold text-slate-800">No notes found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You haven't added any notes yet. Paste your lecture notes or upload a PDF document!
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 rounded-2xl btn-duo-green font-bold text-sm inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Notes Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-duo hover:border-emerald-400 transition space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 mb-2">
                  <span className="bg-emerald-50 text-mentor-green px-2.5 py-0.5 rounded-md">
                    {note.topic || 'General'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-fun text-lg font-bold text-slate-800 line-clamp-1">
                  {note.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-3 mt-2 leading-relaxed">
                  {note.content}
                </p>
              </div>

              {/* AI Actions Buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenSummary(note)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-mentor-blue text-xs font-extrabold rounded-xl border border-blue-200 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Summary</span>
                  </button>

                  <button
                    onClick={() => navigate(`/quick-revision?noteId=${note._id}`)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-extrabold rounded-xl border border-amber-200 transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>60s Revise</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleGenerateFlashcards(note)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-purple-50 hover:bg-purple-100 text-mentor-purple text-xs font-extrabold rounded-xl border border-purple-200 transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Flashcards</span>
                  </button>

                  <button
                    onClick={() => handleGenerateQuiz(note)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-mentor-red text-xs font-extrabold rounded-xl border border-rose-200 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Take Quiz</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Upload Notes Modal (Option 1: Paste, Option 2: Upload TXT/PDF/DOCX) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-1">
              <h2 className="font-fun text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>📝 Add Study Notes</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Paste raw notes or upload your lecture documents to get AI study tools
              </p>
            </div>

            {/* Tab switch: Paste Notes vs Upload Document */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                  activeTab === 'paste'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Option 1: Paste Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Option 2: Upload Files (PDF / DOCX / TXT)
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Operating Systems: Process Scheduling"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Computer Science"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="Process Management"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none"
                  />
                </div>
              </div>

              {activeTab === 'paste' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Paste Lecture / Class Notes *
                  </label>
                  <textarea
                    rows={6}
                    name="pasteContent"
                    value={formData.pasteContent}
                    onChange={handleInputChange}
                    placeholder="Paste class notes, definitions, lecture transcripts, or textbook chapters here..."
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Document (TXT, PDF, DOCX) *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-mentor-green transition bg-slate-50">
                    <input
                      type="file"
                      id="docFile"
                      accept=".txt,.pdf,.docx,.doc,.md"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="docFile" className="cursor-pointer block space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-mentor-green mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        {selectedFile ? selectedFile.name : 'Click to select or drag and drop document'}
                      </p>
                      <p className="text-[11px] text-slate-400">Supported formats: PDF, DOCX, TXT (up to 15MB)</p>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full py-3.5 px-4 rounded-2xl btn-duo-green text-sm font-black flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{uploadLoading ? 'Processing Notes with AI...' : 'Save & Process Notes (+20 XP)'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal with Voice Playback */}
      {summaryModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => {
                stop();
                setSummaryModalNote(null);
              }}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-slate-100 pb-3 pr-8">
              <span className="text-[11px] font-black uppercase text-mentor-green bg-emerald-50 px-2 py-0.5 rounded">
                AI Topic Summary
              </span>
              <h2 className="font-fun text-2xl font-black text-slate-900 mt-1">
                {summaryModalNote.title}
              </h2>
            </div>

            {/* Voice Controls Bar */}
            {summaryModalNote.summary && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-2.5 px-4">
                <VoiceControls
                  isSpeaking={isSpeaking}
                  isPaused={isPaused}
                  onSpeak={() => speak(summaryModalNote.summary)}
                  onPause={pause}
                  onResume={resume}
                  onStop={stop}
                  onRepeat={repeat}
                  label="Listen to Summary"
                />
              </div>
            )}

            {/* Summary Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {generatingSummary ? (
                <div className="text-center py-12 space-y-3">
                  <div className="inline-block w-8 h-8 border-4 border-mentor-blue border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-fun font-bold text-slate-600">AI is distilling core concepts and definitions...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  {summaryModalNote.summary || "Generating structured study summary..."}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  stop();
                  setSummaryModalNote(null);
                }}
                className="px-5 py-2.5 rounded-xl btn-duo-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotesPage;
