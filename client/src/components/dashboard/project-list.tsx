'use client';

import type { Project } from '../../lib/api';

type ProjectListProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
};

export function ProjectList({ projects, selectedProjectId, onSelect }: ProjectListProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Recent Projects</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-white/60">No projects yet. Create one to start.</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => {
            const active = selectedProjectId === project.id;
            return (
              <li
                key={project.id}
                className={`rounded-xl border p-3 ${
                  active ? 'border-sky-400 bg-sky-500/15' : 'border-white/10'
                }`}>
                <button
                  type="button"
                  className="w-full text-left flex items-center justify-between text-white/90 hover:text-white"
                  onClick={() => onSelect(project.id)}>
                  <span>{project.title}</span>
                  <small className="text-xs text-white/50">{new Date(project.created_at).toLocaleString()}</small>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
