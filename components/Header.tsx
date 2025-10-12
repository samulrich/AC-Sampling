import React from 'react';
import { DrillHole } from '../types';
import { PlusIcon, DownloadIcon } from './icons';

interface HeaderProps {
    view: 'logger' | 'admin';
    setView: (view: 'logger' | 'admin') => void;
    drillHoles: DrillHole[];
    activeHoleUuid: string | null;
    onSelectHole: (uuid: string) => void;
    onAddHole: () => void;
    onOpenExportModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, setView, drillHoles, activeHoleUuid, onSelectHole, onAddHole, onOpenExportModal }) => {
    return (
        <header className="mb-8 flex-shrink-0">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight">AC Drillhole Sampling</h1>
                    <p className="text-slate-500 mt-1">A simple, graphical tool for logging drill samples.</p>
                </div>
                <div className="flex items-center gap-4">
                     {/* View Toggles */}
                    <div className="flex rounded-md shadow-sm bg-white p-1">
                        <button
                            onClick={() => setView('logger')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'logger' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            Logger
                        </button>
                        <button
                            onClick={() => setView('admin')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'admin' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            Admin
                        </button>
                    </div>
                </div>
            </div>
           
            {view === 'logger' && (
                 <div className="mt-6 flex items-center gap-4 p-3 bg-white/50 rounded-lg border border-slate-200">
                    <label htmlFor="hole-select" className="text-sm font-bold text-slate-600">Active Drillhole:</label>
                    <select
                        id="hole-select"
                        value={activeHoleUuid || ''}
                        onChange={(e) => onSelectHole(e.target.value)}
                        className="block w-48 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    >
                        {drillHoles.map(hole => (
                            <option key={hole.uuid} value={hole.uuid}>{hole.holeId}</option>
                        ))}
                    </select>
                    <button
                        onClick={onAddHole}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                       <PlusIcon /> Add New Hole
                    </button>
                    <div className="ml-auto">
                        <button
                            onClick={onOpenExportModal}
                            disabled={drillHoles.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
                        >
                        <DownloadIcon /> Export Data
                        </button>
                    </div>
                 </div>
            )}
        </header>
    );
};

export default Header;