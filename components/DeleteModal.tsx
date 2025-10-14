import React, { useState, useEffect } from 'react';
import { DrillHole } from '../types';
import Modal from './Modal';
import { TrashIcon } from './icons';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    drillHoles: DrillHole[];
    onDelete: (selectedUuids: string[]) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, drillHoles, onDelete }) => {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setSelected([]);
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

    const handleDeleteClick = () => {
        onDelete(selected);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Drillhole Data">
            <div className="space-y-4">
                <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                    <h3 className="font-bold">Warning</h3>
                    <p className="text-sm">You are about to permanently delete drillhole data. This action cannot be undone.</p>
                </div>
                <p className="text-sm text-slate-600">Select the drillholes you want to permanently delete.</p>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                            <tr>
                                <th scope="col" className="p-2">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                        checked={allSelected}
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
                                    <td colSpan={3} className="text-center p-8 text-slate-500">No drillholes to delete.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                    <button 
                        onClick={handleDeleteClick}
                        disabled={selected.length === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="w-4 h-4" /> Delete {selected.length > 0 ? selected.length : ''} {selected.length === 1 ? 'Hole' : 'Holes'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteModal;
