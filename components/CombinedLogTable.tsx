import React from 'react';
import { DrillHole, Project, Sampler, CombinedInterval } from '../types';
import { DownloadIcon } from './icons';

interface CombinedLogTableProps {
  activeHole: DrillHole | undefined;
  projects: Project[];
  samplers: Sampler[];
  combinedIntervals: CombinedInterval[];
}

const CombinedLogTable: React.FC<CombinedLogTableProps> = ({ activeHole, projects, samplers, combinedIntervals }) => {
    
    const handleExport = () => {
        if (!activeHole || combinedIntervals.length === 0) return;

        const project = projects.find(p => p.uuid === activeHole.projectUuid);
        const sampler = samplers.find(s => s.uuid === activeHole.samplerUuid);

        const headers = ['Project', 'Hole ID', 'From', 'To', 'Condition', 'Recovery', 'Sampled By', 'Date'];
        const rows = combinedIntervals.map(i => [
            project?.code || '',
            activeHole.holeId,
            i.from.toFixed(2),
            i.to.toFixed(2),
            i.conditionCode,
            i.recoveryCode,
            sampler?.name || '',
            activeHole.sampledDate
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${activeHole.holeId}_condition_recovery_log.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-700">Sample Condition &amp; Recovery Log</h2>
                <button
                    onClick={handleExport}
                    disabled={!activeHole || combinedIntervals.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Export CSV
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-3 py-3">From (m)</th>
                            <th scope="col" className="px-3 py-3">To (m)</th>
                            <th scope="col" className="px-3 py-3">Condition</th>
                            <th scope="col" className="px-3 py-3">Recovery</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinedIntervals.map((interval, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-3 py-2">{interval.from.toFixed(2)}</td>
                                <td className="px-3 py-2">{interval.to.toFixed(2)}</td>
                                <td className="px-3 py-2 font-medium">{interval.conditionCode}</td>
                                <td className="px-3 py-2 font-medium">{interval.recoveryCode}</td>
                            </tr>
                        ))}
                        {combinedIntervals.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-500">
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