import React from 'react';
import { TrashIcon } from './icons';

const InstructionsPanel: React.FC = () => {
    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 border-b-2 border-sky-200 pb-2 mb-4">{title}</h3>
            <div className="prose prose-sm max-w-none text-slate-600">{children}</div>
        </div>
    );

    const Step: React.FC<{ num: number; title: string; children: React.ReactNode }> = ({ num, title, children }) => (
        <div className="flex gap-4 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-sky-600 text-white font-bold rounded-full">{num}</div>
            <div>
                <h4 className="font-bold text-slate-700">{title}</h4>
                <p>{children}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-700 mb-2">User Guide & Best Practices</h2>
            <p className="text-sm text-slate-500 mb-8">Follow these workflows to ensure data integrity and smooth operation.</p>

            <Section title="Understanding the Interface">
                <p>The application is designed to fit your screen without a main browser scrollbar. The header and primary controls remain fixed at the top. When content like the sample table or graphical log is too long for the screen, individual scrollbars will appear within those specific panels. This ensures you always have access to key functions.</p>
                <p className="mt-2">The <strong>right-click context menu</strong> in the graphical log is the primary method for performing actions on samples, such as adding QC, splitting, or merging.</p>
            </Section>
            
            <Section title="Choosing Your Workflow: Automatic vs. Manual QC">
                 <p>This application can be operated in two distinct modes. You can switch between them at any time in the <strong>Admin &gt; Auto QC Rules</strong> tab using the <strong>"Enable Auto QC"</strong> toggle.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                     <div className="border rounded-lg p-4 bg-slate-50">
                         <h4 className="font-bold text-slate-800">Manual QC Mode (Default)</h4>
                         <p>This is the simplest and most flexible way to work. The "Apply Auto QC Rules" button is disabled, and the system will <strong>never</strong> automatically add or move QC samples. You have 100% control over QC placement using the <strong>right-click context menu</strong> in the graphical log.</p>
                          <p className="mt-2 text-xs font-semibold">Choose this if: You prefer direct control, have non-standard QC patterns, or want the most predictable behavior.</p>
                     </div>
                      <div className="border rounded-lg p-4 bg-slate-50">
                         <h4 className="font-bold text-slate-800">Automatic QC Mode</h4>
                         <p>This mode enables the "Apply Auto QC Rules" button and is designed for high-volume logging where a consistent QC pattern is required. It automatically inserts QC based on pre-defined rules, but requires following a specific workflow to function correctly.</p>
                          <p className="mt-2 text-xs font-semibold">Choose this if: You are logging many holes and want to enforce a strict, repeatable QC insertion policy.</p>
                     </div>
                 </div>
            </Section>

            <Section title="The Automatic QC Workflow (The 'Golden Path')">
                <p>If you have <strong>"Enable Auto QC"</strong> turned on, following these steps in order is the most reliable way to log a drillhole and will prevent most common issues.</p>
                <Step num={1} title="Complete Initial Setup">
                    Navigate to the <strong>Admin</strong> section. Under the <strong>Project Setup</strong> tab, ensure all your Projects, Samplers, Standards, and Blanks are defined. Under the <strong>Auto QC Rules</strong> tab, configure your desired QC insertion rates and triggers.
                </Step>
                <Step num={2} title="Create Hole & Enter Details">
                    Return to the <strong>Logger</strong>. Add a new drillhole or select an existing one. Completely fill out all fields in the <strong>Drillhole Information</strong> card (Project, Hole ID, Depth, etc.). This information is critical for all subsequent steps.
                </Step>
                <Step num={3} title="Generate Primary Samples">
                    In the <strong>Sample Generation</strong> card, select your primary sample interval (e.g., 1m or 4m) and click <strong>Generate Primary Samples</strong>.
                </Step>
                <Step num={4} title="Log 'Not Sampled' Intervals (Crucial Step)">
                    <strong>Before adding any QC samples</strong>, identify any gaps in the sampling. Use the <strong>Add Not Sampled Interval</strong> button to mark these zones. This ensures the final sample sequence is correct *before* QC is placed.
                </Step>
                <Step num={5} title="Apply Automatic QC Rules">
                    Click the <strong>Apply Auto QC Rules</strong> button. The application will now automatically insert Standards, Blanks, and Duplicates into the sample sequence according to the rules you defined in the Admin area.
                </Step>
                 <Step num={6} title="Assign Materials to QC Samples">
                    In the <strong>Graphical Log</strong>, newly created Standards and Blanks will be unassigned and highlighted (e.g., pulsing red). Click directly on the sample's badge (the text that says 'SELECT STD' or 'SELECT BLK') to open a popover and assign the correct material from your list.
                </Step>
                <Step num={7} title="Log Condition & Recovery">
                    In the main view, switch to the <strong>Condition & Recovery</strong> tab. Use the graphical interface to log the geological conditions for each meter. You can also right-click on any interval in the <strong>Recovery</strong> log to toggle whether it is contaminated.
                </Step>
                 <Step num={8} title="Review & Export">
                    Switch between the Graphical Log, Sample Table, and Condition & Recovery tabs to review your work. Once satisfied, use the <strong>Export Data</strong> button in the header.
                </Step>
            </Section>

            <Section title="Manual Operations & Important Notes">
                 <h4 className="font-bold text-slate-700">The Right-Click Context Menu</h4>
                 <p>Most manual sample manipulations are performed using the right-click context menu in the <strong>Graphical Log</strong>. Right-clicking on a sample will reveal a list of available actions, which may include:</p>
                 <ul className="list-disc list-inside mt-2">
                    <li><strong>Add Duplicate:</strong> Creates a duplicate of a primary sample.</li>
                    <li><strong>Insert Standard / Insert Blank:</strong> Inserts a new Standard or Blank at the start of a primary sample's interval.</li>
                    <li><strong>Set Assay to ME/Au:</strong> Toggles the assay type for a primary sample and its duplicate.</li>
                    <li><strong>Split to 1m:</strong> Splits a multi-meter primary sample into 1m intervals.</li>
                    <li><strong>Merge 1m Samples:</strong> Select multiple, contiguous 1m primary samples and right-click to merge them.</li>
                    <li><strong>Delete Sample:</strong> Deletes non-primary samples (Duplicates, Standards, Blanks).</li>
                 </ul>

                 <div className="my-3 p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-800 text-xs">
                    <strong>Important (When in Auto QC Mode):</strong> Performing a manual QC action (adding/deleting a Standard, Blank, or Duplicate) will disable the "smart" auto-regeneration for that hole. If you later add a 'Not Sampled' interval, the system will not automatically reposition QC. You must click <strong>"Apply Auto QC Rules"</strong> again to reset and regenerate the entire QC sequence based on the latest state.
                </div>

                <h4 className="font-bold text-slate-700 mt-4">Clearing Data</h4>
                <p>To quickly remove data from the active hole, use the trash can (<TrashIcon className="w-4 h-4 inline-block" />) icons located next to the "Graphical Log" title. You can clear all samples from the sample log, or clear all data from the currently viewed Condition or Recovery log.</p>

                <h4 className="font-bold text-slate-700 mt-4">Troubleshooting</h4>
                <p className="font-semibold">"My QC samples are in the wrong positions after I added a 'Not Sampled' interval."</p>
                <p>This happens if the 'Not Sampled' interval was added *after* QC samples were already present in Auto QC mode. The easiest and most reliable fix is to simply click the <strong>Apply Auto QC Rules</strong> button again. This will perform a clean reset, removing all old QC and regenerating it in the new, correct positions.</p>
            </Section>
        </div>
    );
};

export default InstructionsPanel;
