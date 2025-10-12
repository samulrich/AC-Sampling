import React from 'react';
import { Sample, SampleType } from '../types';
import { CopyIcon, BeakerIcon, ScissorsIcon, BlankIcon, MergeIcon, TrashIcon, NoSymbolIcon } from './icons';

interface SampleControlsProps {
  sampleInterval: number;
  setSampleInterval: (interval: number) => void;
  onGenerate: () => void;
  onAddDuplicate: () => void;
  onOpenStandardModal: () => void;
  onOpenBlankModal: () => void;
  onOpenNotSampledModal: () => void;
  onSplit: () => void;
  onMerge: () => void;
  onDelete: () => void;
  selectedSamples: Sample[];
  isHoleSelected: boolean;
  isHoleInfoComplete: boolean;
}

const SampleControls: React.FC<SampleControlsProps> = ({
  sampleInterval,
  setSampleInterval,
  onGenerate,
  onAddDuplicate,
  onOpenStandardModal,
  onOpenBlankModal,
  onOpenNotSampledModal,
  onSplit,
  onMerge,
  onDelete,
  selectedSamples,
  isHoleSelected,
  isHoleInfoComplete,
}) => {
  const canDuplicate = selectedSamples.length === 1 && selectedSamples[0].type === SampleType.Primary;
  const canInsert = selectedSamples.length === 1;
  const canSplit = selectedSamples.length > 0 && selectedSamples.every(s => s.type === SampleType.Primary && (s.to - s.from) > 1);
  const canMerge = selectedSamples.length > 1 && selectedSamples.every(s => s.type === SampleType.Primary && (s.to - s.from) === 1);
  const canDelete = selectedSamples.length > 0 && selectedSamples.every(s => s.type !== SampleType.Primary);

  const actionButtonClasses = "flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all";
  const disabledButtonClasses = "bg-slate-400 cursor-not-allowed";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4">Sample Generation</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Primary Sample Interval (m)</label>
            <div className="flex space-x-2">
              {[1, 4].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSampleInterval(interval)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                    sampleInterval === interval
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {interval}m
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onGenerate}
            disabled={!isHoleSelected || !isHoleInfoComplete}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isHoleSelected && isHoleInfoComplete ? 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500' : disabledButtonClasses}`}
          >
            Generate Primary Samples
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4">Actions</h2>
        <div className="space-y-3">
          <p className="text-xs text-center text-slate-500">Select samples to enable actions, or add a non-sampled interval.</p>
           <button
            onClick={onOpenNotSampledModal}
            disabled={!isHoleSelected}
            className={`${actionButtonClasses} ${isHoleSelected ? 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-600' : disabledButtonClasses}`}
          >
            <NoSymbolIcon /> Add Not Sampled Interval
          </button>
          <button
            onClick={onAddDuplicate}
            disabled={!canDuplicate}
            className={`${actionButtonClasses} ${canDuplicate ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : disabledButtonClasses}`}
          >
            <CopyIcon /> Add Duplicate
          </button>
          <button
            onClick={onOpenStandardModal}
            disabled={!canInsert}
            className={`${actionButtonClasses} ${canInsert ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' : disabledButtonClasses}`}
          >
            <BeakerIcon /> Insert Standard
          </button>
          <button
            onClick={onOpenBlankModal}
            disabled={!canInsert}
            className={`${actionButtonClasses} ${canInsert ? 'bg-slate-500 hover:bg-slate-600 focus:ring-slate-500' : disabledButtonClasses}`}
          >
            <BlankIcon /> Insert Blank
          </button>
          <button
            onClick={onSplit}
            disabled={!canSplit}
            className={`${actionButtonClasses} ${canSplit ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : disabledButtonClasses}`}
          >
            <ScissorsIcon /> Split to 1m
          </button>
          <button
            onClick={onMerge}
            disabled={!canMerge}
            className={`${actionButtonClasses} ${canMerge ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : disabledButtonClasses}`}
          >
            <MergeIcon /> Merge 1m Samples
          </button>
           <button
            onClick={onDelete}
            disabled={!canDelete}
            className={`${actionButtonClasses} ${canDelete ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : disabledButtonClasses}`}
          >
            <TrashIcon /> Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleControls;