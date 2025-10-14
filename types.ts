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
  materialUuid?: string;
  sampleType?: string;
  sampleMethod?: string;
  pSampleId?: string;
  assayType?: string;
  comment?: string;
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
  autoQcApplied?: boolean;
}

export interface CombinedInterval {
  from: number;
  to: number;
  conditionCode: ConditionCode | string;
  recoveryCode: RecoveryCode | string;
}

export enum QCRate {
  None = 0,
  Fifty = 50,      // 1 in 50 -> 2 per 100
  TwentyFive = 25, // 1 in 25 -> 4 per 100
  Twenty = 20,     // 1 in 20 -> 5 per 100
  Ten = 10,        // 1 in 10 -> 10 per 100
}

export interface QCTrigger {
  ending: string;
}

export interface QCRule {
  rate: QCRate;
  triggers: QCTrigger[];
}

export interface QCConfig {
  standard: QCRule;
  blank: QCRule;
  duplicate: QCRule;
}