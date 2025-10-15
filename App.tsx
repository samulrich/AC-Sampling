import React, { useState, useCallback, useMemo } from 'react';
import { Sample, SampleType, DrillHole, Standard, Blank, Project, Sampler, LogInterval, ConditionCode, RecoveryCode, CombinedInterval, QCConfig, QCRate } from './types';
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
import DeleteModal from './components/DeleteModal';
import AlertModal from './components/AlertModal';
import SelectionPopover from './components/SelectionPopover';
import InstructionsPanel from './components/InstructionsPanel';

const incrementAlphanumeric = (id: string): string => {
  if (!id) return '1';
  const match = id.match(/^(.*?)(\d+)$/);
  if (!match) return id + '1';
  const prefix = match[1];
  const numberPart = match[2];
  const nextNumber = parseInt(numberPart, 10) + 1;
  return prefix + String(nextNumber).padStart(numberPart.length, '0');
};

const getNextStartSampleIdFor = (previousHole: DrillHole | undefined): string => {
    if (!previousHole) {
        return '';
    }
    const sortedSamples = [...previousHole.samples].sort((a, b) => a.from - b.from);
    const lastNumberedSample = sortedSamples.reverse().find(s => !!s.id && s.type !== SampleType.NotSampled);

    if (lastNumberedSample && lastNumberedSample.id) {
        return incrementAlphanumeric(lastNumberedSample.id);
    }
    
    // If the previous hole has no numbered samples, the next sequence starts where the previous one was supposed to.
    return previousHole.firstSampleId;
}

const createNewHole = (id: string, lastHole?: DrillHole, uuid?: string): DrillHole => {
    const firstSampleId = getNextStartSampleIdFor(lastHole);
    return {
        uuid: uuid || crypto.randomUUID(),
        holeId: id,
        holeDepth: 0,
        firstSampleId: firstSampleId,
        samples: [],
        projectUuid: lastHole?.projectUuid,
        samplerUuid: lastHole?.samplerUuid,
        sampledDate: new Date().toISOString().split('T')[0],
        conditionLog: [],
        recoveryLog: [],
        autoQcApplied: false,
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

interface SelectionPopoverState {
  isOpen: boolean;
  type: 'standard' | 'blank' | null;
  targetRect: DOMRect | null;
  targetSample: Sample | null;
}

function App() {
  const [view, setView] = useState<'logger' | 'admin'>('logger');

  // Admin state
  const [standards, setStandards] = useState<Standard[]>([{uuid: crypto.randomUUID(), name: 'OREAS-25c'}, {uuid: crypto.randomUUID(), name: 'G910-1'}]);
  const [blanks, setBlanks] = useState<Blank[]>([{uuid: crypto.randomUUID(), name: 'Silica Blank'}, {uuid: crypto.randomUUID(), name: 'Blank'}]);
  const [projects, setProjects] = useState<Project[]>([
    { uuid: crypto.randomUUID(), code: 'REB', description: 'Rebecca' },
    { uuid: crypto.randomUUID(), code: 'ROE', description: 'Roe' },
    { uuid: crypto.randomUUID(), code: 'MMG', description: 'Mt Magnet' },
  ]);
  const [samplers, setSamplers] = useState<Sampler[]>([{uuid: crypto.randomUUID(), name: 'Sam Ulrich'}]);
  const [qcConfig, setQcConfig] = useState<QCConfig>({
    standard: { rate: QCRate.Fifty, triggers: [{ ending: '15' }, { ending: '65' }] },
    blank: { rate: QCRate.Fifty, triggers: [{ ending: '25' }, { ending: '75' }] },
    duplicate: { rate: QCRate.Fifty, triggers: [{ ending: '35' }, { ending: '85' }] },
  });
  const [isAutoQcEnabled, setIsAutoQcEnabled] = useState(false);
  
  // Logger state
  const [drillHoles, setDrillHoles] = useState<DrillHole[]>([createNewHole('', undefined, 'default-hole')]);
  const [activeHoleUuid, setActiveHoleUuid] = useState<string | null>('default-hole');
  
  const [selectedSampleUuids, setSelectedSampleUuids] = useState<string[]>([]);
  const [sampleInterval, setSampleInterval] = useState<number>(1);
  const [mainViewTab, setMainViewTab] = useState<'samples' | 'condition'>('samples');

  // Modal State
  const [isNotSampledModalOpen, setNotSampledModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertModalInfo, setAlertModalInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  const [selectionPopover, setSelectionPopover] = useState<SelectionPopoverState>({
    isOpen: false,
    type: null,
    targetRect: null,
    targetSample: null,
  });


  const activeHole = useMemo(() => drillHoles.find(h => h.uuid === activeHoleUuid), [drillHoles, activeHoleUuid]);
  const hasPrimarySamples = useMemo(() => activeHole?.samples.some(s => s.type === SampleType.Primary) || false, [activeHole]);

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
    if (!firstSampleId) { // Fallback if the first ID is somehow invalid
        return sampleArray.map(s => ({ ...s, id: s.id || '', uuid: s.uuid || crypto.randomUUID() }));
    }

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
    if ('firstSampleId' in updatedInfo && newFirstSampleId !== oldFirstSampleId) {
         const renumberedSamples = renumberSamples(tempHoles[activeHoleIndex].samples, newFirstSampleId);
         finalHoles[activeHoleIndex] = { ...finalHoles[activeHoleIndex], samples: renumberedSamples };
         finalHoles = renumberCascadingHoles(finalHoles, activeHoleIndex);
    }

    setDrillHoles(finalHoles);
  };
  
  const setAutoQcFlag = useCallback((holeUuid: string, isEnabled: boolean) => {
    setDrillHoles(holes => holes.map(h => h.uuid === holeUuid ? { ...h, autoQcApplied: isEnabled } : h));
  }, []);


  const applyQCRulesAndRegenerate = useCallback((
    currentSamples: (Omit<Sample, 'id' | 'uuid'> & { id?: string; uuid?: string })[],
    firstSampleId: string,
    qcConfig: QCConfig
  ): (Omit<Sample, 'id' | 'uuid'>)[] => {

    const cleanBase = currentSamples
      .filter(s => s.type === SampleType.Primary || s.type === SampleType.NotSampled)
      .sort((a,b) => a.from - b.from || a.to - b.to);

    const match = firstSampleId.match(/^(.*?)(\d+)$/);
    if (!match) {
        setAlertModalInfo({ isOpen: true, title: "Invalid ID Format", message: "First Sample ID must end with numbers to apply QC rules."});
        return currentSamples;
    }
    const prefix = match[1];
    const padding = match[2].length;
    let currentSampleIdCounter = parseInt(match[2], 10);

    const { standard: stdRule, blank: blkRule, duplicate: dupRule } = qcConfig;
    const stdTriggers = new Set(stdRule.triggers.map(t => t.ending));
    const blkTriggers = new Set(blkRule.triggers.map(t => t.ending));
    const dupTriggers = new Set(dupRule.triggers.map(t => t.ending));

    const finalSampleList: (Omit<Sample, 'id' | 'uuid'>)[] = [];

    for (const sample of cleanBase) {
        if (sample.type === SampleType.Primary) {
            let nextIdString = `${prefix}${String(currentSampleIdCounter).padStart(padding, '0')}`;
            let lastTwoDigits = nextIdString.slice(-2);

            if (stdTriggers.has(lastTwoDigits)) {
                finalSampleList.push({ from: sample.from, to: sample.from, type: SampleType.Standard, materialName: 'Unassigned', assayType: 'Au' });
                currentSampleIdCounter++;
            } else if (blkTriggers.has(lastTwoDigits)) {
                finalSampleList.push({ from: sample.from, to: sample.from, type: SampleType.Blank, materialName: 'Unassigned', assayType: 'Au' });
                currentSampleIdCounter++;
            }

            const primaryIdString = `${prefix}${String(currentSampleIdCounter).padStart(padding, '0')}`;
            finalSampleList.push(sample);
            currentSampleIdCounter++;

            const primaryLastTwoDigits = primaryIdString.slice(-2);
            if (dupTriggers.has(primaryLastTwoDigits)) {
                finalSampleList.push({
                    from: sample.from, to: sample.to, type: SampleType.Duplicate,
                    sampleType: sample.sampleType, sampleMethod: sample.sampleMethod, assayType: sample.assayType,
                });
                currentSampleIdCounter++;
            }
        } else {
            finalSampleList.push(sample);
            if (sample.type === SampleType.Standard || sample.type === SampleType.Blank) {
                currentSampleIdCounter++;
            }
        }
    }

    return finalSampleList;
  }, [setAlertModalInfo]);


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
    
    setAutoQcFlag(activeHole.uuid, false);

    modifySamples(currentSamples => {
        const nonPrimarySamples = currentSamples.filter(s => s.type !== SampleType.Primary);
        const newPrimarySamplesRaw: Omit<Sample, 'id' | 'uuid'>[] = [];
        
        if (holeDepth > 0) {
            if (sampleInterval === 1) {
                let currentDepth = 0;
                while (currentDepth < holeDepth) {
                    const to = Math.min(currentDepth + 1, holeDepth);
                    if (to > currentDepth) {
                        const isLastSample = to === holeDepth;
                        newPrimarySamplesRaw.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'CHIPS', sampleMethod: 'SCOOP', assayType: isLastSample ? 'ME' : 'Au' });
                    }
                    currentDepth = to;
                }
            } else { // Handles 4m interval with special end-of-hole logic
                const endOfHole = holeDepth;
                const mainSamplingDepth = Math.max(0, endOfHole - 1);
                let currentDepth = 0;

                if (mainSamplingDepth > sampleInterval && mainSamplingDepth % sampleInterval === 1) {
                    const specialCaseStartDepth = mainSamplingDepth - (sampleInterval + 1);
                    
                    while (currentDepth < specialCaseStartDepth) {
                        const to = Math.min(currentDepth + sampleInterval, specialCaseStartDepth);
                        if (to > currentDepth) {
                            newPrimarySamplesRaw.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'COMP', sampleMethod: 'SCOOP', assayType: 'Au' });
                        }
                        currentDepth = to;
                    }
                    newPrimarySamplesRaw.push({ from: specialCaseStartDepth, to: specialCaseStartDepth + 3, type: SampleType.Primary, sampleType: 'COMP', sampleMethod: 'SCOOP', assayType: 'Au' });
                    newPrimarySamplesRaw.push({ from: specialCaseStartDepth + 3, to: mainSamplingDepth, type: SampleType.Primary, sampleType: 'COMP', sampleMethod: 'SCOOP', assayType: 'Au' });
                
                } else { 
                    while (currentDepth < mainSamplingDepth) {
                        const to = Math.min(currentDepth + sampleInterval, mainSamplingDepth);
                        if (to > currentDepth) {
                            newPrimarySamplesRaw.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'COMP', sampleMethod: 'SCOOP', assayType: 'Au' });
                        }
                        currentDepth = to;
                    }
                }

                if (mainSamplingDepth < endOfHole) {
                    newPrimarySamplesRaw.push({ from: mainSamplingDepth, to: endOfHole, type: SampleType.Primary, sampleType: 'CHIPS', sampleMethod: 'SCOOP', assayType: 'ME' });
                }
            }
        }
        
        return [...nonPrimarySamples, ...newPrimarySamplesRaw];
    });
  }, [activeHole, isHoleInfoComplete, sampleInterval, modifySamples, setAutoQcFlag]);
  
  const selectedSamples = useMemo(() => {
    return activeHole?.samples.filter(s => selectedSampleUuids.includes(s.uuid)) || [];
  }, [activeHole, selectedSampleUuids]);
  
  const handleAddDuplicate = useCallback((targetSample: Sample) => {
    if (!targetSample || targetSample.type !== SampleType.Primary) return;
    
    setAutoQcFlag(activeHole!.uuid, false);

    const hasDuplicate = activeHole?.samples.some(s => 
        s.from === targetSample.from && 
        s.to === targetSample.to && 
        s.type === SampleType.Duplicate
    );
    if (hasDuplicate) return;

    modifySamples(samples => {
      const newDuplicate = { 
        from: targetSample.from, 
        to: targetSample.to, 
        type: SampleType.Duplicate,
        sampleType: targetSample.sampleType,
        sampleMethod: targetSample.sampleMethod,
        assayType: targetSample.assayType || 'Au',
      };
      return [...samples, newDuplicate];
    });
  }, [modifySamples, activeHole, setAutoQcFlag]);

  const handleToggleMultiElement = useCallback((targetSample?: Sample) => {
    const samplesToToggle = targetSample ? [targetSample] : selectedSamples;
    if (!activeHole || samplesToToggle.length === 0) return;
    
    const activeHoleIndex = drillHoles.findIndex(h => h.uuid === activeHoleUuid);
    if (activeHoleIndex === -1) return;

    const shouldSetToME = samplesToToggle.some(s => s.assayType === 'Au' || !s.assayType);
    const newAssayType = shouldSetToME ? 'ME' : 'Au';

    const affectedIntervals = new Set(samplesToToggle.map(s => `${s.from}-${s.to}`));

    const updatedSamples = activeHole.samples.map(s => {
        const intervalKey = `${s.from}-${s.to}`;
        if ((s.type === SampleType.Primary || s.type === SampleType.Duplicate) && affectedIntervals.has(intervalKey)) {
            return { ...s, assayType: newAssayType };
        }
        return s;
    });

    const tempHoles = [...drillHoles];
    tempHoles[activeHoleIndex] = { ...tempHoles[activeHoleIndex], samples: updatedSamples };
    setDrillHoles(tempHoles);
    setSelectedSampleUuids([]);
  }, [activeHole, drillHoles, activeHoleUuid, selectedSamples]);

  const handleSplitSample = useCallback((targetSample?: Sample) => {
    const samplesToProcess = targetSample ? [targetSample] : selectedSamples;
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
                splitSamples.push({ from: currentDepth, to, type: SampleType.Primary, sampleType: 'CHIPS', sampleMethod: 'SCOOP', assayType: sample.assayType });
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
          
          let sampleProperties: Partial<Sample> = { assayType: 'Au' };
          if (length === 1) {
              sampleProperties = { ...sampleProperties, sampleType: 'CHIPS', sampleMethod: 'SCOOP' };
          } else if (length === 4) {
              sampleProperties = { ...sampleProperties, sampleType: 'COMP', sampleMethod: 'SCOOP' };
          }
          
          return { from, to, type: SampleType.Primary, ...sampleProperties };
      });
      
      let newSamples = samples.filter(s => !uuidsToRemove.has(s.uuid));
      return [...newSamples, ...samplesToAdd];
    });
  }, [selectedSamples, modifySamples]);

  const handleDeleteSamples = useCallback(() => {
    if (selectedSamples.length === 0 || !activeHole) return;

    setAutoQcFlag(activeHole.uuid, false);
    modifySamples(samples => {
      const deletableUuids = new Set(selectedSamples.filter(s => s.type !== SampleType.Primary).map(s => s.uuid));
      return deletableUuids.size > 0 ? samples.filter(s => !deletableUuids.has(s.uuid)) : samples;
    });
  }, [selectedSamples, modifySamples, activeHole, setAutoQcFlag]);

  const handleDeleteSingleSample = useCallback((sampleToDelete: Sample) => {
    if (!activeHole) return;
    if (sampleToDelete.type === SampleType.Primary) return;

    setAutoQcFlag(activeHole.uuid, false);

    if (sampleToDelete.type === SampleType.NotSampled) {
        const { from, to } = sampleToDelete;
        const sampleProperties = sampleInterval === 1 ? { sampleType: 'CHIPS', sampleMethod: 'SCOOP' } : { sampleType: 'COMP', sampleMethod: 'SCOOP' };
        
        const newSamplesForGap: Omit<Sample, 'id' | 'uuid'>[] = [];
        let currentDepth = from;
        while (currentDepth < to) {
            const newTo = Math.min(currentDepth + sampleInterval, to);
            if (newTo > currentDepth) {
                newSamplesForGap.push({ from: currentDepth, to: newTo, type: SampleType.Primary, assayType: 'Au', ...sampleProperties });
            }
            currentDepth = newTo;
        }
        modifySamples(samples => [...samples.filter(s => s.uuid !== sampleToDelete.uuid), ...newSamplesForGap]);
    } else { // Standard, Blank, Duplicate
        modifySamples(samples => samples.filter(s => s.uuid !== sampleToDelete.uuid));
    }
    setSelectedSampleUuids(prev => prev.filter(uuid => uuid !== sampleToDelete.uuid));
  }, [modifySamples, sampleInterval, activeHole, setAutoQcFlag]);

  const handleAddNotSampledInterval = useCallback((from: number, to: number, comment: string) => {
    if (!activeHole || to <= from || from < 0 || to > activeHole.holeDepth) {
        setAlertModalInfo({ isOpen: true, title: "Invalid Interval", message: "The 'From' and 'To' values for the Not Sampled interval are not valid." });
        return;
    }
    modifySamples(samples => {
        const newNotSampled = { id: `NS_${activeHole.holeId}_${from}_${to}`, from, to, type: SampleType.NotSampled, comment };
        
        const samplesWithPrimariesAdjusted = samples.flatMap(s => {
            if (s.type !== SampleType.Primary || s.to <= from || s.from >= to) return [s];
            if (s.from >= from && s.to <= to) return []; // Completely inside - remove
            if (s.from < from && s.to > to) return [ { ...s, to: from }, { ...s, from: to } ]; // Spans the interval - split
            if (s.from < from && s.to > from) return [{ ...s, to: from }]; // Overlaps start - truncate
            if (s.from < to && s.to > to) return [{ ...s, from: to }]; // Overlaps end - truncate
            return [s]; 
        });

        const intermediateSampleList = [...samplesWithPrimariesAdjusted, newNotSampled];
        
        if (isAutoQcEnabled && activeHole.autoQcApplied) {
            return applyQCRulesAndRegenerate(intermediateSampleList, activeHole.firstSampleId, qcConfig);
        }

        return intermediateSampleList;
    });
  }, [activeHole, modifySamples, applyQCRulesAndRegenerate, qcConfig, isAutoQcEnabled]);

  const handleUpdateIntervalLog = useCallback((logType: 'condition' | 'recovery', from: number, to: number, code: ConditionCode | RecoveryCode) => {
    setDrillHoles(currentHoles => {
        const activeHoleIndex = currentHoles.findIndex(h => h.uuid === activeHoleUuid);
        if (activeHoleIndex === -1) return currentHoles;

        const holeToUpdate = { ...currentHoles[activeHoleIndex] };
        const isNoSample = code === ConditionCode.NoSample;

        const updateLog = (log: LogInterval[], newCode: ConditionCode | RecoveryCode): LogInterval[] => {
            const logMap = new Map<number, string>();
            log.forEach(interval => { for (let i = interval.from; i < interval.to; i++) logMap.set(i, interval.code); });
            for (let i = from; i < to; i++) logMap.set(i, newCode);

            const newLog: LogInterval[] = [];
            let currentInterval: LogInterval | null = null;
            for (let i = 0; i < holeToUpdate.holeDepth; i++) {
                const meterCode = logMap.get(i);
                if (meterCode) {
                    if (currentInterval && currentInterval.code === meterCode) currentInterval.to = i + 1;
                    else {
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
            if (isNoSample) holeToUpdate.recoveryLog = updateLog(holeToUpdate.recoveryLog, RecoveryCode.NoSample);
        } else {
            holeToUpdate.recoveryLog = updateLog(holeToUpdate.recoveryLog, code);
            if (isNoSample) holeToUpdate.conditionLog = updateLog(holeToUpdate.conditionLog, ConditionCode.NoSample);
        }

        const newHoles = [...currentHoles];
        newHoles[activeHoleIndex] = holeToUpdate;
        return newHoles;
    });
  }, [activeHoleUuid]);

  const updateSampleInHole = useCallback((sampleUuid: string, updates: Partial<Sample>) => {
    setDrillHoles(currentHoles => {
        const activeHoleIndex = currentHoles.findIndex(h => h.uuid === activeHoleUuid);
        if (activeHoleIndex === -1) return currentHoles;

        const holeToUpdate = { ...currentHoles[activeHoleIndex] };
        holeToUpdate.samples = holeToUpdate.samples.map(s => s.uuid === sampleUuid ? { ...s, ...updates } : s );
        
        const newHoles = [...currentHoles];
        newHoles[activeHoleIndex] = holeToUpdate;
        return newHoles;
    });
  }, [activeHoleUuid]);

  const handleApplyQCRules = useCallback(() => {
    if (!activeHole || !isAutoQcEnabled) return;
    setAutoQcFlag(activeHole.uuid, true);
    modifySamples(currentSamples => applyQCRulesAndRegenerate(currentSamples, activeHole.firstSampleId, qcConfig));
  }, [activeHole, qcConfig, modifySamples, applyQCRulesAndRegenerate, setAutoQcFlag, isAutoQcEnabled]);

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
    const sampleHeaders = ['Project Code', 'Hole ID', 'Sampled By', 'Sampled Date', 'Sample ID', 'From (m)', 'To (m)', 'Length (m)', 'Category', 'Assay', 'PSample ID', 'Sample Type', 'Sample Method', 'Std/Blk ID', 'Sample Comments'];
    const allSampleRows = holesToExport.flatMap(hole => {
        const project = projects.find(p => p.uuid === hole.projectUuid);
        const sampler = samplers.find(s => s.uuid === hole.samplerUuid);
        return hole.samples.map(s => [
          project?.code || '', hole.holeId, sampler?.name || '', hole.sampledDate, s.id || '', 
          s.from.toFixed(2), s.to.toFixed(2), (s.to - s.from).toFixed(2), s.type, s.assayType || 'Au',
          s.pSampleId || '', s.sampleType || '', s.sampleMethod || '', s.materialName || '', s.comment || ''
        ].join(','));
    });
    if (allSampleRows.length > 0) downloadCsv('drillhole_samples_export.csv', [sampleHeaders.join(','), ...allSampleRows].join('\n'));

    // --- CONDITION & RECOVERY EXPORT ---
    const conditionHeaders = ['Project', 'Hole ID', 'From', 'To', 'Condition', 'Recovery', 'Sampled By', 'Date'];
    const allConditionRows = holesToExport.flatMap(hole => {
        const project = projects.find(p => p.uuid === hole.projectUuid);
        const sampler = samplers.find(s => s.uuid === hole.samplerUuid);
        return calculateCombinedIntervals(hole).map(i => [
            project?.code || '', hole.holeId, i.from.toFixed(2), i.to.toFixed(2),
            i.conditionCode, i.recoveryCode, sampler?.name || '', hole.sampledDate
        ].join(','));
    });
    if (allConditionRows.length > 0) downloadCsv('drillhole_condition_recovery_export.csv', [conditionHeaders.join(','), ...allConditionRows].join('\n'));
    setExportModalOpen(false);
  };

  const handleDeleteHoles = (uuidsToDelete: string[]) => {
    if (uuidsToDelete.length === 0) { setDeleteModalOpen(false); return; };

    const originalIndices = new Map(drillHoles.map((h, i) => [h.uuid, i]));
    const minDeletedIndex = Math.min(...(uuidsToDelete.map(uuid => originalIndices.get(uuid)!) as number[]));
    const remainingHoles = drillHoles.filter(h => !uuidsToDelete.includes(h.uuid));

    if (remainingHoles.length === 0) {
        const newHole = createNewHole('', undefined, 'default-hole');
        setDrillHoles([newHole]);
        setActiveHoleUuid(newHole.uuid);
    } else {
        let newActiveUuid = activeHoleUuid;
        if (activeHoleUuid && uuidsToDelete.includes(activeHoleUuid)) {
            const newIndex = Math.max(0, minDeletedIndex - 1);
            newActiveUuid = remainingHoles[newIndex]?.uuid || remainingHoles[0]?.uuid;
        }
        const renumberedHoles = renumberCascadingHoles(remainingHoles, minDeletedIndex - 1);
        setDrillHoles(renumberedHoles);
        setActiveHoleUuid(newActiveUuid);
    }
    setDeleteModalOpen(false);
  };

  const handleAssignMaterial = (sampleToAssign: Sample, targetRect: DOMRect) => {
    setSelectionPopover({
        isOpen: true,
        type: sampleToAssign.type === SampleType.Standard ? 'standard' : 'blank',
        targetRect,
        targetSample: sampleToAssign,
    });
  };

  const handleInsertStandard = (targetSample: Sample, targetRect: DOMRect) => {
    if (targetSample.type !== SampleType.Primary) return;
    setSelectionPopover({
        isOpen: true,
        type: 'standard',
        targetRect,
        targetSample,
    });
  };

  const handleInsertBlank = (targetSample: Sample, targetRect: DOMRect) => {
    if (targetSample.type !== SampleType.Primary) return;
    setSelectionPopover({
        isOpen: true,
        type: 'blank',
        targetRect,
        targetSample,
    });
  };

  const handleReplaceWithQCManual = (targetSample: Sample, qcType: SampleType.Standard | SampleType.Blank, material: Standard | Blank) => {
    if (!activeHole) return;

    setAutoQcFlag(activeHole.uuid, false);
    modifySamples(currentSamples => {
        const actualTarget = currentSamples.find(s => s.uuid === targetSample.uuid);
        if (!actualTarget) return currentSamples;

        const samplesWithoutTarget = currentSamples.filter(s => s.uuid !== actualTarget.uuid);
        const newQcSample: Omit<Sample, 'id' | 'uuid'> = {
            from: actualTarget.from,
            to: actualTarget.from,
            type: qcType,
            materialName: material.name,
            materialUuid: material.uuid,
            assayType: 'Au',
        };
        const replacementPrimarySample: Omit<Sample, 'id' | 'uuid'> = {
            from: actualTarget.from,
            to: actualTarget.to,
            type: SampleType.Primary,
            sampleType: actualTarget.sampleType,
            sampleMethod: actualTarget.sampleMethod,
            assayType: actualTarget.assayType,
        };
        const samplesAfterManualInsert = [...samplesWithoutTarget, newQcSample, replacementPrimarySample];
        return samplesAfterManualInsert;
    });
  };

  const handleStandardSelection = (standard: Standard) => {
    if (!selectionPopover.targetSample) return;
    const targetSample = selectionPopover.targetSample;

    if (targetSample.type === SampleType.Primary) {
        handleReplaceWithQCManual(targetSample, SampleType.Standard, standard);
    } else if (targetSample.type === SampleType.Standard) {
        updateSampleInHole(targetSample.uuid, {
            materialName: standard.name,
            materialUuid: standard.uuid
        });
    }
    setSelectionPopover({ isOpen: false, type: null, targetRect: null, targetSample: null });
  };

  const handleBlankSelection = (blank: Blank) => {
    if (!selectionPopover.targetSample) return;
    const targetSample = selectionPopover.targetSample;

    if (targetSample.type === SampleType.Primary) {
         handleReplaceWithQCManual(targetSample, SampleType.Blank, blank);
    } else if (targetSample.type === SampleType.Blank) {
        updateSampleInHole(targetSample.uuid, {
            materialName: blank.name,
            materialUuid: blank.uuid
        });
    }
    setSelectionPopover({ isOpen: false, type: null, targetRect: null, targetSample: null });
  };

  const handleOpenExportModal = () => {
    const hasUnassignedQC = drillHoles.some(hole =>
        hole.samples.some(s =>
            (s.type === SampleType.Standard || s.type === SampleType.Blank) && !s.materialUuid
        )
    );

    if (hasUnassignedQC) {
        setAlertModalInfo({
            isOpen: true,
            title: "Export Blocked",
            message: "Cannot export data. All Standards and Blanks must be assigned before exporting."
        });
        return;
    }
    setExportModalOpen(true);
  };

  const combinedLogForActiveHole = useMemo(() => activeHole ? calculateCombinedIntervals(activeHole) : [], [activeHole]);

  const TabButton = ({ tab, label }: { tab: 'samples' | 'condition', label: string }) => (
    <button onClick={() => setMainViewTab(tab)} className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors border-b-2 ${mainViewTab === tab ? 'text-sky-600 border-sky-600 bg-slate-50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}>
      {label}
    </button>
  );

  return (
    <div className="h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden">
      <Header view={view} setView={setView} drillHoles={drillHoles} activeHoleUuid={activeHoleUuid} onSelectHole={setActiveHoleUuid} onAddHole={handleAddHole} onOpenExportModal={handleOpenExportModal} />
      {view === 'admin' ? (
        <AdminPanel 
          standards={standards} setStandards={setStandards} 
          blanks={blanks} setBlanks={setBlanks} 
          projects={projects} setProjects={setProjects} 
          samplers={samplers} setSamplers={setSamplers} 
          qcConfig={qcConfig} setQcConfig={setQcConfig}
          onOpenDeleteModal={() => setDeleteModalOpen(true)}
          isAutoQcEnabled={isAutoQcEnabled}
          setIsAutoQcEnabled={setIsAutoQcEnabled}
        />
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-[276px,1fr] gap-8 flex-grow min-h-0">
          <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            <HoleInfoForm activeHole={activeHole} onUpdate={handleUpdateHoleInfo} projects={projects} samplers={samplers} />
            <SampleControls
              sampleInterval={sampleInterval}
              setSampleInterval={setSampleInterval}
              onGenerate={handleGenerateSamples}
              onAddDuplicate={() => selectedSamples.length > 0 && handleAddDuplicate(selectedSamples[0])}
              onToggleMultiElement={handleToggleMultiElement}
              onOpenStandardModal={() => {}}
              onOpenBlankModal={() => {}}
              onOpenNotSampledModal={() => setNotSampledModalOpen(true)}
              onSplit={() => handleSplitSample()}
              onMerge={handleMergeSamples}
              onDelete={handleDeleteSamples}
              selectedSamples={selectedSamples}
              isHoleSelected={!!activeHole}
              isHoleInfoComplete={isHoleInfoComplete}
              hasPrimarySamples={hasPrimarySamples}
              onApplyQCRules={handleApplyQCRules}
              isAutoQcEnabled={isAutoQcEnabled}
            />
          </div>
          <div className="flex flex-col min-h-0">
                <div className="flex-shrink-0 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-2">
                        <TabButton tab="samples" label="Samples" />
                        <TabButton tab="condition" label="Condition & Recovery" />
                    </nav>
                </div>
                {mainViewTab === 'samples' && (
                     <div className="grid grid-cols-1 xl:grid-cols-[auto,minmax(0,1.5fr)] gap-8 flex-grow min-h-0 grid-rows-[minmax(0,1fr)] pt-6">
                        <DrillHoleLog
                            displayMode="samples"
                            samples={activeHole?.samples || []}
                            holeDepth={activeHole?.holeDepth || 0}
                            conditionLog={activeHole?.conditionLog || []}
                            recoveryLog={activeHole?.recoveryLog || []}
                            selectedSampleUuids={selectedSampleUuids}
                            onToggleSelection={handleToggleSelection}
                            onAddDuplicate={handleAddDuplicate}
                            onInsertStandard={handleInsertStandard}
                            onInsertBlank={handleInsertBlank}
                            onSplit={handleSplitSample}
                            onDelete={handleDeleteSingleSample}
                            onUpdateIntervalLog={handleUpdateIntervalLog}
                            onToggleMultiElement={handleToggleMultiElement}
                            onAssignMaterial={handleAssignMaterial}
                        />
                        <SampleTable samples={activeHole?.samples || []} selectedSampleUuids={selectedSampleUuids} onToggleSelection={handleToggleSelection} onSelectAll={handleSelectAll} />
                    </div>
                )}
                {mainViewTab === 'condition' && (
                    <div className="grid grid-cols-1 xl:grid-cols-[auto,minmax(0,1.5fr)] gap-8 flex-grow min-h-0 grid-rows-[minmax(0,1fr)] pt-6">
                        <DrillHoleLog
                            displayMode="condition"
                            samples={activeHole?.samples || []}
                            holeDepth={activeHole?.holeDepth || 0}
                            conditionLog={activeHole?.conditionLog || []}
                            recoveryLog={activeHole?.recoveryLog || []}
                            selectedSampleUuids={selectedSampleUuids}
                            onToggleSelection={handleToggleSelection}
                            onAddDuplicate={handleAddDuplicate}
                            onInsertStandard={handleInsertStandard}
                            onInsertBlank={handleInsertBlank}
                            onSplit={handleSplitSample}
                            onDelete={handleDeleteSingleSample}
                            onUpdateIntervalLog={handleUpdateIntervalLog}
                            onToggleMultiElement={handleToggleMultiElement}
                            onAssignMaterial={handleAssignMaterial}
                        />
                         <CombinedLogTable activeHole={activeHole} projects={projects} samplers={samplers} combinedIntervals={combinedLogForActiveHole} />
                    </div>
                )}
          </div>
        </main>
      )}
      <footer className="flex-shrink-0 pt-4 text-xs text-slate-500">
        <p>Created by Sam Ulrich</p>
        <p>Version 2.1 - Manual/Auto QC Toggle</p>
      </footer>
      
      <SelectionPopover
        isOpen={selectionPopover.isOpen && selectionPopover.type === 'standard'}
        onClose={() => setSelectionPopover({ isOpen: false, type: null, targetRect: null, targetSample: null })}
        targetRect={selectionPopover.targetRect}
        options={standards}
        onSelect={handleStandardSelection}
        title="Select a Standard"
      />
      <SelectionPopover
        isOpen={selectionPopover.isOpen && selectionPopover.type === 'blank'}
        onClose={() => setSelectionPopover({ isOpen: false, type: null, targetRect: null, targetSample: null })}
        targetRect={selectionPopover.targetRect}
        options={blanks}
        onSelect={handleBlankSelection}
        title="Select a Blank"
      />

      <NotSampledModal isOpen={isNotSampledModalOpen} onClose={() => setNotSampledModalOpen(false)} onSubmit={handleAddNotSampledInterval} maxDepth={activeHole?.holeDepth || 0} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} drillHoles={drillHoles} onExport={handleExportData} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} drillHoles={drillHoles} onDelete={handleDeleteHoles} />
      <AlertModal
        isOpen={alertModalInfo.isOpen}
        onClose={() => setAlertModalInfo({ isOpen: false, title: '', message: '' })}
        title={alertModalInfo.title}
        message={alertModalInfo.message}
      />
    </div>
  );
}

export default App;