import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import type { FrameExtraction } from '@shared/schema';

ffmpeg.setFfmpegPath(ffmpegPath!);

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);



// Parse timestamp like "00:00 - 00:01" and get start/end times
function parseTimestampRange(timestamp: string): { start: number, end: number } {
  console.log(`Parsing timestamp: "${timestamp}"`);
  const parts = timestamp.split(' - ');
  if (parts.length !== 2) {
    // If it's a single timestamp like "00:00", create a 1 second range
    const time = parseTimeToSeconds(timestamp);
    console.log(`Single timestamp parsed to: ${time}s, creating 1s range`);
    return { start: time, end: time + 1 };
  }
  
  const startSeconds = parseTimeToSeconds(parts[0]);
  let endSeconds = parseTimeToSeconds(parts[1]);
  
  // If start and end are the same, add 1 second to ensure valid GIF duration
  if (startSeconds === endSeconds) {
    endSeconds = startSeconds + 1;
    console.log(`Same start/end time detected, adjusting end to ${endSeconds}s`);
  }
  
  console.log(`Range timestamp: start=${startSeconds}s, end=${endSeconds}s`);
  return { start: startSeconds, end: endSeconds };
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
    const { start, end } = parseTimestampRange(phase.timestamp);
    const duration = end - start;
    console.log(`Creating GIF for ${phase.name} from ${start}s to ${end}s (duration: ${duration}s)`);
    const frameName = `${phase.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gif`;
    const framePath = path.join(framesDir, frameName);
    
    try {
      await new Promise<void>((resolve, reject) => {
        // Ensure video path is absolute
        const absoluteVideoPath = path.isAbsolute(videoPath) ? videoPath : path.resolve(videoPath);
        
        // Create a high-quality GIF from the time range
        ffmpeg(absoluteVideoPath)
          .seekInput(start)
          .duration(duration)
          .outputOptions([
            '-vf', 'fps=20,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=sierra2_4a', // Higher quality GIF with optimized palette
            '-loop', '0' // Loop forever
          ])
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
      console.error(`Failed to create GIF for ${phase.name}:`, error);
      // Continue with other phases even if one fails
    }
  }

  return extractions;
}

export function getFrameUrl(analysisId: string, phaseName: string): string {
  const frameName = `${phaseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gif`;
  return `/api/frames/${analysisId}/${frameName}`;
}

export async function createFullSwingGif(
  videoPath: string,
  analysisId: string
): Promise<string> {
  const framesDir = path.join('uploads', 'frames', analysisId);
  
  // Ensure frames directory exists
  try {
    await access(framesDir);
  } catch {
    await mkdir(framesDir, { recursive: true });
  }

  const gifPath = path.join(framesDir, 'full_swing.gif');
  
  try {
    await new Promise<void>((resolve, reject) => {
      const absoluteVideoPath = path.isAbsolute(videoPath) ? videoPath : path.resolve(videoPath);
      
      // Create a high-quality GIF of the entire video
      ffmpeg(absoluteVideoPath)
        .outputOptions([
          '-vf', 'fps=24,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=sierra2_4a', // Higher quality with optimized palette
          '-loop', '0' // Loop forever
        ])
        .output(gifPath)
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .run();
    });

    return path.relative('uploads', gifPath);
  } catch (error) {
    console.error('Failed to create full swing GIF:', error);
    throw error;
  }
}