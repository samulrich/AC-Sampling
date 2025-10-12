import React, { useState, useCallback, useMemo } from 'react';
import { Sample, SampleType, DrillHole, Standard, Blank, Project, Sampler, LogInterval, ConditionCode, RecoveryCode, CombinedInterval } from './types';
import HoleInfoForm from './components/HoleInfoForm';
import SampleControls from './components/SampleControls';
import DrillHoleLog from './components/DrillHoleLog';
import SampleTable from './components/SampleTable';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import Modal from './components/Modal';
import ExportModal from './components/ExportModal';
import NotSampledModal from './components/NotSampledModal';
import CombinedLogTable from './components/CombinedLogTable';

const incrementAlphanumeric = (id: string): string => {
  const match = id.match(/^(.*?)(\d+)$/);
  if (!match) return id + '1';
  const prefix = match[1];
  const numberPart = match[2];
  const nextNumber = parseInt(numberPart, 10) + 1;
  return prefix + String(nextNumber).padStart(numberPart.length, '0');
};

const getNextStartSampleIdFor = (previousHole: DrillHole | undefined): string => {
    if (!previousHole) {
        return 'S00001';
    }
    const sortedSamples = [...previousHole.samples].sort((a, b) => a.from - b.from);
    const lastNumberedSample = sortedSamples.reverse().find(s => !!s.id && s.type !== SampleType.NotSampled);
    if (lastNumberedSample) {
        return incrementAlphanumeric(lastNumberedSample.id);
    }
    return previousHole.firstSampleId;
}

const createNewHole = (id: string, lastHole?: DrillHole, uuid?: string): DrillHole => {
    return {
        uuid: uuid || crypto.randomUUID(),
        holeId: id,
        holeDepth: 0,
        firstSampleId: getNextStartSampleIdFor(lastHole),
        samples: [],
        projectUuid: lastHole?.projectUuid,
        samplerUuid: lastHole?.samplerUuid,
        sampledDate: new Date().toISOString().split('T')[0],
        conditionLog: [],
        recoveryLog: [],
    };
};

const calculateCombinedIntervals = (hole: DrillHole): CombinedInterval[] => {
    if (!hole || hole.holeDepth <= 0) return [];

    const { conditionLog, recoveryLog, holeDepth } = hole;

    const points = new Set([0, holeDepth]);
    conditionLog.forEach(i => { points.add(i.from); points.add(i.to); });
    recoveryLog.forEach(i => { points.add(i.from); points.add(i.to); });

    const sortedPoints = Array.from(points).filter(p => p <= holeDepth).sort((a, b) => a - b);
    
    const findCode = (log: LogInterval[], depth: number) => {
        const interval = log.find(i => depth >= i.from && depth < i.to);
        return interval ? interval.code : 'N/A';
    };

    const initialIntervals: CombinedInterval[] = [];
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const from = sortedPoints[i];
        const to = sortedPoints[i+1];
        if (from === to) continue;
        
        const midPoint = from + (to - from) / 2;
        initialIntervals.push({
            from,
            to,
            conditionCode: findCode(conditionLog, midPoint),
            recoveryCode: findCode(recoveryLog, midPoint),
        });
    }
    
    if (initialIntervals.length === 0) return [];

    const mergedIntervals: CombinedInterval[] = [initialIntervals[0]];
    for (let i = 1; i < initialIntervals.length; i++) {
        const last = mergedIntervals[mergedIntervals.length - 1];
        const current = initialIntervals[i];
        if (current.conditionCode === last.conditionCode && current.recoveryCode === last.recoveryCode) {
            last.to = current.to;
        } else {
            mergedIntervals.push(current);
        }
    }

    return mergedIntervals;
};


function App() {
  const [view, setView] = useState<'logger' | 'admin'>('logger');

  // Admin state
  const [standards, setStandards] = useState<Standard[]>([{uuid: crypto.randomUUID(), name: 'OREAS-25c'}]);
  const [blanks, setBlanks] = useState<Blank[]>([{uuid: crypto.randomUUID(), name: 'Silica Blank'}]);
  const [projects, setProjects] = useState<Project[]>([
    { uuid: crypto.randomUUID(), code: 'REB', description: 'Rebecca' },
    { uuid: crypto.randomUUID(), code: 'ROE', description: 'Roe' },
    { uuid: crypto.randomUUID(), code: 'MMG', description: 'Mt Magnet' },
  ]);
  const [samplers, setSamplers] = useState<Sampler[]>([{uuid: crypto.randomUUID(), name: 'Sam Ulrich'}]);
  
  // Logger state
  const [drillHoles, setDrillHoles] = useState<DrillHole[]>([createNewHole('', undefined, 'default-hole')]);
  const [activeHoleUuid, setActiveHoleUuid] = useState<string | null>('default-hole');
  
  const [selectedSampleUuids, setSelectedSampleUuids] = useState<string[]>([]);
  const [sampleInterval, setSampleInterval] = useState<number>(4);
  const [activeLogTab, setActiveLogTab] = useState<'samples' | 'condition' | 'recovery'>('samples');

  // Modal State
  const [isStandardModalOpen, setStandardModalOpen] = useState(false);
  const [isBlankModalOpen, setBlankModalOpen] = useState(false);
  const [isNotSampledModalOpen, setNotSampledModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [modalTargetSample, setModalTargetSample] = useState<Sample | null>(null);

  const activeHole = useMemo(() => drillHoles.find(h => h.uuid === activeHoleUuid), [drillHoles, activeHoleUuid]);

  const isHoleInfoComplete = useMemo(() => {
    if (!activeHole) return false;
    return !!(
      activeHole.projectUuid &&
      activeHole.holeId.trim() &&
      activeHole.samplerUuid &&
      activeHole.sampledDate &&
      activeHole.holeDepth > 0 &&
      activeHole.firstSampleId.trim()
    );
  }, [activeHole]);

  const renumberSamples = useCallback((sampleArray: (Omit<Sample, 'id' | 'uuid'> & { id?: string; uuid?: string })[], firstSampleId: string): Sample[] => {
    let currentSampleId = firstSampleId;
    const sorted = [...sampleArray].sort((a,b) => a.from - b.from || a.to - b.to);
    
    const numberedSamples: Sample[] = sorted.map(s => {
       const isNumbered = [SampleType.Primary, SampleType.Duplicate, SampleType.Standard, SampleType.Blank].includes(s.type);
       const newSample: Omit<Sample, 'id'> = { ...s, uuid: s.uuid || crypto.randomUUID() };
       
       let newId = '';
        if (s.type === SampleType.NotSampled && s.id) {
            newId = s.id;
        } else if (isNumbered) {
         newId = currentSampleId;
         currentSampleId = incrementAlphanumeric(currentSampleId);
       }
       return { ...newSample, id: newId };
    });

    const primarySampleMap = new Map<string, string>();
    numberedSamples.forEach(sample => {
        if (sample.type === SampleType.Primary) {
            const key = `${sample.from}-${sample.to}`;
            primarySampleMap.set(key, sample.id);
        }
    });

    return numberedSamples.map(sample => {
        if (sample.type === SampleType.Duplicate) {
            const key = `${sample.from}-${sample.to}`;
            const primaryId = primarySampleMap.get(key);
            return { ...sample, pSampleId: primaryId };
        }
        const { pSampleId, ...rest } = sample;
        return rest;
    });
  }, []);

  const renumberCascadingHoles = useCallback((allHoles: DrillHole[], changedHoleIndex: number): DrillHole[] => {
      if (changedHoleIndex >= allHoles.length - 1) {
          return allHoles;
      }

      const updatedHoles = [...allHoles];

      for (let i = changedHoleIndex + 1; i < updatedHoles.length; i++) {
          const previousHole = updatedHoles[i - 1];
          const currentHole = updatedHoles[i];
          
          const newFirstSampleId = getNextStartSampleIdFor(previousHole);

          if (newFirstSampleId === currentHole.firstSampleId) continue;
          
          const renumberedSamples = renumberSamples(currentHole.samples, newFirstSampleId);
          updatedHoles[i] = { ...currentHole, firstSampleId: newFirstSampleId, samples: renumberedSamples };
      }

      return updatedHoles;
  }, [renumberSamples]);

  const handleUpdateHoleInfo = (updatedInfo: Partial<DrillHole>) => {
    const activeHoleIndex = drillHoles.findIndex(h => h.uuid === activeHoleUuid);
    if (activeHoleIndex === -1) return;

    const tempHoles = [...drillHoles];
    const oldFirstSampleId = tempHoles[activeHoleIndex].firstSampleId;
    tempHoles[activeHoleIndex] = { ...tempHoles[activeHoleIndex], ...updatedInfo };
    const newFirstSampleId = tempHoles[activeHoleIndex].firstSampleId;
    
    let finalHoles = tempHoles;
    // If firstSampleId changed, renumber current hole and cascade
    if ('firstSampleId' in updatedInfo && newFirstSampleId !== oldFirstSampleId) {
         const renumberedSamples = renumberSamples(tempHoles[activeHoleIndex].samples, newFirstSampleId);
         finalHoles[activeHoleIndex] = { ...finalHoles[activeHoleIndex], samples: renumberedSamples };
         finalHoles = renumberCascadingHoles(finalHoles, activeHoleIndex);
    }

    setDrillHoles(finalHoles);
  };

  const modifySamples = useCallback((modifier: (samples: Sample[]) => (Omit<Sample, 'id' | 'uuid'> & { id?: string; uuid?: string })[]) => {
    if (!activeHole) return;
    
    const activeHoleIndex = drillHoles.findIndex(h => h.uuid === activeHoleUuid);
    if (activeHoleIndex === -1) return;
    
    const modifiedRaw = modifier(activeHole.samples);
    const renumbered = renumberSamples(modifiedRaw, activeHole.firstSampleId);

    const tempHoles = [...drillHoles];
    tempHoles[activeHoleIndex] = { ...tempHoles[activeHoleIndex], samples: renumbered };
    
    const finalHoles = renumberCascadingHoles(tempHoles, activeHoleIndex);
    
    setDrillHoles(finalHoles);
    setSelectedSampleUuids([]);
  }, [activeHole, drillHoles, activeHoleUuid, renumberSamples, renumberCascadingHoles]);

  const handleGenerateSamples = useCallback(() => {
    if (!activeHole || !isHoleInfoComplete) return;
    const { holeDepth } = activeHole;

    modifySamples(currentSamples => {
        const nonPrimarySamples = currentSamples.filter(s => s.type !== SampleType.Primary);
        const newPrimarySamplesRaw: Omit<Sample, 'id' | 'uuid'>[] = [];
        
        if (holeDepth > 0) {
            if (sampleInterval === 1) {
                let currentDepth = 0;
                while (currentDepth < holeDepth) {
                    const to = Math.min(currentDepth + 1, holeDepth);
                    if (to > currentDepth) {
                        newPrimarySamplesRaw.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'CHIPS', sampleMethod: 'CONE' });
                    }
                    currentDepth = to;
                }
            } else { // Handles 4m interval with 1m at the end
                const endOfHole = holeDepth;
                const lastMeterStart = Math.max(0, endOfHole - 1);
                
                // Generate composite samples up to the start of the last meter
                let currentDepth = 0;
                while (currentDepth < lastMeterStart) {
                    const to = Math.min(currentDepth + sampleInterval, lastMeterStart);
                     if (to > currentDepth) {
                        newPrimarySamplesRaw.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'COMP', sampleMethod: 'SCOOP' });
                    }
                    currentDepth = to;
                }
                
                // Add the final 1m sample
                if (lastMeterStart < endOfHole) {
                    newPrimarySamplesRaw.push({ from: lastMeterStart, to: endOfHole, type: SampleType.Primary, sampleType: 'CHIPS', sampleMethod: 'CONE' });
                }
            }
        }
        
        // This simple regeneration overwrites existing primary samples but preserves QC samples.
        // For more complex scenarios (like filling gaps), a different strategy would be needed.
        return [...nonPrimarySamples, ...newPrimarySamplesRaw];
    });
  }, [activeHole, isHoleInfoComplete, sampleInterval, modifySamples]);
  
  const selectedSamples = useMemo(() => {
    return activeHole?.samples.filter(s => selectedSampleUuids.includes(s.uuid)) || [];
  }, [activeHole, selectedSampleUuids]);
  
  const handleAddDuplicate = useCallback((targetSample?: Sample) => {
    const sampleToAddDuplicateTo = targetSample || selectedSamples[0];
    if (!sampleToAddDuplicateTo || sampleToAddDuplicateTo.type !== SampleType.Primary) return;

    const hasDuplicate = activeHole?.samples.some(s => 
        s.from === sampleToAddDuplicateTo.from && 
        s.to === sampleToAddDuplicateTo.to && 
        s.type === SampleType.Duplicate
    );
    if (hasDuplicate) return;

    modifySamples(samples => {
      const newDuplicate = { 
        from: sampleToAddDuplicateTo.from, 
        to: sampleToAddDuplicateTo.to, 
        type: SampleType.Duplicate,
        sampleType: sampleToAddDuplicateTo.sampleType,
        sampleMethod: sampleToAddDuplicateTo.sampleMethod,
      };
      return [...samples, newDuplicate];
    });
  }, [selectedSamples, modifySamples, activeHole]);
  
  const handleInsertStandard = useCallback((targetSample: Sample, standardName: string) => {
    if (!targetSample) return;
    modifySamples(samples => {
      const selectedIndex = samples.findIndex(s => s.uuid === targetSample.uuid);
      if (selectedIndex === -1) return samples;
      const newSample = { from: targetSample.to, to: targetSample.to, type: SampleType.Standard, materialName: standardName };
      const newSamplesList = [...samples.slice(0, selectedIndex + 1), newSample, ...samples.slice(selectedIndex + 1)];
      return newSamplesList;
    });
  }, [modifySamples]);
  
  const handleInsertBlank = useCallback((targetSample: Sample, blankName: string) => {
    if (!targetSample) return;
    modifySamples(samples => {
      const selectedIndex = samples.findIndex(s => s.uuid === targetSample.uuid);
      if (selectedIndex === -1) return samples;
      const newSample = { from: targetSample.to, to: targetSample.to, type: SampleType.Blank, materialName: blankName };
      const newSamplesList = [...samples.slice(0, selectedIndex + 1), newSample, ...samples.slice(selectedIndex + 1)];
      return newSamplesList;
    });
  }, [modifySamples]);

  const handleSplitSample = useCallback((targetSample?: Sample) => {
    const samplesToProcess = selectedSamples.length > 0 
      ? selectedSamples 
      : (targetSample ? [targetSample] : []);
    
    if (samplesToProcess.length === 0) return;

    modifySamples(samples => {
        const samplesToSplit = samplesToProcess.filter(s => s.type === SampleType.Primary && (s.to - s.from) > 1);
        if(samplesToSplit.length === 0) return samples;

        const unchangedSamples = samples.filter(s => !samplesToSplit.find(sts => sts.uuid === s.uuid));
        const splitSamples: Omit<Sample, 'id' | 'uuid'>[] = [];

        samplesToSplit.forEach(sample => {
            let currentDepth = sample.from;
            while(currentDepth < sample.to) {
                const to = Math.min(currentDepth + 1, sample.to);
                splitSamples.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'CHIPS', sampleMethod: 'CONE' });
                currentDepth = to;
            }
        });
        return [...unchangedSamples, ...splitSamples];
    });
  }, [selectedSamples, modifySamples]);

  const handleMergeSamples = useCallback(() => {
    if (selectedSamples.length < 2) return;
    modifySamples(samples => {
      const selected = selectedSamples.filter(s => s.type === SampleType.Primary && (s.to - s.from) === 1).sort((a,b) => a.from - b.from);
      if (selected.length < 2) return samples;

      const groupsToMerge: Sample[][] = [];
      let currentGroup: Sample[] = [selected[0]];

      for (let i = 1; i < selected.length; i++) {
          if (selected[i].from === currentGroup[currentGroup.length - 1].to) {
              currentGroup.push(selected[i]);
          } else {
              if (currentGroup.length > 1) groupsToMerge.push(currentGroup);
              currentGroup = [selected[i]];
          }
      }
      if (currentGroup.length > 1) groupsToMerge.push(currentGroup);
      if (groupsToMerge.length === 0) return samples;

      const uuidsToRemove = new Set(groupsToMerge.flat().map(s => s.uuid));
      const samplesToAdd = groupsToMerge.map(group => {
          const from = group[0].from;
          const to = group[group.length - 1].to;
          const length = to - from;
          
          let sampleProperties = {};
          if (length === 1) {
              sampleProperties = { sampleType: 'CHIPS', sampleMethod: 'CONE' };
          } else if (length === 4) {
              sampleProperties = { sampleType: 'COMP', sampleMethod: 'SCOOP' };
          }
          
          return {
              from,
              to,
              type: SampleType.Primary,
              ...sampleProperties
          };
      });
      
      let newSamples = samples.filter(s => !uuidsToRemove.has(s.uuid));
      return [...newSamples, ...samplesToAdd];
    });
  }, [selectedSamples, modifySamples]);

  const handleDeleteSamples = useCallback(() => {
    if (selectedSamples.length === 0) return;
    modifySamples(samples => {
      const deletableUuids = new Set(selectedSamples.filter(s => s.type !== SampleType.Primary).map(s => s.uuid));
      return deletableUuids.size > 0 ? samples.filter(s => !deletableUuids.has(s.uuid)) : samples;
    });
  }, [selectedSamples, modifySamples]);

  const handleDeleteSingleSample = useCallback((sampleToDelete: Sample) => {
    if (sampleToDelete.type === SampleType.Primary) return;

    if (sampleToDelete.type === SampleType.NotSampled) {
        const { from, to } = sampleToDelete;
        const sampleProperties = sampleInterval === 1 
            ? { sampleType: 'CHIPS', sampleMethod: 'CONE' }
            : sampleInterval === 4
            ? { sampleType: 'COMP', sampleMethod: 'SCOOP' }
            : {};
        
        const newSamplesForGap: Omit<Sample, 'id' | 'uuid'>[] = [];
        let currentDepth = from;
        while (currentDepth < to) {
            const newTo = Math.min(currentDepth + sampleInterval, to);
            if (newTo > currentDepth) {
                newSamplesForGap.push({ from: currentDepth, to: newTo, type: SampleType.Primary, ...sampleProperties });
            }
            currentDepth = newTo;
        }

        modifySamples(samples => {
            const otherSamples = samples.filter(s => s.uuid !== sampleToDelete.uuid);
            return [...otherSamples, ...newSamplesForGap];
        });

    } else { // Standard, Blank, Duplicate
        modifySamples(samples => samples.filter(s => s.uuid !== sampleToDelete.uuid));
    }
    setSelectedSampleUuids(prev => prev.filter(uuid => uuid !== sampleToDelete.uuid));
  }, [modifySamples, sampleInterval]);

   const handleAddNotSampledInterval = useCallback((from: number, to: number) => {
    if (!activeHole || to <= from || from < 0 || to > activeHole.holeDepth) {
        alert("Invalid interval. 'From' must be less than 'To', and the interval must be within the hole depth.");
        return;
    }

    const conflict = activeHole.samples.find(s => 
        s.type !== SampleType.Primary && s.type !== SampleType.NotSampled && Math.max(s.from, from) < Math.min(s.to, to)
    );
    if (conflict) {
        alert(`Cannot add interval. It conflicts with a non-primary sample (${conflict.id} from ${conflict.from} to ${conflict.to}).`);
        return;
    }

    modifySamples(samples => {
        const newNotSampled = {
            id: `NS_${activeHole.holeId}_${from}_${to}`,
            from,
            to,
            type: SampleType.NotSampled,
        };

        const adjustedSamples = samples.flatMap(s => {
            if (s.type !== SampleType.Primary) return [s];
            if (s.to <= from || s.from >= to) return [s];
            if (s.from >= from && s.to <= to) return [];
            if (s.from < from && s.to > to) {
                return [
                    { ...s, to: from },
                    { ...s, from: to }
                ];
            }
            if (s.from < from && s.to > from) return [{ ...s, to: from }];
            if (s.from < to && s.to > to) return [{ ...s, from: to }];
            return [s]; 
        });

        return [...adjustedSamples, newNotSampled];
    });
  }, [activeHole, modifySamples]);

  const handleUpdateIntervalLog = useCallback((logType: 'condition' | 'recovery', from: number, to: number, code: ConditionCode | RecoveryCode) => {
    setDrillHoles(currentHoles => {
        const activeHoleIndex = currentHoles.findIndex(h => h.uuid === activeHoleUuid);
        if (activeHoleIndex === -1) return currentHoles;

        const holeToUpdate = { ...currentHoles[activeHoleIndex] };
        const isNoSample = code === ConditionCode.NoSample;

        const updateLog = (log: LogInterval[], newCode: ConditionCode | RecoveryCode): LogInterval[] => {
            const logMap = new Map<number, string>();
            log.forEach(interval => {
                for (let i = interval.from; i < interval.to; i++) {
                    logMap.set(i, interval.code);
                }
            });

            for (let i = from; i < to; i++) {
                logMap.set(i, newCode);
            }

            const newLog: LogInterval[] = [];
            let currentInterval: LogInterval | null = null;
            for (let i = 0; i < holeToUpdate.holeDepth; i++) {
                const meterCode = logMap.get(i);
                if (meterCode) {
                    if (currentInterval && currentInterval.code === meterCode) {
                        currentInterval.to = i + 1;
                    } else {
                        if (currentInterval) newLog.push(currentInterval);
                        currentInterval = { from: i, to: i + 1, code: meterCode as ConditionCode | RecoveryCode };
                    }
                } else {
                    if (currentInterval) newLog.push(currentInterval);
                    currentInterval = null;
                }
            }
            if (currentInterval) newLog.push(currentInterval);
            return newLog;
        };
        
        if (logType === 'condition') {
            holeToUpdate.conditionLog = updateLog(holeToUpdate.conditionLog, code);
            if (isNoSample) {
                holeToUpdate.recoveryLog = updateLog(holeToUpdate.recoveryLog, RecoveryCode.NoSample);
            }
        } else { // recovery
            holeToUpdate.recoveryLog = updateLog(holeToUpdate.recoveryLog, code);
            if (isNoSample) {
                holeToUpdate.conditionLog = updateLog(holeToUpdate.conditionLog, ConditionCode.NoSample);
            }
        }

        const newHoles = [...currentHoles];
        newHoles[activeHoleIndex] = holeToUpdate;
        return newHoles;
    });
  }, [activeHoleUuid]);

  const handleToggleSelection = useCallback((uuid: string) => {
    setSelectedSampleUuids(prev => prev.includes(uuid) ? prev.filter(u => u !== uuid) : [...prev, uuid]);
  }, []);

  const handleSelectAll = useCallback((select: boolean) => {
    setSelectedSampleUuids(select ? (activeHole?.samples.map(s => s.uuid) || []) : []);
  }, [activeHole]);

  const handleAddHole = () => {
    const lastHole = drillHoles.length > 0 ? drillHoles[drillHoles.length - 1] : undefined;
    const newHoleId = lastHole && lastHole.holeId ? incrementAlphanumeric(lastHole.holeId) : '';
    const newHole = createNewHole(newHoleId, lastHole);
    setDrillHoles(prev => [...prev, newHole]);
    setActiveHoleUuid(newHole.uuid);
    setView('logger');
  };

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportData = (holeUuids: string[]) => {
    const holesToExport = drillHoles.filter(h => holeUuids.includes(h.uuid));
    if (holesToExport.length === 0) return;

    // --- SAMPLES EXPORT ---
    const sampleHeaders = ['Project Code', 'Hole ID', 'Sampled By', 'Sampled Date', 'Sample ID', 'From (m)', 'To (m)', 'Length (m)', 'Category', 'PSample ID', 'Sample Type', 'Sample Method', 'Std/Blk ID'];
    const allSampleRows: string[] = [];
    holesToExport.forEach(hole => {
        const project = projects.find(p => p.uuid === hole.projectUuid);
        const sampler = samplers.find(s => s.uuid === hole.samplerUuid);
        const rows = hole.samples.map(s => [
          project?.code || '', hole.holeId, sampler?.name || '', hole.sampledDate, s.id || '', 
          s.from.toFixed(2), s.to.toFixed(2), (s.to - s.from).toFixed(2), s.type,
          s.pSampleId || '', s.sampleType || '', s.sampleMethod || '', s.materialName || ''
        ].join(','));
        allSampleRows.push(...rows);
    });
    
    if (allSampleRows.length > 0) {
        const sampleCsvContent = [sampleHeaders.join(','), ...allSampleRows].join('\n');
        downloadCsv('drillhole_samples_export.csv', sampleCsvContent);
    } else {
        alert("Selected drillholes have no samples to export.");
    }

    // --- CONDITION & RECOVERY EXPORT ---
    const conditionHeaders = ['Project', 'Hole ID', 'From', 'To', 'Condition', 'Recovery', 'Sampled By', 'Date'];
    const allConditionRows: string[] = [];
    holesToExport.forEach(hole => {
      const project = projects.find(p => p.uuid === hole.projectUuid);
      const sampler = samplers.find(s => s.uuid === hole.samplerUuid);
      const combinedIntervals = calculateCombinedIntervals(hole);
      const rows = combinedIntervals.map(i => [
          project?.code || '', hole.holeId, i.from.toFixed(2), i.to.toFixed(2),
          i.conditionCode, i.recoveryCode, sampler?.name || '', hole.sampledDate
      ].join(','));
      allConditionRows.push(...rows);
    });

    if (allConditionRows.length > 0) {
      const conditionCsvContent = [conditionHeaders.join(','), ...allConditionRows].join('\n');
      downloadCsv('drillhole_condition_recovery_export.csv', conditionCsvContent);
    } else {
        alert("Selected drillholes have no condition or recovery data to export.");
    }

    setExportModalOpen(false);
  };
  
  const openStandardModal = () => { if(selectedSamples.length === 1) { setModalTargetSample(selectedSamples[0]); setStandardModalOpen(true); } };
  const openBlankModal = () => { if(selectedSamples.length === 1) { setModalTargetSample(selectedSamples[0]); setBlankModalOpen(true); } };

  const combinedLogForActiveHole = useMemo(() => {
    return activeHole ? calculateCombinedIntervals(activeHole) : [];
  }, [activeHole]);


  return (
    <div className="h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col">
      <Header 
        view={view} 
        setView={setView} 
        drillHoles={drillHoles}
        activeHoleUuid={activeHoleUuid}
        onSelectHole={setActiveHoleUuid}
        onAddHole={handleAddHole}
        onOpenExportModal={() => setExportModalOpen(true)}
      />
      {view === 'admin' ? (
        <AdminPanel 
          standards={standards} setStandards={setStandards} 
          blanks={blanks} setBlanks={setBlanks}
          projects={projects} setProjects={setProjects}
          samplers={samplers} setSamplers={setSamplers}
        />
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8 flex-grow min-h-0">
          <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            <HoleInfoForm activeHole={activeHole} onUpdate={handleUpdateHoleInfo} projects={projects} samplers={samplers} />
            <SampleControls
              sampleInterval={sampleInterval}
              setSampleInterval={setSampleInterval}
              onGenerate={handleGenerateSamples}
              onAddDuplicate={() => handleAddDuplicate()}
              onOpenStandardModal={openStandardModal}
              onOpenBlankModal={openBlankModal}
              onOpenNotSampledModal={() => setNotSampledModalOpen(true)}
              onSplit={handleSplitSample}
              onMerge={handleMergeSamples}
              onDelete={handleDeleteSamples}
              selectedSamples={selectedSamples}
              isHoleSelected={!!activeHole}
              isHoleInfoComplete={isHoleInfoComplete}
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-10 gap-8 min-h-0">
              <div className="xl:col-span-3 min-h-0">
                <DrillHoleLog
                    samples={activeHole?.samples || []}
                    holeDepth={activeHole?.holeDepth || 0}
                    conditionLog={activeHole?.conditionLog || []}
                    recoveryLog={activeHole?.recoveryLog || []}
                    selectedSampleUuids={selectedSampleUuids}
                    onToggleSelection={handleToggleSelection}
                    onAddDuplicate={handleAddDuplicate}
                    onInsertStandard={(s) => { setModalTargetSample(s); setStandardModalOpen(true); }}
                    onInsertBlank={(s) => { setModalTargetSample(s); setBlankModalOpen(true); }}
                    onSplit={handleSplitSample}
                    onDelete={handleDeleteSingleSample}
                    onUpdateIntervalLog={handleUpdateIntervalLog}
                    activeTab={activeLogTab}
                    onTabChange={setActiveLogTab}
                />
              </div>
              <div className="xl:col-span-7 min-h-0">
                 {activeLogTab === 'samples' ? (
                    <SampleTable
                        samples={activeHole?.samples || []}
                        selectedSampleUuids={selectedSampleUuids}
                        onToggleSelection={handleToggleSelection}
                        onSelectAll={handleSelectAll}
                    />
                 ) : (
                    <CombinedLogTable 
                        activeHole={activeHole}
                        projects={projects}
                        samplers={samplers}
                        combinedIntervals={combinedLogForActiveHole}
                    />
                 )}
              </div>
          </div>
        </main>
      )}
      <Modal isOpen={isStandardModalOpen} onClose={() => setStandardModalOpen(false)} title="Select a Standard">
        <div className="space-y-2">
          {standards.length > 0 ? standards.map(std => (
            <button key={std.uuid} onClick={() => { handleInsertStandard(modalTargetSample!, std.name); setStandardModalOpen(false); }}
              className="w-full text-left p-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              {std.name}
            </button>
          )) : <p className="text-slate-500">No Standards defined. Go to the Admin panel to add one.</p>}
        </div>
      </Modal>
      <Modal isOpen={isBlankModalOpen} onClose={() => setBlankModalOpen(false)} title="Select a Blank">
        <div className="space-y-2">
        {blanks.length > 0 ? blanks.map(blk => (
            <button key={blk.uuid} onClick={() => { handleInsertBlank(modalTargetSample!, blk.name); setBlankModalOpen(false); }}
              className="w-full text-left p-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              {blk.name}
            </button>
          )) : <p className="text-slate-500">No Blanks defined. Go to the Admin panel to add one.</p>}
        </div>
      </Modal>
      <NotSampledModal 
          isOpen={isNotSampledModalOpen} 
          onClose={() => setNotSampledModalOpen(false)}
          onSubmit={handleAddNotSampledInterval}
          maxDepth={activeHole?.holeDepth || 0}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        drillHoles={drillHoles}
        onExport={handleExportData}
      />
    </div>
  );
}

export default App;