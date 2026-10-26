import React, { useState, useEffect } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight, Clock, Send, MessageCircle, Heart, Check } from 'lucide-react';
import type { Story } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface StoryViewerModalProps {
  isOpen: boolean;
  stories: Story[];
  initialIndex?: number;
  currentUserId?: string;
  onClose: () => void;
  onDeleteStory?: (storyId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  stories,
  initialIndex = 0,
  currentUserId,
  onClose,
  onDeleteStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setReplyText('');
      setIsReplying(false);
      setToastMessage(null);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen || stories.length === 0 || isReplying) return;

    const stepTime = 50; // ms
    const totalDuration = 5000; // 5s per story
    const stepIncrement = (stepTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((curr) => curr + 1);
            return 0;
          } else {
            clearInterval(timer);
            onClose();
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, stories.length, onClose, isReplying]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  const isOwnStory = currentUserId === currentStory.authorId;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const formatStoryTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 60) return `${mins}m lalu`;
      const hours = Math.floor(mins / 60);
      return `${hours}j lalu`;
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full max-h-[92vh] sm:rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl">
        {/* Top Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex flex-col gap-2.5">
          <div className="flex gap-1.5 w-full">
            {stories.map((story, idx) => (
              <div key={story.id} className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author Header */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  currentStory.authorAvatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    currentStory.authorName
                  )}&backgroundColor=0284c7`
                }
                alt={currentStory.authorName}
                className="w-9 h-9 rounded-full object-cover border border-white/40"
              />
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>{currentStory.authorName}</span>
                  {currentStory.authorKelas && (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      • {currentStory.authorKelas}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/70 flex items-center gap-1">
                  <span>@{currentStory.authorUsername}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatStoryTime(currentStory.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOwnStory && onDeleteStory && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus Story ini?')) {
                      onDeleteStory(currentStory.id);
                      handleNext();
                    }
                  }}
                  className="p-2 rounded-full hover:bg-white/20 text-rose-400 transition"
                  title="Hapus Story Saya"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Display Area */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story Content"
              className="max-h-full max-w-full object-contain"
            />
          )}

          {/* Tap Zones: Left = Prev, Right = Next */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-16 w-1/3 z-20 cursor-pointer"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-16 w-2/3 z-20 cursor-pointer"
          />
        </div>

        {/* Bottom Caption Overlay */}
        {currentStory.caption && (
          <div className="absolute bottom-16 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white text-center">
            <p className="text-xs sm:text-sm font-medium drop-shadow-md">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Reply Story to DM Bar */}
        {!isOwnStory && (
          <div className="relative z-30 p-3 bg-black/90 border-t border-white/10 flex flex-col gap-2">
            {toastMessage && (
              <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                {toastMessage}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onFocus={() => setIsReplying(true)}
                onBlur={() => {
                  if (!replyText.trim()) setIsReplying(false);
                }}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (replyText.trim()) {
                      api.sendDirectMessage({
                        recipientId: currentStory.authorId,
                        recipientName: currentStory.authorName,
                        recipientUsername: currentStory.authorUsername,
                        text: replyText.trim(),
                        replyToStory: {
                          id: currentStory.id,
                          mediaUrl: currentStory.mediaUrl,
                          authorName: currentStory.authorName,
                          caption: currentStory.caption,
                        },
                      }).then(() => {
                        setReplyText('');
                        setIsReplying(false);
                        setToastMessage('Balasan terkirim ke DM!');
                        setTimeout(() => setToastMessage(null), 2500);
                      }).catch(() => {
                        setToastMessage('Gagal mengirim balasan');
                        setTimeout(() => setToastMessage(null), 2500);
                      });
                    }
                  }
                }}
                placeholder={`Kirim pesan ke ${currentStory.authorName}...`}
                className="flex-1 px-3.5 py-2 bg-white/15 border border-white/20 rounded-full text-xs text-white placeholder-white/60 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 focus:bg-white/25 transition"
              />
              {/* Quick Emojis or Send */}
              {replyText.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    api.sendDirectMessage({
                      recipientId: currentStory.authorId,
                      recipientName: currentStory.authorName,
                      recipientUsername: currentStory.authorUsername,
                      text: replyText.trim(),
                      replyToStory: {
                        id: currentStory.id,
                        mediaUrl: currentStory.mediaUrl,
                        authorName: currentStory.authorName,
                        caption: currentStory.caption,
                      },
                    }).then(() => {
                      setReplyText('');
                      setIsReplying(false);
                      setToastMessage('Balasan terkirim ke DM!');
                      setTimeout(() => setToastMessage(null), 2500);
                    }).catch(() => {
                      setToastMessage('Gagal mengirim balasan');
                      setTimeout(() => setToastMessage(null), 2500);
                    });
                  }}
                  className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  {['❤️', '🔥', '😂'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        api.sendDirectMessage({
                          recipientId: currentStory.authorId,
                          recipientName: currentStory.authorName,
                          recipientUsername: currentStory.authorUsername,
                          text: em,
                          replyToStory: {
                            id: currentStory.id,
                            mediaUrl: currentStory.mediaUrl,
                            authorName: currentStory.authorName,
                            caption: currentStory.caption,
                          },
                        }).then(() => {
                          setToastMessage(`Reaksi ${em} terkirim ke DM!`);
                          setTimeout(() => setToastMessage(null), 2500);
                        });
                      }}
                      className="text-base p-1 hover:scale-125 transition active:scale-95"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
