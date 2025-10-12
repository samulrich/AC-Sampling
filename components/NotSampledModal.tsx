import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface NotSampledModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (from: number, to: number) => void;
    maxDepth: number;
}

const NotSampledModal: React.FC<NotSampledModalProps> = ({ isOpen, onClose, onSubmit, maxDepth }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFrom('');
            setTo('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const fromNum = parseFloat(from);
        const toNum = parseFloat(to);

        if (isNaN(fromNum) || isNaN(toNum)) {
            setError('Please enter valid numbers for From and To.');
            return;
        }
        if (fromNum < 0) {
            setError("'From' depth cannot be negative.");
            return;
        }
        if (toNum > maxDepth) {
            setError(`'To' depth cannot exceed the total hole depth of ${maxDepth}m.`);
            return;
        }
        if (fromNum >= toNum) {
            setError("'From' depth must be less than 'To' depth.");
            return;
        }

        onSubmit(fromNum, toNum);
        onClose();
    };

    const baseInputClasses = "mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none sm:text-sm";
    const validClasses = "bg-white border-slate-300 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500";
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Not Sampled Interval">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-sm text-slate-600">
                    Define an interval that was not sampled. This will remove or adjust any primary samples within this range.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="from-depth" className="block text-sm font-medium text-slate-700">From (m)</label>
                        <input
                            type="number"
                            id="from-depth"
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className={`${baseInputClasses} ${validClasses}`}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="to-depth" className="block text-sm font-medium text-slate-700">To (m)</label>
                        <input
                            type="number"
                            id="to-depth"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className={`${baseInputClasses} ${validClasses}`}
                            step="0.01"
                            required
                        />
                    </div>
                </div>

                {error && 
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                }

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                    <button 
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                        Add Interval
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default NotSampledModal;