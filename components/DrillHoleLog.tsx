import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Sample, SampleType, LogInterval, ConditionCode, RecoveryCode } from '../types';
import { CopyIcon, BeakerIcon, ScissorsIcon, ZoomInIcon, ZoomOutIcon, BlankIcon, TrashIcon, GridIcon } from './icons';

interface DrillHoleLogProps {
  samples: Sample[];
  holeDepth: number;
  conditionLog: LogInterval[];
  recoveryLog: LogInterval[];
  selectedSampleUuids: string[];
  onToggleSelection: (uuid: string) => void;
  onAddDuplicate: (sample: Sample) => void;
  onInsertStandard: (sample: Sample, targetRect: DOMRect) => void;
  onInsertBlank: (sample: Sample, targetRect: DOMRect) => void;
  onSplit: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
  onUpdateIntervalLog: (logType: 'condition' | 'recovery', from: number, to: number, code: ConditionCode | RecoveryCode) => void;
  onToggleMultiElement: (sample: Sample) => void;
  onAssignMaterial: (sample: Sample, targetRect: DOMRect) => void;
  displayMode: 'samples' | 'condition';
}

const getSampleColor = (sample: Sample) => {
    if ((sample.type === SampleType.Standard || sample.type === SampleType.Blank) && !sample.materialUuid) {
        return 'bg-red-500 border-red-700 animate-pulse';
    }
    if (sample.type === SampleType.Primary && sample.assayType === 'ME') return 'bg-purple-500 border-purple-700';
    if (sample.type === SampleType.Duplicate && sample.assayType === 'ME') return 'bg-purple-400 border-purple-600';
    switch (sample.type) {
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

interface SampleLogProps extends Omit<DrillHoleLogProps, 'displayMode' | 'onUpdateIntervalLog' | 'conditionLog' | 'recoveryLog'> {
  zoom: number;
}


const DrillHoleLog: React.FC<DrillHoleLogProps> = (props) => {
  const { displayMode } = props;
  const [zoom, setZoom] = useState(1);
  const [intervalLogView, setIntervalLogView] = useState<'condition' | 'recovery'>('condition');

  const IntervalLogToggleButton = ({ viewName, label }: { viewName: 'condition' | 'recovery', label: string }) => (
    <button
      onClick={() => setIntervalLogView(viewName)}
      className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
        intervalLogView === viewName ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col h-full">
      <div style={{ width: '10cm' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-700">Graphical Log</h2>
          <div className="flex items-center gap-4">
              {displayMode === 'samples' && (
                  <div className="flex items-center gap-2">
                      <button onClick={() => setZoom(z => Math.max(0.1, z / 1.5))} className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"><ZoomOutIcon className="w-5 h-5 text-slate-600" /></button>
                      <span className="text-sm font-medium text-slate-500 w-12 text-center">{Math.round(zoom*100)}%</span>
                      <button onClick={() => setZoom(z => Math.min(20, z * 1.5))} className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"><ZoomInIcon className="w-5 h-5 text-slate-600" /></button>
                  </div>
              )}
               {displayMode === 'condition' && (
                  <div className="flex rounded-md shadow-sm bg-white p-1 border">
                      <IntervalLogToggleButton viewName="condition" label="Condition" />
                      <IntervalLogToggleButton viewName="recovery" label="Recovery" />
                  </div>
              )}
          </div>
        </div>
      </div>
      
      {displayMode === 'samples' && <SampleLog 
        samples={props.samples}
        holeDepth={props.holeDepth}
        selectedSampleUuids={props.selectedSampleUuids}
        onToggleSelection={props.onToggleSelection}
        onAddDuplicate={props.onAddDuplicate}
        onInsertStandard={props.onInsertStandard}
        onInsertBlank={props.onInsertBlank}
        onSplit={props.onSplit}
        onDelete={props.onDelete}
        onToggleMultiElement={props.onToggleMultiElement}
        onAssignMaterial={props.onAssignMaterial}
        zoom={zoom} 
      />}
      {displayMode === 'condition' && intervalLogView === 'condition' && <IntervalLog key="condition" holeDepth={props.holeDepth} logData={props.conditionLog} options={CONDITION_OPTIONS} logType="condition" onUpdate={props.onUpdateIntervalLog} />}
      {displayMode === 'condition' && intervalLogView === 'recovery' && <IntervalLog key="recovery" holeDepth={props.holeDepth} logData={props.recoveryLog} options={RECOVERY_OPTIONS} logType="recovery" onUpdate={props.onUpdateIntervalLog}/>}
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
  onToggleMultiElement,
  onAssignMaterial,
  zoom,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, sample: Sample, targetRect: DOMRect } | null>(null);
  const baseScale = holeDepth > 80 ? holeDepth / 80 : 1;

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const handleOpenContextMenu = (e: React.MouseEvent, sample: Sample) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, sample, targetRect: e.currentTarget.getBoundingClientRect() });
  };

  const handleSampleClick = (e: React.MouseEvent, sample: Sample) => {
    if ((sample.type === SampleType.Standard || sample.type === SampleType.Blank) && !sample.materialUuid) {
        onAssignMaterial(sample, e.currentTarget.getBoundingClientRect());
    } else {
        onToggleSelection(sample.uuid);
    }
  };

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

  const SampleBadge = ({ sample }: { sample: Sample }) => {
    const { type, materialName, materialUuid } = sample;
    const text = materialUuid ? materialName : type === SampleType.Standard ? 'SELECT STD' : 'SELECT BLK';
    const colors = type === SampleType.Standard ? 'bg-yellow-200 text-yellow-800 border-yellow-400' : 'bg-slate-200 text-slate-800 border-slate-400';
    return (
      <div className={`absolute left-2 -top-2.5 z-20 px-2 py-0.5 text-xs font-bold rounded-full border ${colors}`}>
        {text}
      </div>
    );
  };
  
  return (
    <div className="flex-grow relative">
      <div className="absolute inset-0 rounded-md overflow-hidden" style={{ width: '10cm' }}>
        <div className="absolute inset-0 overflow-y-auto">
            <div className="relative bg-slate-100 w-full" style={{ height: `${zoom * baseScale * 100}%`}}>
                <div className="absolute top-0 left-0 h-full w-10 text-xs text-slate-500">
                    {rulerMarkers.map(depth => (
                        <div key={depth} className="absolute text-right w-full pr-2" style={{ top: `${(depth / holeDepth) * 100}%` }}>
                           <span className="block border-t border-slate-300 w-full pt-0.5">{depth}m</span>
                        </div>
                    ))}
                </div>
                <div className="relative h-full ml-10 bg-slate-200">
                {holeDepth > 0 && intervals.map((intervalSamples) => {
                    const firstSample = intervalSamples[0];
                    const { from, to } = firstSample;
                    const height = ((to - from) / holeDepth) * 100;
                    const top = (from / holeDepth) * 100;

                    const getTitle = (sample: Sample) => `ID: ${sample.id || 'N/A'} | ${sample.from}m${sample.from === sample.to ? '' : ` - ${sample.to}m`} | ${sample.type}${!sample.materialUuid && (sample.type === SampleType.Standard || sample.type === SampleType.Blank) ? ' (Unassigned)' : (sample.materialName ? ` (${sample.materialName})` : '')}${sample.comment ? ` - ${sample.comment}` : ''}`;

                    if (from === to) { // Zero-length samples (standards, blanks)
                        const sample = firstSample;
                        return (
                             <div key={sample.uuid} className="absolute w-full cursor-pointer z-10" style={{ top: `${top}%`, height: `1px` }} 
                                title={getTitle(sample)} onClick={(e) => handleSampleClick(e, sample)} onContextMenu={(e) => handleOpenContextMenu(e, sample)}>
                                <div className={`relative h-0.5 w-full ${getSampleColor(sample)} ${selectedSampleUuids.includes(sample.uuid) ? 'ring-2 ring-orange-500' : ''}`}>
                                    {(sample.type === SampleType.Standard || sample.type === SampleType.Blank) && <SampleBadge sample={sample}/>}
                                </div>
                            </div>
                        );
                    }
                    
                    if (firstSample.type === SampleType.NotSampled) {
                       return (
                           <div key={firstSample.uuid} className="absolute w-full" style={{ top: `${top}%`, height: `${height}%` }} onClick={(e) => handleSampleClick(e, firstSample)} onContextMenu={(e) => handleOpenContextMenu(e, firstSample)}>
                               <div className={`h-full border-b cursor-pointer ${getSampleColor(firstSample)}`} style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 5px, transparent 5px, transparent 10px)' }}
                                    title={getTitle(firstSample)}>
                                   <SampleBlock sample={firstSample} selectedSampleUuids={selectedSampleUuids} holeDepth={holeDepth} zoom={zoom}/>
                               </div>
                           </div>
                       )
                    }

                    const primaryFirst = [...intervalSamples].sort((a, b) => a.type === SampleType.Primary ? -1 : b.type === SampleType.Primary ? 1 : 0);
                    const width = `${100 / primaryFirst.length}%`;

                    return (
                        <div key={`${from}-${to}`} className="absolute w-full flex" style={{ top: `${top}%`, height: `${height}%` }}>
                            {primaryFirst.map(sample => (
                                <div key={sample.uuid} className={`h-full border-b cursor-pointer ${getSampleColor(sample)}`} style={{width}} title={getTitle(sample)} onClick={(e) => handleSampleClick(e, sample)} onContextMenu={(e) => handleOpenContextMenu(e, sample)}>
                                    <SampleBlock sample={sample} selectedSampleUuids={selectedSampleUuids} holeDepth={holeDepth} zoom={zoom}/>
                                </div>
                            ))}
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
      </div>
       {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sample={contextMenu.sample}
          targetRect={contextMenu.targetRect}
          onClose={() => setContextMenu(null)}
          actions={{ onAddDuplicate, onInsertStandard, onInsertBlank, onSplit, onDelete, onToggleMultiElement }}
        />
      )}
    </div>
  );
};

const SampleBlock = ({ sample, selectedSampleUuids, holeDepth, zoom }) => {
    const isSelected = selectedSampleUuids.includes(sample.uuid);
    const canShowText = ((sample.to - sample.from) / holeDepth) * (600 * zoom) > 15;

    return (
        <div className={`relative w-full h-full transition-all duration-150 ease-in-out ${isSelected ? 'ring-2 ring-orange-500 ring-offset-1 z-10' : ''}`}>
            <div className="flex items-center justify-center h-full text-white text-xs sm:text-sm font-bold opacity-75 leading-tight p-1 text-center">
                {canShowText ? (sample.type === SampleType.NotSampled ? (sample.comment || 'NOT SAMPLED').toUpperCase() : sample.id) : ''}
            </div>
        </div>
    );
};

const ContextMenu = ({ x, y, sample, targetRect, onClose, actions }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: `${y}px`,
    left: `${x}px`,
    opacity: 0, // Start hidden to prevent flicker
  });

  useLayoutEffect(() => {
    if (menuRef.current) {
      const { innerWidth, innerHeight } = window;
      const rect = menuRef.current.getBoundingClientRect();
      
      let finalX = x;
      if (x + rect.width > innerWidth) {
        finalX = x - rect.width;
      }
      
      let finalY = y;
      if (y + rect.height > innerHeight) {
        finalY = y - rect.height;
      }

      setStyle({
        position: 'fixed',
        top: `${finalY}px`,
        left: `${finalX}px`,
        opacity: 1,
        transition: 'opacity 0.1s ease-in-out',
      });
    }
  }, [x, y]);
  
  const canSplit = sample.type === SampleType.Primary && (sample.to - sample.from) > 1;
  const isAuAssay = sample.assayType === 'Au' || !sample.assayType;

  const menuItemClass = "flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed";
  const iconClass = "w-4 h-4 text-slate-500";
  
  return (
    <div ref={menuRef} style={style} className="z-50 bg-white rounded-lg shadow-lg border border-slate-200 p-1.5 min-w-[180px]" onClick={onClose}>
        <p className="px-3 py-1 text-xs font-bold text-slate-500 truncate">{sample.id || `Interval ${sample.from}-${sample.to}`}</p>
        <hr className="my-1 border-slate-100"/>
        {sample.type === SampleType.Primary && (
            <>
              <button onClick={() => actions.onAddDuplicate(sample)} className={menuItemClass}><CopyIcon className={iconClass}/> Add Duplicate</button>
              <button onClick={() => actions.onInsertStandard(sample, targetRect)} className={menuItemClass}><BeakerIcon className={iconClass}/> Insert Standard</button>
              <button onClick={() => actions.onInsertBlank(sample, targetRect)} className={menuItemClass}><BlankIcon className={iconClass}/> Insert Blank</button>
              <button onClick={() => actions.onToggleMultiElement(sample)} className={menuItemClass}><GridIcon className={iconClass}/> Set Assay to {isAuAssay ? 'ME' : 'Au'}</button>
              <button onClick={() => actions.onSplit(sample)} disabled={!canSplit} className={menuItemClass}><ScissorsIcon className={iconClass}/> Split to 1m</button>
            </>
        )}
         {(sample.type !== SampleType.Primary) && (
             <button onClick={() => actions.onDelete(sample)} className={`${menuItemClass} text-red-600 hover:bg-red-50`}><TrashIcon className="w-4 h-4 text-red-500"/> Delete {sample.type}</button>
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
            {/* FIX: Switched from Object.entries to Object.keys to ensure proper type inference for 'option', resolving errors when accessing properties like 'label' and 'color'. */}
            {Object.keys(options).map((code) => {
                const option = options[code];
                return (
                    <button 
                        key={code} 
                        title={option.label} 
                        onClick={(e) => { e.stopPropagation(); onApply(code); }}
                        className={`w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 ${option.color} ${option.textColor} focus:ring-sky-500`}>
                        {code}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="flex-grow flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {/* FIX: Switched from Object.entries to Object.keys to ensure proper type inference for 'option', resolving errors when accessing properties like 'label' and 'color'. */}
                    {Object.keys(options).map((code) => {
                        const option = options[code];
                        return (
                            <div key={code} className="flex items-center gap-1.5">
                                <div className={`w-3.5 h-3.5 rounded-sm ${option.color}`}></div>
                                <span className="text-xs font-medium text-slate-600">{code}: {option.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex-grow relative rounded-md overflow-hidden" style={{ width: '10cm' }}>
                <div className="absolute inset-0 overflow-y-auto">
                    <div className="relative bg-slate-100 w-full" style={{ height: `${holeDepth * 20}px`, minHeight: '100%' }}>
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
                                const meterIsSelected = isMeterSelected(meter);
                                const showHoverToolbar = selection.start !== null && hoveredMeter === meter && meterIsSelected;
                                
                                // Determine the background color class based on selection and logged data
                                const bgClass = meterIsSelected
                                    ? 'bg-slate-500 border-slate-600' // Darker grey fill for selected intervals
                                    : (option ? `${option.color} border-white/20` : 'bg-slate-200 border-slate-300');

                                return (
                                <div key={meter} className="absolute w-full" style={{ top: `${(meter / holeDepth) * 100}%`, height: `${(1 / holeDepth) * 100}%` }}>
                                    <div className="relative w-full h-full">
                                        <div
                                            onClick={() => handleIntervalClick(meter)}
                                            onMouseEnter={() => setHoveredMeter(meter)}
                                            className={`w-full h-full border-b cursor-pointer transition-all hover:brightness-90 ${bgClass}`}
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