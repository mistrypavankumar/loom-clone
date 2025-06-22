import { useEffect, useRef, useState } from 'react';
import {
  calculateRecordingDuration,
  cleanupRecording,
  createAudioMixer,
  createRecordingBlob,
  setupRecording,
} from '@/lib/utils';

type RecordingMode = 'screen' | 'camera' | 'both';

export const useScreenRecordingWithCamera = () => {
  const [state, setState] = useState<BunnyRecordingState>({
    isRecording: false,
    recordedBlob: null,
    recordedVideoUrl: '',
    recordingDuration: 0,
  });

  const [errorMessage, setErrorMessage] = useState('');

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<ExtendedMediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (state.recordedVideoUrl) URL.revokeObjectURL(state.recordedVideoUrl);
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(console.error);
      }
      audioContextRef.current = null;
    };
  }, [state.recordedVideoUrl]);

  const handleRecordingStop = () => {
    const { blob, url } = createRecordingBlob(chunksRef.current);
    const duration = calculateRecordingDuration(startTimeRef.current);

    setState((prev) => ({
      ...prev,
      recordedBlob: blob,
      recordedVideoUrl: url,
      recordingDuration: duration,
      isRecording: false,
    }));
  };

  const startRecording = async (
    mode: RecordingMode = 'screen',
    withMic = true
  ) => {
    try {
      stopRecording();

      const combinedStream = new MediaStream() as ExtendedMediaStream;
      const originalStreams: MediaStream[] = [];

      let screenStream: MediaStream | null = null;
      let camStream: MediaStream | null = null;
      let micStream: MediaStream | null = null;

      // Step 1: Capture screen (video only, NOT audio)
      if (mode === 'screen' || mode === 'both') {
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false, // prevent system audio-related blob issues
          });
          screenStream
            .getVideoTracks()
            .forEach((track) => combinedStream.addTrack(track));
          originalStreams.push(screenStream);
        } catch (error) {
          console.error(
            'User cancelled screen sharing or permission denied:',
            error
          );
          return false;
        }
      }

      // Step 2: Capture camera if needed
      if (mode === 'camera' || mode === 'both') {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: withMic, // only include mic with camera if requested
        });
        setCameraStream(camStream);
        camStream
          .getVideoTracks()
          .forEach((track) => combinedStream.addTrack(track));
        originalStreams.push(camStream);
      }

      // Step 3: Capture mic separately (for screen-only mode)
      if (mode === 'screen' && withMic) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        originalStreams.push(micStream);
      }

      // Step 4: Mix audio (if any)
      if (audioContextRef.current?.state !== 'closed') {
        await audioContextRef.current?.close().catch(console.error);
      }

      audioContextRef.current = new AudioContext();
      const audioDestination = createAudioMixer(
        audioContextRef.current,
        screenStream,
        camStream,
        micStream,
        false // do NOT require audio — allows silent videos to still work
      );

      audioDestination?.stream
        .getAudioTracks()
        .forEach((track) => combinedStream.addTrack(track));

      // Step 5: Setup MediaRecorder
      combinedStream._originalStreams = originalStreams;
      streamRef.current = combinedStream;

      mediaRecorderRef.current = setupRecording(combinedStream, {
        onDataAvailable: (e) => e.data.size && chunksRef.current.push(e.data),
        onStop: handleRecordingStop,
      });

      chunksRef.current = [];
      startTimeRef.current = Date.now();
      mediaRecorderRef.current.start(1000); // collect data every 1s

      setState((prev) => ({ ...prev, isRecording: true }));
      return true;
    } catch (error) {
      console.error('Recording error:', error);

      const err = error instanceof Error ? error : new Error(String(error));

      const messageMap: Record<string, string> = {
        NotReadableError:
          'Camera or mic is busy. Close other apps and try again.',
        NotAllowedError: 'Access denied. Please allow camera or mic.',
        AbortError: 'Recording was stopped unexpectedly.',
        NotFoundError: 'No camera or mic found.',
        OverconstrainedError: 'No device matches your settings.',
        SecurityError: 'Security error accessing media devices.',
      };

      const message =
        messageMap[err.name] ||
        err.message ||
        'Something went wrong while recording.';

      setErrorMessage(message);

      return false;
    }
  };

  const stopRecording = () => {
    cleanupRecording(
      mediaRecorderRef.current,
      streamRef.current,
      streamRef.current?._originalStreams
    );
    streamRef.current = null;
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setState((prev) => ({ ...prev, isRecording: false }));
  };

  const resetRecording = () => {
    stopRecording();
    if (state.recordedVideoUrl) URL.revokeObjectURL(state.recordedVideoUrl);
    setState({
      isRecording: false,
      recordedBlob: null,
      recordedVideoUrl: '',
      recordingDuration: 0,
    });
    startTimeRef.current = null;
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
    cameraStream,
    errorMessage,
    setErrorMessage,
  };
};
