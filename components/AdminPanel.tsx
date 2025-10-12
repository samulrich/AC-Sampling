import React, { useState } from 'react';
import { Standard, Blank, Project, Sampler } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface AdminPanelProps {
    standards: Standard[];
    setStandards: React.Dispatch<React.SetStateAction<Standard[]>>;
    blanks: Blank[];
    setBlanks: React.Dispatch<React.SetStateAction<Blank[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    samplers: Sampler[];
    setSamplers: React.Dispatch<React.SetStateAction<Sampler[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ standards, setStandards, blanks, setBlanks, projects, setProjects, samplers, setSamplers }) => {
    return (
        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 flex-grow">
            <ProjectAdmin
                projects={projects}
                setProjects={setProjects}
            />
            <MaterialAdmin
                title="Standards"
                items={standards}
                setItems={setStandards}
                placeholder="e.g., OREAS-25c"
            />
            <MaterialAdmin
                title="Blanks"
                items={blanks}
                setItems={setBlanks}
                placeholder="e.g., Silica Blank"
            />
            <MaterialAdmin
                title="Samplers"
                items={samplers}
                setItems={setSamplers}
                placeholder="e.g., Sam Ulrich"
            />
        </main>
    );
};

// Generic component for Standards and Blanks
interface MaterialAdminProps {
    title: string;
    items: { uuid: string, name: string }[];
    setItems: React.Dispatch<React.SetStateAction<{ uuid: string, name: string }[]>>;
    placeholder: string;
}

const MaterialAdmin: React.FC<MaterialAdminProps> = ({ title, items, setItems, placeholder }) => {
    const [newItemName, setNewItemName] = useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim()) {
            setItems(prev => [...prev, { uuid: crypto.randomUUID(), name: newItemName.trim() }]);
            setNewItemName('');
        }
    };

    const handleDeleteItem = (uuid: string) => {
        setItems(prev => prev.filter(item => item.uuid !== uuid));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">{title}</h2>
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={placeholder}
                    className="flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
                <button type="submit" className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                    <PlusIcon /> Add
                </button>
            </form>
            <div className="flex-grow overflow-y-auto border rounded-md">
                {items.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {items.map(item => (
                            <li key={item.uuid} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                                <span className="font-medium text-slate-800">{item.name}</span>
                                <button
                                    onClick={() => handleDeleteItem(item.uuid)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                    aria-label={`Delete ${item.name}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center p-8 text-slate-500">No {title.toLowerCase()} defined.</p>
                )}
            </div>
        </div>
    );
};

// Component for Projects
interface ProjectAdminProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectAdmin: React.FC<ProjectAdminProps> = ({ projects, setProjects }) => {
    const [newCode, setNewCode] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCode.trim() && newDescription.trim()) {
            setProjects(prev => [...prev, { uuid: crypto.randomUUID(), code: newCode.trim(), description: newDescription.trim() }]);
            setNewCode('');
            setNewDescription('');
        }
    };

    const handleDeleteItem = (uuid: string) => {
        setProjects(prev => prev.filter(p => p.uuid !== uuid));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Projects</h2>
            <form onSubmit={handleAddItem} className="space-y-3 mb-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="Project Code (e.g., REB)"
                        className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        required
                    />
                    <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description (e.g., Rebecca)"
                        className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        required
                    />
                </div>
                <button type="submit" className="w-full flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                    <PlusIcon /> Add Project
                </button>
            </form>
            <div className="flex-grow overflow-y-auto border rounded-md">
                {projects.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {projects.map(item => (
                            <li key={item.uuid} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                                <div>
                                    <span className="font-bold text-slate-800">{item.code}</span>
                                    <span className="ml-2 text-slate-600">{item.description}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteItem(item.uuid)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                    aria-label={`Delete ${item.code}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center p-8 text-slate-500">No projects defined.</p>
                )}
            </div>
        </div>
    );
};


export default AdminPanel;