'use client';

import { useEffect, useState } from 'react';
import { CreateProjectForm } from '../../components/dashboard/create-project-form';
import { ProjectList } from '../../components/dashboard/project-list';
import { UploadBox } from '../../components/dashboard/upload-box';
import { listProjects, type Project } from '../../lib/api';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await listProjects();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId((id) => id || data[0].id);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    setSelectedProjectId(project.id);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleUploadSuccess = (filename: string) => {
    console.log('[DashboardPage] uploaded', filename, 'for project', selectedProjectId);
  };

  const handleGenerateCompleted = (projectId: string, subtitlePath: string | null) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          subtitle_path: subtitlePath ?? p.subtitle_path,
          status: 'subtitles_ready',
        };
      })
    );
  };

  return (
    <main className='min-h-screen bg-[#050608] px-6 py-12'>
      <div className='mx-auto grid max-w-7xl gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-6'>
          <UploadBox
            projectId={selectedProjectId}
            onUploaded={handleUploadSuccess}
            onGenerate={(projectId, subtitlePath) => {
              console.log('[DashboardPage] subtitles generated', projectId, subtitlePath);
              handleGenerateCompleted(projectId, subtitlePath);
            }}
          />
          {error && <p className='text-sm text-red-300'>{error}</p>}
          <ProjectList projects={projects} selectedProjectId={selectedProjectId} onSelect={handleProjectSelect} />
          {loading && <p className='text-sm text-white/60'>Loading projects...</p>}
        </div>

        <aside>
          <CreateProjectForm onCreated={handleProjectCreated} />
        </aside>
      </div>
    </main>
  );
}
