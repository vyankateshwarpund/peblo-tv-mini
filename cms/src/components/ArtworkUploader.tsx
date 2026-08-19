import React, { useState } from 'react';
import { Artwork } from '../types';
import { api, getMediaUrl } from '../api/client';
import { UploadCloud, CheckCircle, AlertTriangle, Trash2, Image as ImageIcon } from 'lucide-react';

interface SlotProps {
  type: 'poster' | 'banner' | 'thumbnail';
  label: string;
  specs: string;
  aspectClass: string;
  currentArtwork?: Artwork;
  episodeId: number;
  onSuccess: () => void;
}

const ArtworkSlot: React.FC<SlotProps> = ({
  type,
  label,
  specs,
  aspectClass,
  currentArtwork,
  episodeId,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);

    // UX Pre-check
    if (file.size > 200 * 1024) {
      setError(`File size is ${(file.size / 1024).toFixed(1)} KB. Maximum allowed is 200 KB.`);
      return;
    }

    setUploading(true);
    try {
      await api.uploadArtwork(episodeId, type, file);
      setSuccessMsg('Uploaded successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
      onSuccess();
    } catch (err: any) {
      const msg = err.data?.detail?.message || err.message || 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentArtwork || !confirm(`Delete ${type} artwork?`)) return;
    try {
      await api.deleteArtwork(currentArtwork.id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to delete artwork');
    }
  };

  const previewUrl = currentArtwork ? getMediaUrl(currentArtwork.url) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 uppercase tracking-wider text-sm">{label}</span>
            {currentArtwork ? (
              <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Attached
              </span>
            ) : (
              <span className="text-amber-400 bg-amber-950/80 border border-amber-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Missing
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-mono">{specs}</span>
        </div>

        {/* Preview Frame */}
        <div className={`w-full ${aspectClass} bg-slate-950 rounded-lg overflow-hidden relative border border-slate-800 flex items-center justify-center mb-3`}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-600">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">No artwork</span>
            </div>
          )}

          {currentArtwork && (
            <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur text-[10px] text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {currentArtwork.width}x{currentArtwork.height} · {(currentArtwork.file_size / 1024).toFixed(0)}KB
            </div>
          )}
        </div>

        {error && (
          <div className="p-2.5 mb-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 mb-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
        <label className={`flex-1 cursor-pointer py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
          uploading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-brand-600 hover:bg-brand-500 text-white'
        }`}>
          <UploadCloud className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : currentArtwork ? 'Replace' : 'Upload'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>

        {currentArtwork && (
          <button
            onClick={handleDelete}
            title="Delete artwork"
            className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const ArtworkUploader: React.FC<{
  episodeId: number;
  artworks: Artwork[];
  onArtworkUpdated: () => void;
}> = ({ episodeId, artworks, onArtworkUpdated }) => {
  const poster = artworks.find((a) => a.artwork_type === 'poster');
  const banner = artworks.find((a) => a.artwork_type === 'banner');
  const thumbnail = artworks.find((a) => a.artwork_type === 'thumbnail');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ArtworkSlot
        type="poster"
        label="Poster"
        specs="2:3 (600x900, max 200KB)"
        aspectClass="aspect-[2/3]"
        currentArtwork={poster}
        episodeId={episodeId}
        onSuccess={onArtworkUpdated}
      />
      <ArtworkSlot
        type="banner"
        label="Banner"
        specs="16:9 (1280x720, max 200KB)"
        aspectClass="aspect-video"
        currentArtwork={banner}
        episodeId={episodeId}
        onSuccess={onArtworkUpdated}
      />
      <ArtworkSlot
        type="thumbnail"
        label="Thumbnail"
        specs="16:9 (640x360, max 200KB)"
        aspectClass="aspect-video"
        currentArtwork={thumbnail}
        episodeId={episodeId}
        onSuccess={onArtworkUpdated}
      />
    </div>
  );
};
