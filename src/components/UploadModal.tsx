import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

export function UploadModal({ onClose, onUploadComplete }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('game', file);
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
        console.error('Upload failed');
      }
    } catch (err) {
      console.error(err);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-sm font-medium text-zinc-200 tracking-wide flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-zinc-400" />
              Upload Game
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1.5 tracking-wider uppercase">
                Game Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                placeholder="Name your game"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1.5 tracking-wider uppercase">
                Game File (.swf or .html)
              </label>
              <input
                type="file"
                required
                accept=".swf,.html"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors cursor-pointer text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || !file || !title}
              className="w-full bg-white hover:bg-zinc-200 text-black disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 mt-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
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
