'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { createProject, type Project } from '../../lib/api';

type Props = {
  onCreated: (project: Project) => void;
};

export function CreateProjectForm({ onCreated }: Props) {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const project = await createProject(projectName.trim());
      onCreated(project);
      setProjectName('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white">New CaptionForge Project</h2>
      <Input
        value={projectName}
        onChange={(event) => setProjectName(event.currentTarget.value)}
        placeholder="Project name"
      />
      <Button type="submit" disabled={!projectName.trim() || loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </Button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
