import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Send,
  Hash,
  MessageSquare,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  X,
  Paperclip,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { getHumanAvatar } from '../utils/avatarHelper';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export const StudyGroupsPage = () => {
  const { user, token, awardPoints } = useAuth();
  const { socket, joinGroup, leaveGroup, sendGroupMessage, deleteGroupMessage, emitTyping, emitStopTyping } = useSocket();
  const { playCorrect, playFlip } = useSound();

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [mobileView, setMobileView] = useState('channels'); // 'channels' | 'chat'

  // File Upload & Attachment States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Modals & join input
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    subject: 'Web Development',
  });

  const chatBottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Format file size nicely (e.g. 2.4 MB)
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Build secure attachment URL with auth token query param
  const getAttachmentUrl = (attachment, download = false) => {
    if (!attachment?.url) return '#';
    const rawApi = import.meta.env.VITE_API_URL || '';
    const apiOrigin = rawApi ? rawApi.replace(/\/api\/?$/, '') : '';
    const basePath = attachment.url.startsWith('http') ? attachment.url : `${apiOrigin}${attachment.url}`;

    const authToken = token || localStorage.getItem('pocket_mentor_token');
    const separator = basePath.includes('?') ? '&' : '?';
    const queryParams = [];
    if (authToken) queryParams.push(`token=${encodeURIComponent(authToken)}`);
    if (download) queryParams.push('download=true');
    if (attachment.name) queryParams.push(`name=${encodeURIComponent(attachment.name)}`);

    return queryParams.length > 0 ? `${basePath}${separator}${queryParams.join('&')}` : basePath;
  };

  // Close attach menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/groups');
      setGroups(data);
      if (data.length > 0 && !activeGroup) {
        selectGroup(data[0]);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch messages when active group changes
  const selectGroup = async (grp) => {
    if (activeGroup) {
      leaveGroup(activeGroup._id);
    }
    setActiveGroup(grp);
    setMobileView('chat');
    setSelectedFile(null);
    setUploadError('');
    setShowAttachMenu(false);
    joinGroup(grp._id);

    try {
      const { data } = await api.get(`/groups/${grp._id}/messages`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Socket listener for real-time messages, deletions & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msgData) => {
      if (msgData.group === activeGroup?._id || msgData.groupId === activeGroup?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id && msgData._id && m._id === msgData._id)) {
            return prev;
          }
          return [...prev, msgData];
        });
        playFlip();
      }
    };

    const handleMessageDeleted = ({ groupId, messageId }) => {
      if (groupId === activeGroup?._id || !groupId) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    };

    const handleTyping = ({ userName }) => {
      setTypingUser(userName);
    };

    const handleStopTyping = () => {
      setTypingUser('');
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeGroup, playFlip]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser, uploading]);

  // Trigger File Input with filter
  const triggerFileInput = (mode) => {
    setShowAttachMenu(false);
    if (!fileInputRef.current) return;

    if (mode === 'doc') {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain';
    } else if (mode === 'image') {
      fileInputRef.current.accept = '.jpg,.jpeg,.png,.webp,image/png,image/jpeg,image/webp,image/jpg';
    } else {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.webp';
    }

    fileInputRef.current.click();
  };

  // Handle file selected from file picker
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`Unsupported file type (${ext}). Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG, WEBP.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File is too large. Maximum allowed size is 15 MB.');
      return;
    }

    setUploadError('');
    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadError('');
  };

  // Send Message (Text, Attachment, or Both)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessageText.trim() && !selectedFile) || !activeGroup || uploading) return;

    const text = newMessageText.trim();
    const fileToSend = selectedFile;

    setNewMessageText('');
    setSelectedFile(null);
    setUploadError('');
    emitStopTyping(activeGroup._id);

    try {
      let responseData;

      if (fileToSend) {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        if (text) {
          formData.append('message', text);
        }
        formData.append('file', fileToSend);

        const { data } = await api.post(`/groups/${activeGroup._id}/message`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });
        responseData = data;
      } else {
        const { data } = await api.post(`/groups/${activeGroup._id}/message`, {
          message: text,
        });
        responseData = data;
      }

      // Emit via Socket.io for immediate real-time sync
      sendGroupMessage({
        ...responseData,
        groupId: activeGroup._id,
      });

      setMessages((prev) => {
        if (prev.some((m) => m._id && responseData._id && m._id === responseData._id)) {
          return prev;
        }
        return [...prev, responseData];
      });

      awardPoints(fileToSend ? 5 : 2);
    } catch (err) {
      console.error('Failed to post message:', err);
      setUploadError(err.response?.data?.message || 'Failed to send message. Please try again.');
      if (fileToSend) setSelectedFile(fileToSend);
      if (text) setNewMessageText(text);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId) => {
    if (!activeGroup || !msgId) return;
    if (!window.confirm('Delete this message?')) return;

    try {
      await api.delete(`/groups/${activeGroup._id}/messages/${msgId}`);
      deleteGroupMessage({ groupId: activeGroup._id, messageId: msgId });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  // Handle Typing Indicator
  const handleTextChange = (e) => {
    setNewMessageText(e.target.value);
    if (!activeGroup) return;

    emitTyping(activeGroup._id, user?.name?.split(' ')[0] || 'Peer');
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(activeGroup._id);
    }, 1500);
  };

  // Create Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const { data } = await api.post('/groups', createFormData);
      playCorrect();
      awardPoints(25);
      setGroups((prev) => [data, ...prev]);
      setShowCreateModal(false);
      selectGroup(data);
      setCreateFormData({ name: '', description: '', subject: 'Web Development' });
    } catch (err) {
      alert('Failed to create group: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  // Join by Group Code
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinLoading(true);
    try {
      const { data } = await api.post('/groups/join', { groupCode: joinCodeInput.trim() });
      playCorrect();
      awardPoints(15);
      await fetchGroups();
      selectGroup(data.group);
      setJoinCodeInput('');
    } catch (err) {
      alert('Join error: ' + (err.response?.data?.message || 'Invalid group code'));
    } finally {
      setJoinLoading(false);
    }
  };

  const copyCodeToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col space-y-3 sm:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-black uppercase mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Private Real-Time Study Rooms</span>
          </div>
          <h1 className="font-fun text-2xl sm:text-3xl font-black text-slate-900">
            👥 Student Study Groups
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Collaborate, share study PDFs, lecture notes, and learn together in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Join by code form */}
          <form onSubmit={handleJoinByCode} className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Enter Group Code"
              value={joinCodeInput}
              disabled={joinLoading}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold uppercase w-32 sm:w-36 focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={joinLoading || !joinCodeInput.trim()}
              className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              {joinLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <span>Join</span>
              )}
            </button>
          </form>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 sm:px-4 py-2 rounded-xl btn-duo-green text-xs font-black flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Main Chat & Sidebar Grid */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Study Groups List */}
        <div
          className={`md:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-fun font-bold text-slate-800 text-sm">Your Channels</span>
            <span className="text-xs font-bold text-slate-400">{groups.length} active</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {groups.length === 0 ? (
              <div className="p-6 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-fun font-bold text-sm text-slate-800">No Groups Joined</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    You only see your own created groups or groups you joined via code.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  + Create Your First Group
                </button>
              </div>
            ) : (
              groups.map((grp) => {
                const isSelected = activeGroup?._id === grp._id;
                return (
                  <button
                    key={grp._id}
                    onClick={() => selectGroup(grp)}
                    className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50 border-2 border-cyan-300 text-cyan-900 shadow-sm'
                        : 'hover:bg-white text-slate-700 border-2 border-transparent hover:translate-x-0.5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-fun font-black text-sm shrink-0">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-fun font-bold text-sm truncate">{grp.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{grp.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-slate-500">
                        <span>{grp.members?.length || 1} Members</span>
                        <span>• Code: {grp.groupCode}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Room */}
        <div
          className={`md:col-span-8 flex flex-col h-full bg-white ${
            mobileView === 'channels' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeGroup ? (
            <>
              {/* Group Room Header */}
              <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile Back to Channels Button */}
                  <button
                    onClick={() => setMobileView('channels')}
                    className="md:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold shrink-0"
                    title="Back to Channels"
                  >
                    ← Channels
                  </button>
                  <div className="min-w-0">
                    <h2 className="font-fun text-base sm:text-lg font-bold text-slate-900 truncate">
                      {activeGroup.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      {activeGroup.description || 'Live study channel'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyCodeToClipboard(activeGroup.groupCode)}
                    className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Copy shareable group code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-mentor-green" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Code:</span>
                    <span>{activeGroup.groupCode}</span>
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-bold">No messages yet in this study group.</p>
                    <p className="text-xs">Say hello, share a PDF study guide, or ask a question!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender?._id === user?._id;
                    const isAdmin =
                      activeGroup?.admin?._id === user?.id ||
                      activeGroup?.admin?._id === user?._id ||
                      activeGroup?.admin === user?.id ||
                      activeGroup?.admin === user?._id;
                    const canDelete = isMe || isAdmin;
                    const hasAttachment = !!msg.attachment?.url;
                    const attType = msg.attachment?.type;

                    return (
                      <div
                        key={msg._id || i}
                        className={`flex items-start gap-2.5 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <img
                          src={getHumanAvatar(msg.sender)}
                          alt="avatar"
                          className="w-8 h-8 rounded-full bg-slate-100 shrink-0 object-cover border border-slate-200"
                        />
                        <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`flex items-center gap-2 text-[11px] text-slate-400 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="font-bold text-slate-700">{msg.sender?.name || 'Peer'}</span>
                            <span>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {/* Delete Message Button */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Message Body Container */}
                          <div
                            className={`rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                              isMe
                                ? 'bg-cyan-600 text-white rounded-tr-none'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none'
                            }`}
                          >
                            {/* Text Message */}
                            {msg.message && (
                              <p className="whitespace-pre-wrap break-words font-medium">{msg.message}</p>
                            )}

                            {/* Shared Note preview if attached */}
                            {msg.sharedNote && (
                              <div
                                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                  isMe
                                    ? 'bg-cyan-700/60 border-cyan-400 text-white'
                                    : 'bg-white border-slate-200 text-slate-800'
                                }`}
                              >
                                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                                <div className="min-w-0 flex-1 text-xs">
                                  <p className="font-bold truncate">{msg.sharedNote.title || 'Study Note'}</p>
                                  <p className="text-[10px] opacity-75 truncate">{msg.sharedNote.topic}</p>
                                </div>
                              </div>
                            )}

                            {/* File Attachment Card */}
                            {hasAttachment && (
                              <div className="pt-1">
                                {attType === 'pdf' ? (
                                  /* PDF Attachment Card */
                                  <div
                                    className={`p-3 rounded-2xl border ${
                                      isMe
                                        ? 'bg-cyan-700/60 border-cyan-400 text-white'
                                        : 'bg-white border-slate-200 text-slate-800'
                                    } shadow-xs space-y-2.5 max-w-sm`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                                        <FileText className="w-5 h-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`text-xs font-bold truncate ${
                                            isMe ? 'text-white' : 'text-slate-900'
                                          }`}
                                        >
                                          {msg.attachment.name}
                                        </p>
                                        <p className={`text-[11px] ${isMe ? 'text-cyan-100' : 'text-slate-400'}`}>
                                          PDF • {formatFileSize(msg.attachment.size)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/30">
                                      <a
                                        href={getAttachmentUrl(msg.attachment)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 transition ${
                                          isMe
                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Open</span>
                                      </a>
                                      <a
                                        href={getAttachmentUrl(msg.attachment, true)}
                                        download={msg.attachment.name}
                                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 transition ${
                                          isMe
                                            ? 'bg-white text-cyan-900 hover:bg-slate-100'
                                            : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                        }`}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                      </a>
                                    </div>
                                  </div>
                                ) : attType === 'image' ? (
                                  /* Image Attachment Card */
                                  <div className="space-y-1.5 max-w-sm">
                                    <div
                                      onClick={() => setLightboxImage(getAttachmentUrl(msg.attachment))}
                                      className="relative rounded-2xl overflow-hidden border border-slate-200/40 cursor-pointer group bg-slate-900/10"
                                    >
                                      <img
                                        src={getAttachmentUrl(msg.attachment)}
                                        alt={msg.attachment.name}
                                        className="max-h-60 w-auto rounded-2xl object-cover group-hover:scale-102 transition duration-200"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                                        <Eye className="w-4 h-4" />
                                        <span>Preview</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] px-1 opacity-80">
                                      <span className="truncate max-w-[180px] font-medium">{msg.attachment.name}</span>
                                      <a
                                        href={getAttachmentUrl(msg.attachment, true)}
                                        download={msg.attachment.name}
                                        className={`hover:underline flex items-center gap-1 font-bold ${
                                          isMe ? 'text-white' : 'text-cyan-700'
                                        }`}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>{formatFileSize(msg.attachment.size)}</span>
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  /* Document / File Attachment Card */
                                  <div
                                    className={`p-3 rounded-2xl border ${
                                      isMe
                                        ? 'bg-cyan-700/60 border-cyan-400 text-white'
                                        : 'bg-white border-slate-200 text-slate-800'
                                    } shadow-xs space-y-2.5 max-w-sm`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                                        <File className="w-5 h-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`text-xs font-bold truncate ${
                                            isMe ? 'text-white' : 'text-slate-900'
                                          }`}
                                        >
                                          {msg.attachment.name}
                                        </p>
                                        <p
                                          className={`text-[11px] uppercase ${
                                            isMe ? 'text-cyan-100' : 'text-slate-400'
                                          }`}
                                        >
                                          {msg.attachment.type || 'FILE'} • {formatFileSize(msg.attachment.size)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/30">
                                      {['txt', 'text', 'md'].includes(attType) && (
                                        <a
                                          href={getAttachmentUrl(msg.attachment)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 transition ${
                                            isMe
                                              ? 'bg-white/20 hover:bg-white/30 text-white'
                                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                          }`}
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Open</span>
                                        </a>
                                      )}
                                      <a
                                        href={getAttachmentUrl(msg.attachment, true)}
                                        download={msg.attachment.name}
                                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 transition ${
                                          isMe
                                            ? 'bg-white text-cyan-900 hover:bg-slate-100'
                                            : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                        }`}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {typingUser && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span>{typingUser} is typing...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Message Input Area */}
              <div className="border-t border-slate-200 p-2 sm:p-3 bg-white">
                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span className="truncate">{uploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadError('')}
                      className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Pre-Send File Attachment Preview */}
                {selectedFile && !uploading && (
                  <div className="mb-2 p-2.5 bg-slate-50 border-2 border-cyan-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 font-bold">
                        {selectedFile.type?.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-emerald-600" />
                        ) : selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-5 h-5 text-rose-600" />
                        ) : (
                          <File className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Progress Indicator */}
                {uploading && (
                  <div className="mb-2 p-2.5 bg-cyan-50/90 border border-cyan-200 rounded-2xl space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-900">
                      <span className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                        Uploading attachment...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-cyan-200/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-600 h-full rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Composer Form */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2 relative">
                  {/* Attachment Icon & Popover */}
                  <div className="relative shrink-0" ref={attachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      disabled={uploading}
                      aria-label="Attach file"
                      className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                      title="Attach file or PDF"
                    >
                      <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    {/* Popover Dropdown Menu */}
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-44 bg-white rounded-2xl border-2 border-slate-200 shadow-xl p-1.5 z-30 space-y-1">
                        <button
                          type="button"
                          onClick={() => triggerFileInput('doc')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl transition cursor-pointer text-left"
                        >
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>📄 Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerFileInput('image')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl transition cursor-pointer text-left"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>🖼️ Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerFileInput('file')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl transition cursor-pointer text-left"
                        >
                          <Paperclip className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>📎 File</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Picker Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Message Input Box */}
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={handleTextChange}
                    disabled={uploading}
                    placeholder={
                      selectedFile ? 'Add a message or caption...' : `Message #${activeGroup.name}...`
                    }
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={uploading || (!newMessageText.trim() && !selectedFile)}
                    className="p-2.5 sm:px-4 sm:py-3 bg-cyan-500 text-white rounded-2xl shadow-duo-sm hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer font-bold text-xs transition"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-cyan-50 border-2 border-cyan-200 text-cyan-600 flex items-center justify-center shadow-sm">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="font-fun text-xl font-bold text-slate-900">Your Private Study Channels</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Only your created or joined groups appear in your channels list. Share your 6-character group code with friends to let them join!
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl btn-duo-green text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create a Study Group</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <a
                href={lightboxImage}
                download="attachment"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur transition shadow-lg flex items-center gap-1.5 text-xs font-bold"
                title="Download full image"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur transition shadow-lg cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Enlarged study attachment"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => !createLoading && setShowCreateModal(false)}
              disabled={createLoading}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-fun text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>👥 Create Study Group</span>
            </h2>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={createLoading}
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g. Distributed Systems Study Squad"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  disabled={createLoading}
                  value={createFormData.subject}
                  onChange={(e) => setCreateFormData({ ...createFormData, subject: e.target.value })}
                  placeholder="Computer Science"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  disabled={createLoading}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="What is the goal of this study group?"
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading || !createFormData.name.trim()}
                className="w-full py-3.5 rounded-2xl btn-duo-green text-xs font-black flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-duo-green"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Study Group...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Group & Earn +25 XP</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroupsPage;
