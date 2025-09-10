// Helper functions for handling media URLs - Always use authenticated backend endpoints

export function getVideoUrl(analysis: any): string {
  // IMPORTANT: Always use backend endpoints for security
  // Never expose direct storage.googleapis.com URLs to the frontend
  
  // If saved to object storage, use the secure /objects/* endpoint
  if (analysis.objectStorageVideoPath && analysis.objectStorageVideoPath.startsWith('/objects/')) {
    // This endpoint requires authentication and checks ownership
    return analysis.objectStorageVideoPath;
  }
  
  // Fall back to local filesystem endpoint (also requires auth now)
  return `/api/videos/${analysis.videoPath.split('/').pop()}`;
}

export function getFrameUrl(analysis: any, frameName: string): string {
  // IMPORTANT: Always use backend endpoints for security
  
  // If saved to object storage, use the secure /objects/* endpoint
  if (analysis.objectStorageFramePaths) {
    // Find the frame path that matches this frame name
    const frameKey = Object.keys(analysis.objectStorageFramePaths).find(key => {
      const pathValue = analysis.objectStorageFramePaths[key];
      return pathValue && pathValue.includes(frameName);
    });
    
    if (frameKey && analysis.objectStorageFramePaths[frameKey]) {
      const path = analysis.objectStorageFramePaths[frameKey];
      // Only use if it's an internal /objects/* path, not a direct URL
      if (path.startsWith('/objects/')) {
        return path;
      }
    }
  }
  
  // Fall back to local filesystem endpoint (also requires auth now)
  return `/api/frames/${analysis.id}/${frameName}`;
}

export function getFullSwingGifUrl(analysis: any): string {
  // IMPORTANT: Always use backend endpoints for security
  
  // If saved to object storage, use the secure /objects/* endpoint
  if (analysis.objectStorageFramePaths && analysis.objectStorageFramePaths['full_swing']) {
    const path = analysis.objectStorageFramePaths['full_swing'];
    // Only use if it's an internal /objects/* path, not a direct URL
    if (path.startsWith('/objects/')) {
      return path;
    }
  }
  
  // Fall back to local filesystem endpoint (also requires auth now)
  return `/api/frames/${analysis.id}/full_swing.gif`;
}

export function getPhaseGifUrl(analysis: any, phaseName: string): string {
  const frameName = `${phaseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gif`;
  return getFrameUrl(analysis, frameName);
}