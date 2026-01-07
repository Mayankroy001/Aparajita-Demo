
import React, { useState } from 'react';
import { MessageSquare, Heart, Send, Share2, Sparkles, X } from 'lucide-react';
import { Post, Reply } from '../types';
import { generateCommunityAdvice } from '../services/geminiService';

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'Sarah M.',
    content: "Feeling uneasy about the walk back from the metro station tonight. Is anyone around the central park area willing to stay on a call with me for 10 mins?",
    timestamp: Date.now() - 3600000,
    likes: 12,
    replies: [
      { id: 'r1', author: 'Aparajita AI', content: "Stay in well-lit areas. If you haven't already, enable 'Safe Walk' in your dashboard to share live telemetry with your emergency contacts.", timestamp: Date.now() - 3000000 }
    ]
  },
  {
    id: '2',
    author: 'Priya K.',
    content: "Just wanted to share a safe auto-rickshaw driver contact who works around the East End. Super respectful and verified!",
    timestamp: Date.now() - 7200000,
    likes: 45,
    replies: []
  }
];

const CommunityFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    setIsSubmitting(true);
    const post: Post = {
      id: Date.now().toString(),
      author: 'You',
      content: newPost,
      timestamp: Date.now(),
      likes: 0,
      replies: []
    };

    setPosts([post, ...posts]);
    setNewPost('');
    
    // Simulate AI response
    const aiAdvice = await generateCommunityAdvice(newPost);
    const aiReply: Reply = {
      id: 'ai-' + Date.now(),
      author: 'Aparajita AI',
      content: aiAdvice,
      timestamp: Date.now() + 2000
    };

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, replies: [...p.replies, aiReply] } : p));
    setIsSubmitting(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.isLiked;
        return {
          ...p,
          likes: liked ? p.likes + 1 : p.likes - 1,
          isLiked: liked
        };
      }
      return p;
    }));
  };

  const handleAddReply = (postId: string) => {
    if (!replyText.trim()) return;
    const newReply: Reply = {
      id: 'reply-' + Date.now(),
      author: 'You',
      content: replyText,
      timestamp: Date.now()
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p));
    setReplyText('');
    setActiveReplyPostId(null);
  };

  return (
    <div className="py-6 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Aparajita Community</h2>
        <div className="relative">
          <textarea 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share a thought, a warning, or ask for help..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none transition-all"
          />
          <button 
            onClick={handlePost}
            disabled={isSubmitting || !newPost.trim()}
            className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-xl shadow-lg disabled:opacity-50 transition-all active:scale-95"
          >
            {isSubmitting ? <Sparkles className="animate-pulse" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                {post.author[0]}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{post.author}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              {post.content}
            </p>

            <div className="flex items-center gap-6 text-slate-400 border-t border-slate-50 pt-4">
              <button 
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${post.isLiked ? 'text-rose-500' : 'hover:text-indigo-600'}`}
              >
                <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                {post.likes}
              </button>
              <button 
                onClick={() => setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id)}
                className="flex items-center gap-2 text-xs font-semibold hover:text-indigo-600 transition-colors"
              >
                <MessageSquare size={18} />
                {post.replies.length}
              </button>
              <button className="flex items-center gap-2 text-xs font-semibold hover:text-indigo-600 transition-colors ml-auto">
                <Share2 size={18} />
              </button>
            </div>

            {/* Replies section */}
            {(post.replies.length > 0 || activeReplyPostId === post.id) && (
              <div className="mt-4 space-y-3 pt-4 border-t border-slate-50">
                {post.replies.map(reply => (
                  <div key={reply.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${reply.author === 'Aparajita AI' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {reply.author}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      {reply.content}
                    </p>
                  </div>
                ))}

                {activeReplyPostId === post.id && (
                  <div className="flex gap-2 items-center mt-2 animate-in slide-in-from-top-2">
                    <input 
                      autoFocus
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={() => handleAddReply(post.id)}
                      disabled={!replyText.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                    <button 
                      onClick={() => setActiveReplyPostId(null)}
                      className="p-2 text-slate-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityFeed;
