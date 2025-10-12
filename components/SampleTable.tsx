import React from 'react';
import { Sample, SampleType } from '../types';

interface SampleTableProps {
  samples: Sample[];
  selectedSampleUuids: string[];
  onToggleSelection: (uuid: string) => void;
  onSelectAll: (select: boolean) => void;
}

const SampleTable: React.FC<SampleTableProps> = ({ samples, selectedSampleUuids, onToggleSelection, onSelectAll }) => {
  const typeBadgeClasses: { [key in SampleType]: string } = {
    [SampleType.Primary]: 'bg-sky-100 text-sky-800',
    [SampleType.Duplicate]: 'bg-green-100 text-green-800',
    [SampleType.Standard]: 'bg-yellow-100 text-yellow-800',
    [SampleType.Blank]: 'bg-slate-100 text-slate-800',
    [SampleType.NotSampled]: 'bg-gray-200 text-gray-800',
  };

  const allSelected = samples.length > 0 && selectedSampleUuids.length === samples.length;
  const isIndeterminate = selectedSampleUuids.length > 0 && selectedSampleUuids.length < samples.length;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-lg font-bold text-slate-700 mb-4">Sample Log Table</h2>
      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
            <tr>
              <th scope="col" className="p-4">
                <div className="flex items-center">
                  <input
                    id="checkbox-all"
                    type="checkbox"
                    className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                    checked={allSelected}
                    // Fix: The ref callback should not return a value. Wrapped in braces to prevent implicit return.
                    ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                  <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                </div>
              </th>
              <th scope="col" className="px-3 py-3">Sample ID</th>
              <th scope="col" className="px-3 py-3">From (m)</th>
              <th scope="col" className="px-3 py-3">To (m)</th>
              <th scope="col" className="px-3 py-3">Length (m)</th>
              <th scope="col" className="px-3 py-3">Category</th>
              <th scope="col" className="px-3 py-3">PSample ID</th>
              <th scope="col" className="px-3 py-3">Sample Type</th>
              <th scope="col" className="px-3 py-3">Sample Method</th>
              <th scope="col" className="px-3 py-3">Std/Blk ID</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample) => (
              <tr
                key={sample.uuid}
                onClick={() => onToggleSelection(sample.uuid)}
                className={`border-b hover:bg-slate-100 cursor-pointer transition-colors ${selectedSampleUuids.includes(sample.uuid) ? 'bg-sky-50' : 'bg-white'}`}
              >
                <td className="w-4 p-4">
                  <div className="flex items-center">
                    <input
                      id={`checkbox-${sample.uuid}`}
                      type="checkbox"
                      className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                      checked={selectedSampleUuids.includes(sample.uuid)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelection(sample.uuid);
                      }}
                    />
                    <label htmlFor={`checkbox-${sample.uuid}`} className="sr-only">checkbox</label>
                  </div>
                </td>
                <th scope="row" className="px-3 py-4 font-medium text-slate-900 whitespace-nowrap">
                  {sample.id || '-'}
                </th>
                <td className="px-3 py-4">{sample.from.toFixed(2)}</td>
                <td className="px-3 py-4">{sample.to.toFixed(2)}</td>
                <td className="px-3 py-4">{(sample.to - sample.from).toFixed(2)}</td>
                <td className="px-3 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeBadgeClasses[sample.type]}`}>
                    {sample.type}
                  </span>
                </td>
                <td className="px-3 py-4">{sample.pSampleId || '-'}</td>
                <td className="px-3 py-4">{sample.sampleType || '-'}</td>
                <td className="px-3 py-4">{sample.sampleMethod || '-'}</td>
                <td className="px-3 py-4">{sample.materialName || '-'}</td>
              </tr>
            ))}
             {samples.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  No samples generated. Use the controls to create samples.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SampleTable;