export const DEMO_MODE = import.meta.env?.VITE_DEMO_MODE === 'true';
export const PREVIEW_MESSAGE =
  'Demo only — no changes saved. Explore the prepared examples in the other workflow tabs.';

export function assetUrl(path: string) {
  if (!DEMO_MODE) return path;
  return (
    import.meta.env.BASE_URL +
    (path.includes('/files/demo-image')
      ? 'demo/vehicle.svg'
      : 'demo/document.html')
  );
}
