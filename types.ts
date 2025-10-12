export enum SampleType {
  Primary = 'Primary',
  Duplicate = 'Duplicate',
  Standard = 'Standard',
  Blank = 'Blank',
  NotSampled = 'Not Sampled',
}

export interface Sample {
  id: string;
  from: number;
  to: number;
  type: SampleType;
  uuid: string;
  materialName?: string; // To store specific standard/blank names
  sampleType?: string;
  sampleMethod?: string;
  pSampleId?: string;
}

export interface Standard {
  uuid: string;
  name: string;
}

export interface Blank {
  uuid: string;
  name: string;
}

export interface Project {
  uuid: string;
  code: string;
  description: string;
}

export interface Sampler {
  uuid: string;
  name: string;
}

export enum ConditionCode {
  Dry = 'D',
  Moist = 'M',
  Wet = 'W',
  NoSample = 'NS',
}

export enum RecoveryCode {
  Good = 'G',
  Medium = 'M',
  Poor = 'P',
  NoSample = 'NS',
}

export interface LogInterval {
  from: number;
  to: number;
  code: ConditionCode | RecoveryCode;
}

export interface DrillHole {
  uuid: string;
  holeId: string;
  holeDepth: number;
  firstSampleId: string;
  samples: Sample[];
  projectUuid?: string;
  samplerUuid?: string;
  sampledDate: string;
  conditionLog: LogInterval[];
  recoveryLog: LogInterval[];
}

export interface CombinedInterval {
  from: number;
  to: number;
  conditionCode: ConditionCode | string;
  recoveryCode: RecoveryCode | string;
}
