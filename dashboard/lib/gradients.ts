export const GRADIENT_NAMES = [
  "blue",
  "teal",
  "orange",
  "purple",
  "pink",
] as const;

export type GradientName = (typeof GRADIENT_NAMES)[number];

export function gradientForIndex(index: number): GradientName {
  return GRADIENT_NAMES[index % GRADIENT_NAMES.length];
}

export function gradientForKey(key: string): GradientName {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradientForIndex(Math.abs(hash));
}
