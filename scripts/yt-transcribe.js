// transcribe-yt.js
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { YoutubeTranscript } from "youtube-transcript"; // you have this
// (if using CommonJS, adjust: const { YoutubeTranscript } = require('youtube-transcript'))

async function fetchTranscript(videoIdOrUrl) {
  try {
    const transcriptItems =
      await YoutubeTranscript.fetchTranscript(videoIdOrUrl);
    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error("Empty transcript");
    }
    const text = transcriptItems.map((item) => item.text).join(" ");
    return text;
  } catch (err) {
    console.error("Transcript fetch failed:", err.message);
    return null;
  }
}

async function downloadAudio(videoUrl, outFile) {
  return new Promise((resolve, reject) => {
    // Using yt-dlp to extract audio to mp3
    // Ensure proper quoting and filename template
    const cmd = `yt-dlp -x --audio-format mp3 -o "${outFile}" "${videoUrl}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`yt-dlp error: ${stderr}`));
      } else {
        resolve(outFile);
      }
    });
  });
}

async function transcribeWithWhisper(audioFile, outputFile) {
  return new Promise((resolve, reject) => {
    // adjust model/language/etc as you want
    const cmd = `whisper "${audioFile}" --model base --language en --output_format txt --output_dir ./`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`whisper error: ${stderr}`));
      } else {
        // whisper writes a .txt in cwd
        // find the produced text file
        const baseName = path.basename(audioFile, path.extname(audioFile));
        const txtName = path.join("./", baseName + ".txt");
        resolve(txtName);
      }
    });
  });
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node transcribe-yt.js <YouTube video ID or URL>");
    process.exit(1);
  }
  console.log("Trying direct transcript via youtube-transcript...");
  const txt1 = await fetchTranscript(arg);
  if (txt1) {
    const out = "transcript_direct.txt";
    fs.writeFileSync(out, txt1, "utf-8");
    console.log("Transcript fetched and saved to", out);
    process.exit(0);
  }
  console.log("Falling back to downloading audio + whisper transcription...");
  const audioFile = "audio_temp.mp3";
  try {
    await downloadAudio(arg, audioFile);
  } catch (e) {
    console.error("Failed to download audio:", e.message);
    process.exit(1);
  }
  try {
    const txtFile = await transcribeWithWhisper(audioFile);
    console.log("Whisper transcription saved to", txtFile);
    // optionally cleanup audio
    // fs.unlinkSync(audioFile);
  } catch (e) {
    console.error("Whisper failed:", e.message);
    process.exit(1);
  }
}

main();
