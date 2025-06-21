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

      if (mode === 'screen' || mode === 'both') {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStream
          .getVideoTracks()
          .forEach((track) => combinedStream.addTrack(track));
        originalStreams.push(screenStream);
      }

      if (mode === 'camera' || mode === 'both') {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: withMic,
        });
        setCameraStream(camStream);
        camStream
          .getVideoTracks()
          .forEach((track) => combinedStream.addTrack(track));
        originalStreams.push(camStream);
      }

      audioContextRef.current = new AudioContext();
      const audioDestination = createAudioMixer(
        audioContextRef.current,
        screenStream,
        camStream,
        true
      );

      audioDestination?.stream
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));

      combinedStream._originalStreams = originalStreams;
      streamRef.current = combinedStream;

      mediaRecorderRef.current = setupRecording(combinedStream, {
        onDataAvailable: (e) => e.data.size && chunksRef.current.push(e.data),
        onStop: handleRecordingStop,
      });

      chunksRef.current = [];
      startTimeRef.current = Date.now();
      mediaRecorderRef.current.start(1000);

      setState((prev) => ({ ...prev, isRecording: true }));
      return true;
    } catch (error) {
      console.error('Recording error:', error);
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
  };
};
