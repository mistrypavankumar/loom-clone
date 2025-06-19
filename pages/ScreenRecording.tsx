'use client';

import { useRef, useState } from 'react';

export default function ScreenRecording() {
  const [recording, setRecording] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');

      // Request screen capture
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Request microphone audio
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Combine streams
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      setStream(combinedStream);

      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
      }

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm',
      });

      mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start(1000);
      setRecording(true);
    } catch (err) {
      setError(
        `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    stream?.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  const downloadRecording = () => {
    if (!videoUrl) return;

    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Screen Recorder</h1>

      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</div>
      )}

      <div className="flex gap-4 mb-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            disabled={recording}
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            disabled={!recording}
          >
            Stop Recording
          </button>
        )}

        {videoUrl && (
          <button
            onClick={downloadRecording}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Download Recording
          </button>
        )}
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full border rounded mb-4 bg-gray-800 aspect-video"
      />

      {videoUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Recording Preview</h2>
          <video
            src={videoUrl}
            controls
            className="w-full border rounded mb-4 bg-gray-800 aspect-video"
          />
        </div>
      )}
    </div>
  );
}
