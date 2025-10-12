import React, { useState, useEffect } from 'react';
import { DrillHole } from '../types';
import Modal from './Modal';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    drillHoles: DrillHole[];
    onExport: (selectedUuids: string[]) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, drillHoles, onExport }) => {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setSelected([]); // Reset selection on close
        }
    }, [isOpen]);

    const handleToggle = (uuid: string) => {
        setSelected(prev => prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]);
    };
    
    const handleSelectAll = (isChecked: boolean) => {
        setSelected(isChecked ? drillHoles.map(h => h.uuid) : []);
    };
    
    const allSelected = drillHoles.length > 0 && selected.length === drillHoles.length;
    const isIndeterminate = selected.length > 0 && selected.length < drillHoles.length;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Drillhole Data">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Select the drillholes you want to include in the CSV export.</p>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                            <tr>
                                <th scope="col" className="p-2">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                        checked={allSelected}
                                        // Fix: The ref callback should not return a value. Wrapped in braces to prevent implicit return.
                                        ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        aria-label="Select all drillholes"
                                    />
                                </th>
                                <th scope="col" className="px-3 py-2">Hole ID</th>
                                <th scope="col" className="px-3 py-2">Sample Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drillHoles.map(hole => (
                                <tr key={hole.uuid} className="border-b hover:bg-slate-50">
                                    <td className="p-2">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                                            checked={selected.includes(hole.uuid)}
                                            onChange={() => handleToggle(hole.uuid)}
                                            aria-labelledby={`hole-id-${hole.uuid}`}
                                        />
                                    </td>
                                    <td id={`hole-id-${hole.uuid}`} className="px-3 py-2 font-medium text-slate-800 cursor-pointer" onClick={() => handleToggle(hole.uuid)}>
                                        {hole.holeId || <span className="italic text-slate-400">Untitled Hole</span>}
                                    </td>
                                    <td className="px-3 py-2 text-slate-500 cursor-pointer" onClick={() => handleToggle(hole.uuid)}>{hole.samples.length}</td>
                                </tr>
                            ))}
                             {drillHoles.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center p-8 text-slate-500">No drillholes to export.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                    <button 
                        onClick={() => onExport(selected)}
                        disabled={selected.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Export {selected.length > 0 ? selected.length : ''} {selected.length === 1 ? 'Hole' : 'Holes'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportModal;