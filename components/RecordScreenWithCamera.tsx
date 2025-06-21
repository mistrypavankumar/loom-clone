'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ICONS } from '@/constants';
import { useRouter } from 'next/navigation';
import { useScreenRecordingWithCamera } from '@/lib/hooks/useScreenRecordingWithCamera';

const RecordScreenWithCamera = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'screen' | 'camera' | 'both'>('screen');
  const [camOverlayPos, setCamOverlayPos] = useState({ x: 20, y: 20 });
  const [camOverlaySize, setCamOverlaySize] = useState({
    width: 200,
    height: 150,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    recordedBlob,
    recordedVideoUrl,
    startRecording,
    stopRecording,
    resetRecording,
    recordingDuration,
    cameraStream,
  } = useScreenRecordingWithCamera();
  
  useEffect(() => {
    if (
      (mode === 'camera' || mode === 'both') &&
      cameraStream &&
      cameraPreviewRef.current
    ) {
      cameraPreviewRef.current.srcObject = cameraStream;
      cameraPreviewRef.current.play().catch(console.error);
    }
  }, [cameraStream, mode]);

  // Handle dragging the overlay
  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).dataset?.resize) return;
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = window.innerWidth - e.clientX - (el.offsetWidth - offsetX);
      const newY = window.innerHeight - e.clientY - (el.offsetHeight - offsetY);
      setCamOverlayPos({ x: Math.max(0, newX), y: Math.max(0, newY) });
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Handle resizing the overlay
  useEffect(() => {
    const handle = resizeRef.current;
    if (!handle) return;

    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let resizing = false;

    const onMouseDown = (e: MouseEvent) => {
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = camOverlaySize.width;
      startHeight = camOverlaySize.height;
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const newWidth = Math.min(
        Math.max(150, startWidth + (e.clientX - startX)),
        400
      );
      const newHeight = Math.min(
        Math.max(100, startHeight + (e.clientY - startY)),
        300
      );
      setCamOverlaySize({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      resizing = false;
    };

    handle.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [camOverlaySize]);

  const closeModal = () => {
    resetRecording();
    setIsOpen(false);
  };

  const handleStartRecording = async () => {
    await startRecording(mode);
  };

  const recordAgain = async () => {
    resetRecording();
    await startRecording(mode);
    if (recordedVideoUrl && videoRef.current) {
      videoRef.current.src = recordedVideoUrl;
    }
  };

  const goToUpload = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);

    sessionStorage.setItem(
      'recordedVideo',
      JSON.stringify({
        url,
        name: 'recording.webm',
        type: recordedBlob.type,
        size: recordedBlob.size,
        duration: recordingDuration || 0,
      })
    );

    router.push('/upload');
    closeModal();
  };

  return (
    <div className="p-4">
      <button
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setIsOpen(true)}
      >
        <Image src={ICONS.record} alt="record" width={16} height={16} />
        <span>Record a video</span>
      </button>

      {isOpen && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Video Recording</h3>
              <button onClick={closeModal}>
                <Image src={ICONS.close} alt="close" width={20} height={20} />
              </button>
            </div>

            {/* Recording Mode Selector */}
            {!isRecording && !recordedVideoUrl && (
              <div className="flex gap-3 mb-4">
                {['screen', 'camera', 'both'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMode(type as typeof mode)}
                    className={`px-4 py-2 rounded-md border ${
                      mode === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Status or Recorded Preview */}
            <section className="mb-4">
              {isRecording ? (
                mode === 'camera' ? (
                  <video
                    ref={cameraPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-md border object-cover"
                  />
                ) : (
                  <article className="text-red-600 font-semibold">
                    🔴 Recording in progress...
                  </article>
                )
              ) : recordedVideoUrl ? (
                <video
                  ref={videoRef}
                  src={recordedVideoUrl}
                  controls
                  className="w-full rounded-md border"
                />
              ) : (
                <p className="text-gray-600">
                  Select mode and click record to begin.
                </p>
              )}
            </section>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {!isRecording && !recordedVideoUrl && (
                <button
                  onClick={handleStartRecording}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Image
                    src={ICONS.record}
                    alt="record"
                    width={16}
                    height={16}
                  />
                  Record
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Image src={ICONS.record} alt="stop" width={16} height={16} />
                  Stop Recording
                </button>
              )}

              {recordedVideoUrl && (
                <>
                  <button
                    onClick={recordAgain}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Record Again
                  </button>
                  <button
                    onClick={goToUpload}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Image
                      src={ICONS.upload}
                      alt="upload"
                      width={16}
                      height={16}
                    />
                    Continue to Upload
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ✅ Floating Camera Preview with Resize */}
      {isOpen && mode === 'both' && cameraStream && (
        <div
          ref={dragRef}
          style={{
            position: 'fixed',
            bottom: `${camOverlayPos.y}px`,
            right: `${camOverlayPos.x}px`,
            zIndex: 1000,
            width: `${camOverlaySize.width}px`,
            height: `${camOverlaySize.height}px`,
            cursor: 'move',
          }}
          className="rounded shadow-lg overflow-hidden border border-gray-300 bg-black relative"
        >
          <video
            ref={cameraPreviewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Resize Handle */}
          <div
            ref={resizeRef}
            data-resize
            className="absolute bottom-0 right-0 w-4 h-4 bg-white cursor-se-resize"
            style={{
              borderTop: '2px solid gray',
              borderLeft: '2px solid gray',
              transform: 'rotate(45deg)',
              margin: '4px',
            }}
            title="Resize"
          />
        </div>
      )}
    </div>
  );
};

export default RecordScreenWithCamera;
