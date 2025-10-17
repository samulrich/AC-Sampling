import React from 'react';
import { DrillHole, Project, Sampler, CombinedInterval } from '../types';

interface CombinedLogTableProps {
  activeHole: DrillHole | undefined;
  projects: Project[];
  samplers: Sampler[];
  combinedIntervals: CombinedInterval[];
}

const CombinedLogTable: React.FC<CombinedLogTableProps> = ({ activeHole, projects, samplers, combinedIntervals }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-700">Sample Condition &amp; Recovery Log</h2>
            </div>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-3 py-3">From (m)</th>
                            <th scope="col" className="px-3 py-3">To (m)</th>
                            <th scope="col" className="px-3 py-3">Condition</th>
                            <th scope="col" className="px-3 py-3">Recovery</th>
                            <th scope="col" className="px-3 py-3">Contamination</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinedIntervals.map((interval, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-3 py-2">{interval.from.toFixed(2)}</td>
                                <td className="px-3 py-2">{interval.to.toFixed(2)}</td>
                                <td className="px-3 py-2 font-medium">{interval.conditionCode}</td>
                                <td className="px-3 py-2 font-medium">{interval.recoveryCode}</td>
                                <td className="px-3 py-2 font-medium">{interval.isContaminated ? 'Yes' : 'No'}</td>
                            </tr>
                        ))}
                        {combinedIntervals.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-500">
                                    No Condition or Recovery data logged.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CombinedLogTable;