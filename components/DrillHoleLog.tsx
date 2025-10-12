import React, { useState, useMemo, useCallback } from 'react';
import { Sample, SampleType, LogInterval, ConditionCode, RecoveryCode } from '../types';
import { CopyIcon, BeakerIcon, ScissorsIcon, ZoomInIcon, ZoomOutIcon, BlankIcon, TrashIcon } from './icons';

interface DrillHoleLogProps {
  samples: Sample[];
  holeDepth: number;
  conditionLog: LogInterval[];
  recoveryLog: LogInterval[];
  selectedSampleUuids: string[];
  activeTab: 'samples' | 'condition' | 'recovery';
  onTabChange: (tab: 'samples' | 'condition' | 'recovery') => void;
  onToggleSelection: (uuid: string) => void;
  onAddDuplicate: (sample: Sample) => void;
  onInsertStandard: (sample: Sample) => void;
  onInsertBlank: (sample: Sample) => void;
  onSplit: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
  onUpdateIntervalLog: (logType: 'condition' | 'recovery', from: number, to: number, code: ConditionCode | RecoveryCode) => void;
}

const getSampleColor = (type: SampleType) => {
    switch (type) {
      case SampleType.Primary: return 'bg-sky-500 border-sky-700';
      case SampleType.Duplicate: return 'bg-green-500 border-green-700';
      case SampleType.Standard: return 'bg-yellow-400 border-yellow-600';
      case SampleType.Blank: return 'bg-slate-400 border-slate-600';
      case SampleType.NotSampled: return 'bg-slate-300 border-slate-500';
      default: return 'bg-slate-500 border-slate-700';
    }
};
  
const CONDITION_OPTIONS: { [key in ConditionCode]: { label: string; color: string; textColor: string; } } = {
    [ConditionCode.Dry]: { label: 'Dry', color: 'bg-yellow-400', textColor: 'text-yellow-900' },
    [ConditionCode.Moist]: { label: 'Moist', color: 'bg-amber-600', textColor: 'text-white' },
    [ConditionCode.Wet]: { label: 'Wet', color: 'bg-sky-500', textColor: 'text-white' },
    [ConditionCode.NoSample]: { label: 'No Sample', color: 'bg-slate-400', textColor: 'text-white' },
};

const RECOVERY_OPTIONS: { [key in RecoveryCode]: { label: string; color: string; textColor: string; } } = {
    [RecoveryCode.Good]: { label: 'Good', color: 'bg-green-400', textColor: 'text-green-900' },
    [RecoveryCode.Medium]: { label: 'Medium', color: 'bg-yellow-400', textColor: 'text-yellow-900' },
    [RecoveryCode.Poor]: { label: 'Poor', color: 'bg-red-400', textColor: 'text-red-900' },
    [RecoveryCode.NoSample]: { label: 'No Sample', color: 'bg-slate-400', textColor: 'text-white' },
};

interface SampleLogProps extends Omit<DrillHoleLogProps, 'onUpdateIntervalLog' | 'conditionLog' | 'recoveryLog' | 'activeTab' | 'onTabChange'> {
  zoom: number;
}


const DrillHoleLog: React.FC<DrillHoleLogProps> = (props) => {
  const { activeTab, onTabChange } = props;
  const [zoom, setZoom] = useState(1);

  const TabButton = ({ tabName, label }: { tabName: typeof activeTab, label: string }) => (
    <button
      onClick={() => onTabChange(tabName)}
      className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
        activeTab === tabName ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700">Graphical Log</h2>
        <div className="flex items-center gap-4">
            {activeTab === 'samples' && (
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.1, z / 1.5))} className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"><ZoomOutIcon className="w-5 h-5 text-slate-600" /></button>
                    <span className="text-sm font-medium text-slate-500 w-12 text-center">{Math.round(zoom*100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(20, z * 1.5))} className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"><ZoomInIcon className="w-5 h-5 text-slate-600" /></button>
                </div>
            )}
            <div className="flex rounded-md shadow-sm bg-white p-1 border">
                <TabButton tabName="samples" label="Samples" />
                <TabButton tabName="condition" label="Condition" />
                <TabButton tabName="recovery" label="Recovery" />
            </div>
        </div>
      </div>
      
      {activeTab === 'samples' && <SampleLog {...props} zoom={zoom} />}
      {activeTab === 'condition' && <IntervalLog key="condition" holeDepth={props.holeDepth} logData={props.conditionLog} options={CONDITION_OPTIONS} logType="condition" onUpdate={props.onUpdateIntervalLog} />}
      {activeTab === 'recovery' && <IntervalLog key="recovery" holeDepth={props.holeDepth} logData={props.recoveryLog} options={RECOVERY_OPTIONS} logType="recovery" onUpdate={props.onUpdateIntervalLog}/>}
    </div>
  );
};


const SampleLog: React.FC<SampleLogProps> = ({ 
  samples, 
  holeDepth, 
  selectedSampleUuids, 
  onToggleSelection,
  onAddDuplicate,
  onInsertStandard,
  onInsertBlank,
  onSplit,
  onDelete,
  zoom,
}) => {
  const [hoveredSampleUuid, setHoveredSampleUuid] = useState<string | null>(null);

  const baseScale = holeDepth > 80 ? holeDepth / 80 : 1;

  const intervals = useMemo(() => {
    const groups = new Map<string, Sample[]>();
    samples.forEach(sample => {
      const key = sample.type === SampleType.NotSampled ? sample.uuid : `${sample.from}-${sample.to}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sample);
    });
    return Array.from(groups.values());
  }, [samples]);

  const rulerStep = zoom > 5 ? 1 : zoom > 2 ? 5 : 10;
  const rulerMarkers = holeDepth > 0 ? Array.from({ length: Math.floor(holeDepth / rulerStep) + 1 }, (_, i) => i * rulerStep) : [];

  const SampleBadge = ({ type, name }: { type: SampleType.Standard | SampleType.Blank, name?: string }) => {
    const text = name ? name : type === SampleType.Standard ? 'STD' : 'BLK';
    const colors = type === SampleType.Standard ? 'bg-yellow-200 text-yellow-800 border-yellow-400' : 'bg-slate-200 text-slate-800 border-slate-400';
    return (
      <div className={`absolute right-2 -top-2.5 z-20 px-2 py-0.5 text-xs font-bold rounded-full border ${colors}`}>
        {text}
      </div>
    );
  };
  
  return (
    <>
      <div className="flex-grow relative rounded-md overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
            <div className="relative w-full bg-slate-100" style={{height: `${zoom * baseScale * 100}%`}}>
                <div className="absolute top-0 left-0 h-full w-10 text-xs text-slate-500">
                    {rulerMarkers.map(depth => (
                        <div key={depth} className="absolute text-right w-full pr-2" style={{ top: `${(depth / holeDepth) * 100}%` }}>
                           <span className="block border-t border-slate-300 w-full pt-0.5">{depth}m</span>
                        </div>
                    ))}
                </div>
                <div className="relative h-full ml-10 bg-slate-200" onMouseLeave={() => setHoveredSampleUuid(null)}>
                {holeDepth > 0 && intervals.map((intervalSamples) => {
                    const firstSample = intervalSamples[0];
                    const { from, to } = firstSample;
                    const height = ((to - from) / holeDepth) * 100;
                    const top = (from / holeDepth) * 100;

                    const getTitle = (sample: Sample) => `ID: ${sample.id} | ${sample.from}m${sample.from === sample.to ? '' : ` - ${sample.to}m`} | ${sample.type}${sample.materialName ? ` (${sample.materialName})` : ''}`

                    if (from === to) {
                        const sample = firstSample;
                        const isSelected = selectedSampleUuids.includes(sample.uuid);
                        const isHovered = hoveredSampleUuid === sample.uuid;
                        return (
                             <div key={sample.uuid} className="absolute w-full px-1" style={{ top: `${top}%`, height: `1px` }} 
                                title={getTitle(sample)} onClick={() => onToggleSelection(sample.uuid)} onMouseEnter={() => setHoveredSampleUuid(sample.uuid)}>
                                <div className={`relative h-0.5 w-full ${getSampleColor(sample.type)} ${isSelected ? 'ring-2 ring-orange-500' : ''}`}>
                                    {(sample.type === SampleType.Standard || sample.type === SampleType.Blank) && <SampleBadge type={sample.type} name={sample.materialName}/>}
                                    {isHovered && (
                                        <button title="Delete Sample" aria-label={`Delete sample`} className="absolute -right-2.5 -top-2 z-30 p-1 text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); onDelete(sample); }}>
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }
                    
                    const primary = intervalSamples.find(s => s.type === SampleType.Primary);
                    const duplicate = intervalSamples.find(s => s.type === SampleType.Duplicate);
                    const notSampled = intervalSamples.find(s => s.type === SampleType.NotSampled);
                    
                    if (notSampled) {
                       return (
                           <div key={notSampled.uuid} className="absolute w-full" style={{ top: `${top}%`, height: `${height}%` }} onClick={() => onToggleSelection(notSampled.uuid)}>
                               <div className={`h-full border-b cursor-pointer ${getSampleColor(notSampled.type)}`} style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 5px, transparent 5px, transparent 10px)' }}
                                    title={getTitle(notSampled)} onMouseEnter={() => setHoveredSampleUuid(notSampled.uuid)}>
                                   <SampleBlock sample={notSampled} selectedSampleUuids={selectedSampleUuids} hoveredSampleUuid={hoveredSampleUuid} onAddDuplicate={onAddDuplicate} onInsertStandard={onInsertStandard} onInsertBlank={onInsertBlank} onSplit={onSplit} onDelete={onDelete} holeDepth={holeDepth} zoom={zoom}/>
                               </div>
                           </div>
                       )
                    }

                    return (
                        <div key={`${from}-${to}`} className="absolute w-full flex" style={{ top: `${top}%`, height: `${height}%` }}>
                            {primary && (
                                <div className={`h-full border-b cursor-pointer ${getSampleColor(primary.type)} ${duplicate ? 'w-1/2' : 'w-full'}`} title={getTitle(primary)} onMouseEnter={() => setHoveredSampleUuid(primary.uuid)} onClick={() => onToggleSelection(primary.uuid)}>
                                    <SampleBlock sample={primary} selectedSampleUuids={selectedSampleUuids} hoveredSampleUuid={hoveredSampleUuid} onAddDuplicate={onAddDuplicate} onInsertStandard={onInsertStandard} onInsertBlank={onInsertBlank} onSplit={onSplit} onDelete={onDelete} holeDepth={holeDepth} zoom={zoom}/>
                                </div>
                            )}
                            {duplicate && (
                                <div className={`h-full border-b cursor-pointer ${getSampleColor(duplicate.type)} w-1/2`} title={getTitle(duplicate)} onMouseEnter={() => setHoveredSampleUuid(duplicate.uuid)} onClick={() => onToggleSelection(duplicate.uuid)}>
                                    <SampleBlock sample={duplicate} selectedSampleUuids={selectedSampleUuids} hoveredSampleUuid={hoveredSampleUuid} onAddDuplicate={onAddDuplicate} onInsertStandard={onInsertStandard} onInsertBlank={onInsertBlank} onSplit={onSplit} onDelete={onDelete} holeDepth={holeDepth} zoom={zoom}/>
                                </div>
                            )}
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

const SampleBlock = ({ sample, selectedSampleUuids, hoveredSampleUuid, onAddDuplicate, onInsertStandard, onInsertBlank, onSplit, onDelete, holeDepth, zoom }) => {
    const isSelected = selectedSampleUuids.includes(sample.uuid);
    const isHovered = sample.uuid === hoveredSampleUuid;
    const canSplit = sample.type === SampleType.Primary && (sample.to - sample.from) > 1;
    const canShowText = ((sample.to - sample.from) / holeDepth) * (600 * zoom) > 15;

    return (
        <div className={`relative w-full h-full transition-all duration-150 ease-in-out ${isSelected ? 'ring-2 ring-orange-500 ring-offset-1 z-10' : ''}`}>
            <div className="flex items-center justify-center h-full text-white text-sm font-bold opacity-75 leading-tight p-1 text-center">
                {canShowText ? (sample.type === SampleType.NotSampled ? 'NOT SAMPLED' : sample.id) : ''}
            </div>
            {isHovered && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 transition-opacity">
                    <div className="flex items-center gap-1 p-1 rounded-md bg-black bg-opacity-50 backdrop-blur-sm">
                        {sample.type === SampleType.Primary && 
                          <>
                            <button title="Add Duplicate" aria-label={`Add duplicate for sample ${sample.id}`} className="p-1.5 text-white rounded-md hover:bg-white/20 hover:text-green-400 transition-colors" onClick={(e) => { e.stopPropagation(); onAddDuplicate(sample); }}><CopyIcon className="w-4 h-4" /></button>
                            <button title="Insert Standard" aria-label={`Insert standard after sample ${sample.id}`} className="p-1.5 text-white rounded-md hover:bg-white/20 hover:text-yellow-400 transition-colors" onClick={(e) => { e.stopPropagation(); onInsertStandard(sample); }}><BeakerIcon className="w-4 h-4" /></button>
                            <button title="Insert Blank" aria-label={`Insert blank after sample ${sample.id}`} className="p-1.5 text-white rounded-md hover:bg-white/20 hover:text-slate-400 transition-colors" onClick={(e) => { e.stopPropagation(); onInsertBlank(sample); }}><BlankIcon className="w-4 h-4" /></button>
                            <button title="Split to 1m" aria-label={`Split sample ${sample.id} to 1m intervals`} disabled={!canSplit} className={`p-1.5 text-white rounded-md transition-colors ${canSplit ? 'hover:bg-white/20 hover:text-indigo-400' : 'opacity-50 cursor-not-allowed'}`} onClick={(e) => { e.stopPropagation(); if(canSplit) onSplit(sample); }}><ScissorsIcon className="w-4 h-4" /></button>
                          </>
                        }
                        {sample.type !== SampleType.Primary && <button title={`Delete ${sample.type}`} aria-label={`Delete ${sample.type} sample ${sample.id}`} className="p-1.5 text-white rounded-md hover:bg-white/20 hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(sample); }}><TrashIcon className="w-4 h-4" /></button>}
                    </div>
                </div>
            )}
        </div>
    );
};

type IntervalOption = {
  label: string;
  color: string;
  textColor: string;
};

type IntervalOptions = {
  [key: string]: IntervalOption;
};

interface IntervalLogProps {
  holeDepth: number;
  logData: LogInterval[];
  options: IntervalOptions;
  logType: 'condition' | 'recovery';
  onUpdate: (logType: 'condition' | 'recovery', from: number, to: number, code: ConditionCode | RecoveryCode) => void;
}

const IntervalLog: React.FC<IntervalLogProps> = ({ holeDepth, logData, options, logType, onUpdate }) => {
    const [selection, setSelection] = useState<{ start: number | null, end: number | null }>({ start: null, end: null });
    const [hoveredMeter, setHoveredMeter] = useState<number | null>(null);

    const logMap = useMemo(() => {
        const map = new Map<number, string>();
        logData.forEach(interval => {
            for (let i = interval.from; i < interval.to; i++) {
                map.set(i, interval.code);
            }
        });
        return map;
    }, [logData]);

    const handleIntervalClick = (meter: number) => {
        setHoveredMeter(meter); // Set hover on click to immediately show/move toolbar
        if (selection.start === null) {
            setSelection({ start: meter, end: null });
        } else if (selection.end === null) {
            if (selection.start === meter) {
                // If clicking the start meter again, deselect everything
                setSelection({ start: null, end: null });
            } else {
                // If clicking a new meter, create the range
                setSelection(s => ({ start: s.start!, end: meter }));
            }
        } else {
            // If a range is already selected, start a new selection
            setSelection({ start: meter, end: null });
        }
    };
    
    const handleApplyCode = (code: string) => {
        if (selection.start === null) return;
        
        const from = selection.end !== null ? Math.min(selection.start, selection.end) : selection.start;
        const to = selection.end !== null ? Math.max(selection.start, selection.end) + 1 : selection.start + 1;
        
        onUpdate(logType, from, to, code as ConditionCode | RecoveryCode);
        setSelection({ start: null, end: null });
        setHoveredMeter(null); // Reset hover to hide toolbar after applying
    };

    const isMeterSelected = useCallback((meter: number) => {
        if (selection.start === null) return false;
        if (selection.end === null) return meter === selection.start;
        const [min, max] = [Math.min(selection.start, selection.end), Math.max(selection.start, selection.end)];
        return meter >= min && meter <= max;
    }, [selection]);

    if (holeDepth <= 0) {
        return <div className="flex-grow flex items-center justify-center text-slate-500">Please set hole depth to log data.</div>;
    }

    const intervals = Array.from({ length: Math.ceil(holeDepth) }, (_, i) => i);

    const HoverToolbar = ({ onApply }: { onApply: (code: string) => void }) => (
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-20 bg-white p-1.5 rounded-lg shadow-xl flex items-center gap-1.5 border border-slate-200">
            {Object.entries(options).map(([code, { label, color, textColor }]) => (
                <button 
                    key={code} 
                    title={label} 
                    onClick={(e) => { e.stopPropagation(); onApply(code); }}
                    className={`w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 ${color} ${textColor} focus:ring-sky-500`}>
                    {code}
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex-grow flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(options).map(([code, { label, color }]) => (
                        <div key={code} className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-sm ${color}`}></div>
                            <span className="text-xs font-medium text-slate-600">{code}: {label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-grow relative rounded-md overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto">
                    <div className="relative w-full bg-slate-100" style={{ height: `${holeDepth * 20}px`, minHeight: '100%' }}>
                        <div className="absolute top-0 left-0 h-full w-10 text-xs text-slate-500">
                            {Array.from({ length: Math.floor(holeDepth / 5) + 1 }, (_, i) => i * 5).map(depth => (
                                <div key={depth} className="absolute text-right w-full pr-2" style={{ top: `${(depth / holeDepth) * 100}%` }}>
                                   <span className="block border-t border-slate-300 w-full pt-0.5">{depth}m</span>
                                </div>
                            ))}
                        </div>
                        <div className="relative h-full ml-10" onMouseLeave={() => setHoveredMeter(null)}>
                            {intervals.map(meter => {
                                const code = logMap.get(meter);
                                const option = code ? options[code] : undefined;
                                const showHoverToolbar = selection.start !== null && hoveredMeter === meter && isMeterSelected(meter);
                                
                                return (
                                <div key={meter} className="absolute w-full" style={{ top: `${(meter / holeDepth) * 100}%`, height: `${(1 / holeDepth) * 100}%` }}>
                                    <div className="relative w-full h-full">
                                        <div
                                            onClick={() => handleIntervalClick(meter)}
                                            onMouseEnter={() => setHoveredMeter(meter)}
                                            className={`w-full h-full border-b cursor-pointer transition-all hover:brightness-90 ${option ? `${option.color} border-white/20` : 'bg-slate-200 border-slate-300'} ${isMeterSelected(meter) ? 'ring-2 ring-orange-500 z-10' : ''}`}
                                            title={`${meter} - ${meter + 1}m`}
                                        />
                                        {showHoverToolbar && <HoverToolbar onApply={handleApplyCode} />}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default DrillHoleLog;