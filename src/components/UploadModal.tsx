import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEscapeKey } from '../lib/hooks';

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
  isAuthenticated: boolean;
}

export function UploadModal({ onClose, onUploadComplete, isAuthenticated }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // An upload in flight should not be interrupted by a stray key press
  useEscapeKey(onClose, !isUploading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    if (!isAuthenticated) {
      setUploadError('Sign in from the account menu to upload a game.');
      return;
    }
    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('game', file);
    if (thumb) {
      formData.append('thumbnail', thumb);
    }
    formData.append('title', title);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onUploadComplete();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUploadError(errorData.error || 'Upload failed');
      }
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 backdrop-blur-lg p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="sheet w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-edge">
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-volt/12 border border-volt/30 flex items-center justify-center">
                <UploadCloud className="w-4 h-4 text-volt" />
              </span>
              Upload a game
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {uploadError && (
              <div className="p-3 bg-rose/10 border border-rose/25 rounded-xl text-xs text-rose font-medium text-center">
                {uploadError}
              </div>
            )}
            <div>
              <label className="eyebrow block mb-2">
                Game Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field w-full p-2.5 text-xs"
                placeholder="Name your game"
              />
            </div>
            
            <div>
              <label className="eyebrow block mb-2">
                Game File (.swf or .html)
              </label>
              <input
                type="file"
                required
                accept=".swf,.html,.htm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-volt/20 file:text-volt hover:file:bg-volt/30 transition-colors cursor-pointer text-xs"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">
                Thumbnail (Optional, .png or .jpg)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setThumb(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-volt/20 file:text-volt hover:file:bg-volt/30 transition-colors cursor-pointer text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || !file || !title}
              className="w-full btn-volt disabled:opacity-50 disabled:cursor-not-allowed text-xs py-2.5 rounded-xl flex justify-center items-center gap-2 mt-2"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload & Play'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
