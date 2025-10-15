import React, { useState } from 'react';
import { Standard, Blank, Project, Sampler, QCConfig, QCRate, QCRule, QCTrigger } from '../types';
import { PlusIcon, TrashIcon } from './icons';
import DataManagement from './DataManagement';
import InstructionsPanel from './InstructionsPanel';

interface AdminPanelProps {
    standards: Standard[];
    setStandards: React.Dispatch<React.SetStateAction<Standard[]>>;
    blanks: Blank[];
    setBlanks: React.Dispatch<React.SetStateAction<Blank[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    samplers: Sampler[];
    setSamplers: React.Dispatch<React.SetStateAction<Sampler[]>>;
    qcConfig: QCConfig;
    setQcConfig: React.Dispatch<React.SetStateAction<QCConfig>>;
    onOpenDeleteModal: () => void;
    isAutoQcEnabled: boolean;
    setIsAutoQcEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

type AdminTab = 'qc' | 'setup' | 'instructions' | 'data';

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('instructions');

    const TabButton = ({ tab, label }: { tab: AdminTab; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-sky-600 text-white' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
            {label}
        </button>
    );

    return (
        <main className="flex-grow flex flex-col min-h-0">
            <div className="flex-shrink-0 mb-6 flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg self-start">
                <TabButton tab="instructions" label="Instructions" />
                <TabButton tab="qc" label="Auto QC Rules" />
                <TabButton tab="setup" label="Project Setup" />
                <TabButton tab="data" label="Data Management" />
            </div>
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'instructions' && <InstructionsPanel />}
                {activeTab === 'qc' && <QCAdmin qcConfig={props.qcConfig} setQcConfig={props.setQcConfig} isAutoQcEnabled={props.isAutoQcEnabled} setIsAutoQcEnabled={props.setIsAutoQcEnabled} />}
                {activeTab === 'setup' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                        <ProjectAdmin projects={props.projects} setProjects={props.setProjects} />
                        <MaterialAdmin title="Samplers" items={props.samplers} setItems={props.setSamplers} placeholder="e.g., Sam Ulrich" />
                        <MaterialAdmin title="Standards" items={props.standards} setItems={props.setStandards} placeholder="e.g., OREAS-25c" />
                        <MaterialAdmin title="Blanks" items={props.blanks} setItems={props.setBlanks} placeholder="e.g., Silica Blank" />
                    </div>
                )}
                {activeTab === 'data' && (
                    <div className="max-w-2xl">
                         <DataManagement onOpenDeleteModal={props.onOpenDeleteModal} />
                    </div>
                )}
            </div>
        </main>
    );
};

// QC Admin Component
interface QCAdminProps {
    qcConfig: QCConfig;
    setQcConfig: React.Dispatch<React.SetStateAction<QCConfig>>;
    isAutoQcEnabled: boolean;
    setIsAutoQcEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const QCAdmin: React.FC<QCAdminProps> = ({ qcConfig, setQcConfig, isAutoQcEnabled, setIsAutoQcEnabled }) => {
    const handleUpdateRule = (qcType: 'standard' | 'blank' | 'duplicate', newRule: QCRule) => {
        setQcConfig(prev => ({ ...prev, [qcType]: newRule }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-700">Automated Quality Control Configuration</h2>
                     <p className="text-sm text-slate-500 mt-2">Define rules to automatically insert specific QC samples based on the last two digits of a sample's ID.</p>
                </div>
                <label htmlFor="auto-qc-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-3 text-sm font-medium text-slate-700">Enable Auto QC</span>
                    <div className="relative">
                        <input type="checkbox" id="auto-qc-toggle" className="sr-only" checked={isAutoQcEnabled} onChange={e => setIsAutoQcEnabled(e.target.checked)} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${isAutoQcEnabled ? 'bg-sky-600' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isAutoQcEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>
             <fieldset className="disabled:opacity-50 transition-opacity" disabled={!isAutoQcEnabled}>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6 border-t mt-4">
                    <QCRuleEditor
                        title="Standard Insertion Rules"
                        rule={qcConfig.standard}
                        onUpdate={(newRule) => handleUpdateRule('standard', newRule)}
                        materialType="standard"
                    />
                    <QCRuleEditor
                        title="Blank Insertion Rules"
                        rule={qcConfig.blank}
                        onUpdate={(newRule) => handleUpdateRule('blank', newRule)}
                        materialType="blank"
                    />
                    <QCRuleEditor
                        title="Duplicate Insertion Rules"
                        rule={qcConfig.duplicate}
                        onUpdate={(newRule) => handleUpdateRule('duplicate', newRule)}
                        materialType="duplicate"
                    />
                </div>
            </fieldset>
        </div>
    );
};

// QC Rule Editor Component
interface QCRuleEditorProps {
    title: string;
    rule: QCRule;
    onUpdate: (newRule: QCRule) => void;
    materialType: 'standard' | 'blank' | 'duplicate';
}
const QCRuleEditor: React.FC<QCRuleEditorProps> = ({ title, rule, onUpdate }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    
    const rateOptions = [
        { value: QCRate.None, label: "Disabled" },
        { value: QCRate.Fifty, label: "1 in 50 (2 per 100)" },
        { value: QCRate.TwentyFive, label: "1 in 25 (4 per 100)" },
        { value: QCRate.Twenty, label: "1 in 20 (5 per 100)" },
        { value: QCRate.Ten, label: "1 in 10 (10 per 100)" },
    ];

    const maxTriggers = rule.rate ? 100 / rule.rate : 0;
    const canAddMore = rule.triggers.length < maxTriggers;

    const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRate = Number(e.target.value) as QCRate;
        onUpdate({ rate: newRate, triggers: [] });
    };

    const handleAddTrigger = () => {
        setError('');
        if (!/^\d{1,2}$/.test(inputValue)) {
            setError("Must be a 1 or 2 digit number.");
            return;
        }
        if (!canAddMore) {
            setError(`Cannot add more than ${maxTriggers} triggers for this rate.`);
            return;
        }
        const formattedEnding = inputValue.padStart(2, '0');
        if (rule.triggers.some(t => t.ending === formattedEnding)) {
            setError("This ending has already been added.");
            return;
        }

        const newTrigger: QCTrigger = { ending: formattedEnding };
        const sortedTriggers = [...rule.triggers, newTrigger].sort((a,b) => a.ending.localeCompare(b.ending));
        onUpdate({ ...rule, triggers: sortedTriggers });
        setInputValue('');
    };
    
    const handleRemoveTrigger = (endingToRemove: string) => {
        onUpdate({ ...rule, triggers: rule.triggers.filter(t => t.ending !== endingToRemove) });
    };

    const statusColor = rule.triggers.length === maxTriggers ? 'text-green-600' : 'text-amber-600';

    return (
        <div className="border p-4 rounded-lg bg-slate-50 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-3">{title}</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600">Insertion Rate</label>
                    <select
                        value={rule.rate}
                        onChange={handleRateChange}
                        className="mt-1 block w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    >
                        {rateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                {rule.rate !== QCRate.None && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Sample ID Endings</label>
                            <p className="text-xs text-slate-500">Define the 2-digit endings that trigger insertion.</p>
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTrigger(); } }}
                                    placeholder="e.g., 20"
                                    disabled={!canAddMore}
                                    className="flex-grow block w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
                                />
                                <button onClick={handleAddTrigger} disabled={!canAddMore} className="flex-shrink-0 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md shadow-sm hover:bg-sky-700 disabled:bg-slate-400">Add</button>
                            </div>
                            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                        </div>
                        <div className="flex-grow bg-white border rounded-md p-2 min-h-[120px]">
                            {rule.triggers.length > 0 ? (
                                <div className="space-y-2">
                                    {rule.triggers.map(trigger => (
                                        <div key={trigger.ending} className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-md">
                                            <span className="flex-shrink-0 text-sm font-mono font-bold px-2 py-1">.{trigger.ending}</span>
                                            <div className="flex-grow"></div>
                                            <button onClick={() => handleRemoveTrigger(trigger.ending)} className="ml-auto flex-shrink-0 text-slate-500 hover:text-red-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-center text-sm text-slate-400 p-4">No endings defined.</p>
                                </div>
                            )}
                        </div>
                         <p className={`text-sm font-medium text-right ${statusColor}`}>
                            {rule.triggers.length} of {maxTriggers} triggers defined.
                        </p>
                    </>
                )}
            </div>
        </div>
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
            <h2 className="text-xl font-bold text-slate-700 mb-4">{title}</h2>
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
            <h2 className="text-xl font-bold text-slate-700 mb-4">Projects</h2>
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