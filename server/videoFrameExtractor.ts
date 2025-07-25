import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import type { FrameExtraction } from '@shared/schema';

ffmpeg.setFfmpegPath(ffmpegPath!);

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);



// Parse timestamp like "00:00 - 00:01" and get middle point
function parseTimestamp(timestamp: string): number {
  console.log(`Parsing timestamp: "${timestamp}"`);
  const parts = timestamp.split(' - ');
  if (parts.length !== 2) {
    // If it's a single timestamp like "00:00", use that
    const result = parseTimeToSeconds(timestamp);
    console.log(`Single timestamp parsed to: ${result}s`);
    return result;
  }
  
  const startSeconds = parseTimeToSeconds(parts[0]);
  const endSeconds = parseTimeToSeconds(parts[1]);
  const midpoint = (startSeconds + endSeconds) / 2;
  
  console.log(`Range timestamp: start=${startSeconds}s, end=${endSeconds}s, midpoint=${midpoint}s`);
  return midpoint;
}

function parseTimeToSeconds(timeStr: string): number {
  // Remove 's' suffix if present and trim whitespace
  const cleanTime = timeStr.trim().replace(/s$/i, '');
  
  // Check if it's already just a number (seconds) or decimal format like "0.5s"
  const directSeconds = parseFloat(cleanTime);
  if (!isNaN(directSeconds) && !cleanTime.includes(':')) {
    return directSeconds;
  }
  
  // Parse HH:MM:SS or MM:SS format
  const parts = cleanTime.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  console.error(`Unable to parse time: "${timeStr}"`);
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
    console.log(`Extracting frame for ${phase.name} at ${timestamp}s from timestamp: ${phase.timestamp}`);
    const frameName = `${phase.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
    const framePath = path.join(framesDir, frameName);
    
    try {
      await new Promise<void>((resolve, reject) => {
        // Ensure video path is absolute
        const absoluteVideoPath = path.isAbsolute(videoPath) ? videoPath : path.resolve(videoPath);
        
        ffmpeg(absoluteVideoPath)
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