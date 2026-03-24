'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { getProject, generateSubtitles, getSubtitleDownloadUrl, Project, SubtitleSegment } from '@/lib/api';

interface DashboardProjectPageProps {
  params: { projectId: string };
}

export default function DashboardProjectPage({ params }: DashboardProjectPageProps) {
  const projectId = params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitleSegments, setSubtitleSegments] = useState<SubtitleSegment[]>([]);

  useEffect(() => {
    if (!projectId) {
      notFound();
      return;
    }

    setLoading(true);
    getProject(projectId)
      .then((projectData) => {
        setProject(projectData);
        if (projectData.subtitle_segments) {
          setSubtitleSegments(projectData.subtitle_segments);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load project'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const subtitlesReady = useMemo(() => subtitleSegments.length > 0, [subtitleSegments]);

  const handleGenerateSubtitles = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await generateSubtitles(projectId);
      setSubtitleSegments(result.subtitle_segments || []);
      setProject((prev) => prev ? { ...prev, subtitle_path: result.subtitle_path, status: 'subtitles_ready', subtitle_segments: result.subtitle_segments } : prev);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Subtitle generation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    notFound();
  }

  return (
    <main className='min-h-screen bg-[#050608] px-6 py-12'>
      <div className='mx-auto max-w-5xl rounded-2xl border border-white/15 bg-white/5 p-8'>
        <h1 className='text-2xl font-semibold text-white'>Project {projectId}</h1>
        <p className='mt-2 text-sm text-white/60'>Subtitle generation details for this project.</p>

        {error && <p className='mt-4 text-sm text-red-300'>{error}</p>}

        <div className='mt-6 flex flex-wrap items-center gap-3'>
          <button
            className='rounded-xl border border-cyan-500 bg-cyan-500/15 px-4 py-2 text-sm text-white transition hover:bg-cyan-500/30 disabled:opacity-50'
            disabled={loading}
            onClick={handleGenerateSubtitles}
          >
            {loading ? 'Generating...' : 'Generate Subtitles'}
          </button>

          {subtitlesReady && (
            <a
              href={getSubtitleDownloadUrl(projectId)}
              className='rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10'
              download
            >
              Download SRT
            </a>
          )}
        </div>

        <div className='mt-8'>
          <h3 className='text-lg font-semibold text-white'>Subtitle Segments</h3>
          {subtitleSegments.length === 0 ? (
            <p className='mt-2 text-sm text-white/60'>No subtitle segments generated yet.</p>
          ) : (
            <div className='mt-4 divide-y divide-white/10 rounded-xl border border-white/10 bg-black/20'>
              {subtitleSegments.map((segment) => (
                <div key={segment.index} className='px-4 py-3'>
                  <p className='text-xs text-cyan-300'>#{segment.index}</p>
                  <p className='text-sm font-medium text-white'>
                    {new Date(segment.start * 1000).toISOString().substr(11, 12)} - {new Date(segment.end * 1000).toISOString().substr(11, 12)}
                  </p>
                  <p className='mt-1 text-sm text-white/80'>{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

