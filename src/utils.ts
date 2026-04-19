
export const calculateClearanceTime = (
  trainALen: number,
  trainASpeedKmH: number,
  targetLen: number = 0, // platform or train B
  targetSpeedKmH: number = 0,
  direction: 'stationary' | 'opposite' | 'same' = 'stationary'
): number => {
  // Convert km/hr to m/s: multiply by 5/18
  const sA = trainASpeedKmH * (5 / 18);
  const sB = targetSpeedKmH * (5 / 18);

  const totalDistance = trainALen + targetLen;
  let relativeSpeed = sA;

  if (direction === 'opposite') {
    relativeSpeed = sA + sB;
  } else if (direction === 'same') {
    relativeSpeed = Math.abs(sA - sB);
  }

  // T = D / S
  return totalDistance / relativeSpeed;
};

export const formatTime = (seconds: number): string => {
  return seconds.toFixed(2);
};
