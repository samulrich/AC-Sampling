import React from 'react';
import { Sample, SampleType } from '../types';
import { NoSymbolIcon } from './icons';

interface SampleControlsProps {
  sampleInterval: number;
  setSampleInterval: (interval: number) => void;
  onGenerate: () => void;
  onOpenNotSampledModal: () => void;
  selectedSamples: Sample[];
  isHoleSelected: boolean;
  isHoleInfoComplete: boolean;
  hasPrimarySamples: boolean;
  onApplyQCRules: () => void;
  isAutoQcEnabled: boolean;
}

const SampleControls: React.FC<SampleControlsProps> = ({
  sampleInterval,
  setSampleInterval,
  onGenerate,
  onOpenNotSampledModal,
  selectedSamples,
  isHoleSelected,
  isHoleInfoComplete,
  hasPrimarySamples,
  onApplyQCRules,
  isAutoQcEnabled,
}) => {
  
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
           <button
            onClick={onOpenNotSampledModal}
            disabled={!isHoleSelected}
            className={`${actionButtonClasses} ${isHoleSelected ? 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-600' : disabledButtonClasses}`}
          >
            <NoSymbolIcon /> Add Not Sampled Interval
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4">Automated QC</h2>
        <div className="space-y-3">
           <button
            onClick={onApplyQCRules}
            disabled={!hasPrimarySamples || !isAutoQcEnabled}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${hasPrimarySamples && isAutoQcEnabled ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500' : disabledButtonClasses}`}
            title={!isAutoQcEnabled ? 'Enable Auto QC in the Admin panel to use this feature' : ''}
          >
            Apply Auto QC Rules
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleControls;