// Helper functions for handling media URLs with object storage fallback

export function getVideoUrl(analysis: any): string {
  // Use object storage URL if available (for saved analyses)
  if (analysis.objectStorageVideoPath) {
    return analysis.objectStorageVideoPath;
  }
  // Fall back to local filesystem URL
  return `/api/videos/${analysis.videoPath.split('/').pop()}`;
}

export function getFrameUrl(analysis: any, frameName: string): string {
  // Use object storage URL if available (for saved analyses)
  if (analysis.objectStorageFramePaths) {
    // Check if we have a URL for this specific frame
    const frameKey = Object.keys(analysis.objectStorageFramePaths).find(key => {
      return analysis.objectStorageFramePaths[key].includes(frameName);
    });
    if (frameKey && analysis.objectStorageFramePaths[frameKey]) {
      return analysis.objectStorageFramePaths[frameKey];
    }
  }
  // Fall back to local filesystem URL
  return `/api/frames/${analysis.id}/${frameName}`;
}

export function getFullSwingGifUrl(analysis: any): string {
  // Use object storage URL if available (for saved analyses)
  if (analysis.objectStorageFramePaths && analysis.objectStorageFramePaths['full_swing']) {
    return analysis.objectStorageFramePaths['full_swing'];
  }
  // Fall back to local filesystem URL
  return `/api/frames/${analysis.id}/full_swing.gif`;
}

export function getPhaseGifUrl(analysis: any, phaseName: string): string {
  const frameName = `${phaseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gif`;
  return getFrameUrl(analysis, frameName);
}