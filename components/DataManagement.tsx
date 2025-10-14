import React from 'react';
import { TrashIcon } from './icons';

interface DataManagementProps {
    onOpenDeleteModal: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onOpenDeleteModal }) => {
    const buttonClasses = "w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    const enabledClasses = "bg-red-600 hover:bg-red-700 focus:ring-red-500";
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Data Management</h2>
            <div className="space-y-3">
                 <p className="text-xs text-slate-500 pb-2">
                    Permanently delete drillhole data. This action does not affect items in the admin lists (Projects, Standards, etc).
                </p>
                <button
                    onClick={onOpenDeleteModal}
                    className={`${buttonClasses} ${enabledClasses}`}
                    title={'Select drillholes to delete'}
                >
                    <TrashIcon /> Delete Drillholes...
                </button>
            </div>
        </div>
    );
};

export default DataManagement;
