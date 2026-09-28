import { useCallback, useEffect, useRef, useState } from "react";

import { pauseAllAudio } from "../components/AudioPlayer";

// Longest clip we'll record before stopping automatically
export const MAX_RECORDING_SECONDS = 10 * 60;

// iOS Safari only records audio/mp4 (AAC). Chrome and Firefox record
// webm/ogg opus. The server transcodes everything to m4a, so we just pick
// whatever this browser supports, preferring mp4 since it needs no re-encode.
const MIME_CANDIDATES = [
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg"
];

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  if (typeof MediaRecorder.isTypeSupported !== "function") return "";
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

export const isAudioRecordingSupported = () =>
  typeof window !== "undefined" &&
  typeof MediaRecorder !== "undefined" &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  const finishRef = useRef(null);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      // Stopping the tracks is what actually turns the mic off (and clears
      // the red recording indicator on iOS)
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return Promise.resolve(null);
    if (recorder.state === "inactive") return Promise.resolve(null);

    return new Promise((resolve) => {
      finishRef.current = resolve;
      try {
        recorder.stop();
      } catch (error) {
        console.error("Error stopping recorder:", error);
        resolve(null);
      }
    });
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    return stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (!isAudioRecordingSupported()) {
      throw new Error("Audio recording is not supported in this browser");
    }
    if (recorderRef.current) return;

    setIsStarting(true);

    // iOS lowers playback volume as soon as the mic opens; pause first so
    // nothing keeps playing quietly under the recording
    pauseAllAudio();

    let stream;
    try {
      // Must be called from a user gesture so the permission prompt shows
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      setIsStarting(false);
      throw error;
    }

    const mimeType = pickMimeType();
    let recorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      setIsStarting(false);
      throw error;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    cancelledRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error || event);
    };

    recorder.onstop = () => {
      clearTimer();
      releaseStream();

      const seconds = Math.min(
        (Date.now() - startTimeRef.current) / 1000,
        MAX_RECORDING_SECONDS
      );
      const wasCancelled = cancelledRef.current;
      const type = recorder.mimeType || mimeType || "audio/mp4";
      const blob = new Blob(chunksRef.current, { type });

      recorderRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
      setElapsed(0);

      const finish = finishRef.current;
      finishRef.current = null;

      if (wasCancelled || blob.size === 0 || seconds < 0.5) {
        if (finish) finish(null);
        return;
      }

      if (finish) finish({ blob, duration: seconds });
    };

    // If iOS suspends the mic (call comes in, app backgrounded), the track
    // ends on its own; finish with whatever we've captured so far
    stream.getAudioTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        if (recorderRef.current === recorder && recorder.state !== "inactive") {
          stop();
        }
      });
    });

    // No timeslice: iOS produces a single well-formed file at stop()
    recorder.start();
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRecording(true);
    setIsStarting(false);

    timerRef.current = setInterval(() => {
      const seconds = (Date.now() - startTimeRef.current) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) {
        stop();
      }
    }, 200);
  }, [clearTimer, releaseStream, stop]);

  useEffect(() => {
    return () => {
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        cancelledRef.current = true;
        try {
          recorder.stop();
        } catch (error) {}
      }
      releaseStream();
    };
  }, [clearTimer, releaseStream]);

  return {
    isSupported: isAudioRecordingSupported(),
    isRecording,
    isStarting,
    elapsed,
    start,
    stop,
    cancel
  };
};
