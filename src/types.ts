
export interface Level {
  id: number;
  title: string;
  scenario: string;
  trainALength: number;
  trainASpeedKmH: number;
  trainBLength?: number;
  trainBSpeedKmH?: number;
  platformLength?: number;
  direction: 'stationary' | 'opposite' | 'same';
  description: string;
  options: number[];
}

export interface PerformanceRecord {
  levelId: number;
  timeTaken: number;
  attempts: number;
  wasCorrect: boolean;
  idealTime: number;
}
