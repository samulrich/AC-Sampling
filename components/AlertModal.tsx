import React from 'react';
import Modal from './Modal';
import { NoSymbolIcon } from './icons';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-amber-500 mt-0.5">
                        <NoSymbolIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-slate-600">{message}</p>
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                        OK
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AlertModal;
