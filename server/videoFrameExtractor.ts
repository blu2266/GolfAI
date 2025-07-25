import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import type { FrameExtraction } from '@shared/schema';

ffmpeg.setFfmpegPath(ffmpegPath);

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);



// Parse timestamp like "00:00 - 00:01" and get middle point
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(' - ');
  if (parts.length !== 2) {
    // If it's a single timestamp like "00:00", use that
    return parseTimeToSeconds(timestamp);
  }
  
  const startSeconds = parseTimeToSeconds(parts[0]);
  const endSeconds = parseTimeToSeconds(parts[1]);
  
  // Return middle point
  return (startSeconds + endSeconds) / 2;
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

export async function extractFramesFromVideo(
  videoPath: string,
  analysisId: string,
  swingPhases: Array<{ name: string; timestamp: string }>
): Promise<FrameExtraction[]> {
  const framesDir = path.join('uploads', 'frames', analysisId);
  
  // Ensure frames directory exists
  try {
    await access(framesDir);
  } catch {
    await mkdir(framesDir, { recursive: true });
  }

  const extractions: FrameExtraction[] = [];

  for (const phase of swingPhases) {
    const timestamp = parseTimestamp(phase.timestamp);
    const frameName = `${phase.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
    const framePath = path.join(framesDir, frameName);
    
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(timestamp)
          .frames(1)
          .output(framePath)
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run();
      });

      extractions.push({
        timestamp: phase.timestamp,
        framePath: path.relative('uploads', framePath)
      });
    } catch (error) {
      console.error(`Failed to extract frame for ${phase.name}:`, error);
      // Continue with other phases even if one fails
    }
  }

  return extractions;
}

export function getFrameUrl(analysisId: string, phaseName: string): string {
  const frameName = `${phaseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
  return `/api/frames/${analysisId}/${frameName}`;
}