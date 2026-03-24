'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { uploadVideo, generateSubtitles, getSubtitleDownloadUrl, fetchSubtitleText, burnSubtitlesIntoVideo, updateSubtitleText, getBurnedVideoDownloadUrl } from '@/lib/api';

type UploadBoxProps = {
  projectId: string | null;
  onUploaded: (filename: string) => void;
  onGenerate?: (projectId: string, subtitlePath: string | null) => void;
};

export function UploadBox({ projectId, onUploaded, onGenerate }: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [burnedVideoUrl, setBurnedVideoUrl] = useState<string | null>(null);
  const [burnLoading, setBurnLoading] = useState(false);
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [editedSubtitleText, setEditedSubtitleText] = useState<string>('');
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [bulkApplyLoading, setBulkApplyLoading] = useState(false);

  const handleChooseFile = () => {
    console.log('[UploadBox] Choose File clicked');
    if (!projectId) {
      setMessage('Select or create a project first');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('[UploadBox] selected file:', file);
    console.log('[UploadBox] projectId:', projectId);

    if (!file) return;
    if (!projectId) {
      setMessage('Please select a project before uploading');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await uploadVideo(projectId, file);
      console.log('[UploadBox] upload response:', response);
      setMessage(`Uploaded ${response.filename}`);
      onUploaded(response.filename);
    } catch (error) {
      console.error('[UploadBox] upload error:', error);
      setMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerate = async () => {
    if (!projectId) {
      setMessage('Select or create a project first');
      return;
    }

    setGenerateLoading(true);
    setMessage(null);

    try {
      const result = await generateSubtitles(projectId);
      const downloadUrl = getSubtitleDownloadUrl(projectId);
      setSubtitleUrl(downloadUrl);
      setEditedSubtitleText('');
      setSubtitleText('');
      setIsEditing(false);
      setMessage(`Subtitles generated (${result.subtitle_segments.length} segments)`);
      onGenerate?.(projectId, result.subtitle_path);
    } catch (error) {
      console.error('[UploadBox] generate error:', error);
      setMessage(error instanceof Error ? error.message : 'Subtitle generation failed');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleEditSubtitles = async () => {
    if (!projectId) {
      setMessage('Select or create a project first');
      return;
    }

    if (!subtitleUrl) {
      setMessage('Generate subtitles first');
      return;
    }

    setEditLoading(true);
    setMessage(null);

    try {
      const text = await fetchSubtitleText(projectId);
      setSubtitleText(text);
      setEditedSubtitleText(text);
      setIsEditing(true);
      setMessage('Loaded subtitles for editing.');
    } catch (error) {
      console.error('[UploadBox] edit fetch error:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to load subtitle text');
    } finally {
      setEditLoading(false);
    }
  };

  const handleBulkCorrection = async () => {
    if (!projectId) {
      setMessage('Select or create a project first');
      return;
    }

    if (!isEditing) {
      setMessage('Open subtitle editor first to apply bulk correction');
      return;
    }

    if (!findText) {
      setMessage('Please enter text to find');
      return;
    }

    const original = editedSubtitleText || subtitleText;
    if (!original) {
      setMessage('No subtitles loaded for bulk correction.');
      return;
    }

    if (!original.includes(findText)) {
      setMessage(`Text '${findText}' not found in subtitles.`);
      return;
    }

    console.log('[DEBUG] Original subtitle text before bulk replace:', original);
    const corrected = original.replaceAll(findText, replaceText);
    console.log('[DEBUG] Corrected subtitle text after bulk replace:', corrected);
    setBulkApplyLoading(true);
    setMessage(null);

    try {
      console.log('[DEBUG] Payload being sent to backend:', { subtitle_text: corrected });
      await updateSubtitleText(projectId, corrected);
      setEditedSubtitleText(corrected);
      setSubtitleText(corrected);
      setMessage(`Bulk correction applied: '${findText}' → '${replaceText}'`);
    } catch (error) {
      console.error('[UploadBox] bulk correction error:', error);
      setMessage(error instanceof Error ? error.message : 'Bulk correction failed');
    } finally {
      setBulkApplyLoading(false);
    }
  };


  const handleDownloadEditedSubtitles = () => {
    const content = editedSubtitleText || subtitleText;
    if (!content) {
      setMessage('No subtitle text available to download.');
      return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectId ?? 'subtitle'}-edited.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage('Edited SRT downloaded.');
  };

  const handleBurnVideo = async () => {
    if (!projectId) {
      setMessage('Select or create a project first');
      return;
    }

    if (!subtitleUrl && !subtitleText && !editedSubtitleText) {
      setMessage('Please generate and/or edit subtitles before burning.');
      return;
    }

    setBurnLoading(true);
    setMessage(null);

    try {
      const payloadText = editedSubtitleText || subtitleText;
      const result = await burnSubtitlesIntoVideo(projectId, payloadText);
      const downloadUrl = getBurnedVideoDownloadUrl(projectId);
      setBurnedVideoUrl(downloadUrl);
      setMessage('Burned video ready.');
      setIsEditing(false);
      onGenerate?.(projectId, subtitleUrl); // update status in dashboard if needed
    } catch (error) {
      console.error('[UploadBox] burn video error:', error);
      setMessage(error instanceof Error ? error.message : 'Burn subtitles failed');
    } finally {
      setBurnLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
      <h2 className="mb-3 text-lg font-semibold text-white">Video Upload</h2>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-black/20 p-4">
        <UploadCloud className="h-5 w-5 text-white/70" />
        <span className="text-sm text-white/60">Upload a video to the selected project.</span>
        <Button type="button" variant="secondary" className="ml-auto" onClick={handleChooseFile} disabled={loading}>
          {loading ? 'Uploading...' : 'Choose File'}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={handleGenerate}
          disabled={!projectId || generateLoading}
        >
          {generateLoading ? 'Generating...' : 'Generate Subtitles'}
        </Button>

        {subtitleUrl && (
          <>
            <a
              href={subtitleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              Download SRT
            </a>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEditSubtitles}
              disabled={editLoading}
            >
              {editLoading ? 'Loading...' : 'Edit Subtitles'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleBurnVideo}
              disabled={burnLoading}
            >
              {burnLoading ? 'Burning...' : 'Burn onto video'}
            </Button>
          </>
        )}
      </div>

      {burnedVideoUrl && (
        <div className="mt-3">
          <a
            href={burnedVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Download Burned Video
          </a>
        </div>
      )}

      {isEditing && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <h3 className="mb-2 text-sm font-medium text-white">Edit Subtitles</h3>
          <textarea
            className="w-full min-h-[180px] resize-y rounded border border-white/20 bg-black/90 p-2 text-xs text-white outline-none"
            value={editedSubtitleText}
            onChange={(event) => setEditedSubtitleText(event.target.value)}
          />
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Find"
              value={findText}
              onChange={(event) => setFindText(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/80 px-2 py-1 text-xs text-white outline-none"
            />
            <input
              type="text"
              placeholder="Replace with"
              value={replaceText}
              onChange={(event) => setReplaceText(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/80 px-2 py-1 text-xs text-white outline-none"
            />
          </div>
          <div className="mb-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={handleBulkCorrection} disabled={bulkApplyLoading}>
              {bulkApplyLoading ? 'Applying...' : 'Apply Bulk Correction'}
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={handleDownloadEditedSubtitles}>
              Download Edited SRT
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              Close Editor
            </Button>
          </div>
        </div>
      )}

      {message && <p className="mt-2 text-sm text-white/70">{message}</p>}
    </div>
  );
}

