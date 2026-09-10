import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Send,
  Hash,
  MessageSquare,
  Sparkles,
  BookOpen,
  UserPlus,
  Copy,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { getHumanAvatar } from '../utils/avatarHelper';

export const StudyGroupsPage = () => {
  const { user, awardPoints } = useAuth();
  const { socket, joinGroup, leaveGroup, sendGroupMessage, emitTyping, emitStopTyping } = useSocket();
  const { playCorrect, playFlip } = useSound();

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

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
    joinGroup(grp._id);

    try {
      const { data } = await api.get(`/groups/${grp._id}/messages`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Socket listener for real-time messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msgData) => {
      if (msgData.group === activeGroup?._id || msgData.groupId === activeGroup?._id) {
        setMessages(prev => [...prev, msgData]);
        playFlip();
      }
    };

    const handleTyping = ({ userName }) => {
      setTypingUser(userName);
    };

    const handleStopTyping = () => {
      setTypingUser('');
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeGroup, playFlip]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeGroup) return;

    const text = newMessageText.trim();
    setNewMessageText('');
    emitStopTyping(activeGroup._id);

    try {
      const { data } = await api.post(`/groups/${activeGroup._id}/message`, {
        message: text,
      });

      // Emit via Socket.io for immediate real-time sync
      sendGroupMessage({
        ...data,
        groupId: activeGroup._id,
      });

      setMessages(prev => [...prev, data]);
      awardPoints(2); // +2 XP for chat collaboration
    } catch (err) {
      console.error('Failed to post message:', err);
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
      setGroups(prev => [data, ...prev]);
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-black uppercase mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Private Real-Time Study Rooms</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900">
            👥 Student Study Groups
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Only your created or joined groups appear here. Share your unique code for others to join!
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
              className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold uppercase w-36 focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="px-4 py-2 rounded-xl btn-duo-green text-xs font-black flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Main Chat & Sidebar Grid */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Study Groups List */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50">
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
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {activeGroup ? (
            <>
              {/* Group Room Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-fun text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{activeGroup.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500">{activeGroup.description || 'Live study and peer mentoring channel'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCodeToClipboard(activeGroup.groupCode)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    title="Copy shareable group code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-mentor-green" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Code: {activeGroup.groupCode}</span>
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-bold">No messages yet in this study group.</p>
                    <p className="text-xs">Say hello, share a question, or discuss your study notes!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender?._id === user?._id;
                    return (
                      <div
                        key={msg._id || i}
                        className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <img
                          src={getHumanAvatar(msg.sender)}
                          alt="avatar"
                          className="w-8 h-8 rounded-full bg-slate-100 shrink-0 object-cover"
                        />
                        <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-bold text-slate-700">{msg.sender?.name}</span>
                            <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                              isMe
                                ? 'bg-cyan-600 text-white rounded-tr-none'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none'
                            }`}
                          >
                            {msg.message}
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

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={handleTextChange}
                  placeholder={`Message #${activeGroup.name}...`}
                  className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="p-3 bg-cyan-500 text-white rounded-2xl shadow-duo-sm hover:brightness-105 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => !createLoading && setShowCreateModal(false)}
              disabled={createLoading}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
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
