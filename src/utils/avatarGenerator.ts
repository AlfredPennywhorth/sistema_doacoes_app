export interface AvatarOptions {
  size?: number;
  backgroundColor?: string;
  radius?: number;
}

/**
 * Generates a stable avatar URL using DiceBear Bottts based on a stable seed (user ID).
 */
export function generateAvatarUrl(seed: string, options?: AvatarOptions): string {
  // Use a stable seed like user ID, do NOT use email or phone directly
  const safeSeed = encodeURIComponent(seed);
  
  let url = `https://api.dicebear.com/7.x/bottts/svg?seed=${safeSeed}`;
  
  if (options?.size) {
    url += `&size=${options.size}`;
  }
  if (options?.backgroundColor) {
    url += `&backgroundColor=${options.backgroundColor.replace('#', '')}`;
  }
  if (options?.radius) {
    url += `&radius=${options.radius}`;
  }
  
  return url;
}
