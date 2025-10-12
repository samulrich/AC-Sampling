import React from 'react';
import { DrillHole, Project, Sampler } from '../types';

interface HoleInfoFormProps {
  activeHole: DrillHole | undefined;
  onUpdate: (updatedInfo: Partial<DrillHole>) => void;
  projects: Project[];
  samplers: Sampler[];
}

const HoleInfoForm: React.FC<HoleInfoFormProps> = ({ activeHole, onUpdate, projects, samplers }) => {
  if (!activeHole) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-slate-500">
        <h2 className="text-lg font-bold text-slate-700 mb-2">Drillhole Information</h2>
        <p>No drillhole selected. Please add or select a drillhole.</p>
      </div>
    );
  }

  const { holeId, holeDepth, firstSampleId, projectUuid, samplerUuid, sampledDate } = activeHole;

  const baseInputClasses = "mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none sm:text-sm";
  const invalidClasses = "bg-red-100 border-red-400 focus:ring-red-500 focus:border-red-500 placeholder-red-400";
  const validClasses = "bg-white border-slate-300 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-slate-700 mb-4">Drillhole Information</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-slate-600">Project</label>
            <select
              id="project"
              value={projectUuid || ''}
              onChange={(e) => onUpdate({ projectUuid: e.target.value })}
              className={`${baseInputClasses} ${!projectUuid ? invalidClasses : validClasses}`}
            >
              <option value="">No Project</option>
              {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.code} - {p.description}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="holeId" className="block text-sm font-medium text-slate-600">Hole ID</label>
            <input
              type="text"
              id="holeId"
              value={holeId}
              onChange={(e) => onUpdate({ holeId: e.target.value })}
              className={`${baseInputClasses} ${!holeId.trim() ? invalidClasses : validClasses}`}
            />
          </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sampler" className="block text-sm font-medium text-slate-600">Sampled By</label>
            <select
              id="sampler"
              value={samplerUuid || ''}
              onChange={(e) => onUpdate({ samplerUuid: e.target.value })}
              className={`${baseInputClasses} ${!samplerUuid ? invalidClasses : validClasses}`}
            >
              <option value="">Unknown</option>
              {samplers.map(s => <option key={s.uuid} value={s.uuid}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sampledDate" className="block text-sm font-medium text-slate-600">Sampled Date</label>
            <input
              type="date"
              id="sampledDate"
              value={sampledDate}
              onChange={(e) => onUpdate({ sampledDate: e.target.value })}
              className={`${baseInputClasses} ${!sampledDate ? invalidClasses : validClasses}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="holeDepth" className="block text-sm font-medium text-slate-600">Total Depth (m)</label>
            <input
              type="number"
              id="holeDepth"
              value={holeDepth}
              min={0}
              onChange={(e) => onUpdate({ holeDepth: Number(e.target.value)})}
              className={`${baseInputClasses} ${holeDepth <= 0 ? invalidClasses : validClasses}`}
            />
          </div>
          <div>
            <label htmlFor="firstSampleId" className="block text-sm font-medium text-slate-600">First Sample ID</label>
            <input
              type="text"
              id="firstSampleId"
              value={firstSampleId}
              onChange={(e) => onUpdate({ firstSampleId: e.target.value })}
              className={`${baseInputClasses} ${!firstSampleId.trim() ? invalidClasses : validClasses}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoleInfoForm;