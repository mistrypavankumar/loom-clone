'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ICONS } from '@/constants';
import { useRouter } from 'next/navigation';
import { useScreenRecordingWithCamera } from '@/lib/hooks/useScreenRecordingWithCamera';
import toast from 'react-hot-toast';

const RecordScreenWithCamera = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'screen' | 'camera' | 'both'>('screen');

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  const {
    isRecording,
    recordedBlob,
    recordedVideoUrl,
    startRecording,
    stopRecording,
    resetRecording,
    recordingDuration,
    cameraStream,
    errorMessage,
    setErrorMessage,
  } = useScreenRecordingWithCamera();

  useEffect(() => {
    if (errorMessage !== '') {
      toast.error(errorMessage);
      setErrorMessage('');
    }
  }, [errorMessage, setErrorMessage]);

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

  useEffect(() => {
    const video = cameraPreviewRef.current;
    if (!video) return;

    const handleLeavePiP = () => {
      console.log('📺 PiP closed, restoring floating preview');
    };

    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  const cameraPopupOpenedRef = useRef(false);

  const handleStartRecording = async () => {
    if (mode === 'both' && cameraPreviewRef.current) {
      // Ensure video is playing before PiP
      cameraPreviewRef.current
        .play()
        .then(() => {
          return cameraPreviewRef.current!.requestPictureInPicture();
        })
        .then(() => {
          console.log('✅ Entered Picture-in-Picture');
        })
        .catch((err) => {
          toast.error('Failed to enter Picture-in-Picture');
          console.error(err);
        });
    }

    await startRecording(mode);
  };

  const closeModal = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch((err) => {
        console.warn('Error exiting PiP:', err);
      });
    }

    resetRecording();
    setIsOpen(false);
    setErrorMessage('');
    cameraPopupOpenedRef.current = false;
  };

  const recordAgain = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch((err) => {
        console.warn('Error exiting PiP before re-record:', err);
      });
    }

    resetRecording();
    cameraPopupOpenedRef.current = false;

    await startRecording(mode);

    if (mode === 'both' && cameraPreviewRef.current) {
      cameraPreviewRef.current
        .play()
        .then(() => {
          cameraPreviewRef.current!.requestPictureInPicture();
        })
        .then(() => {
          console.log('✅ Re-entered Picture-in-Picture');
          cameraPopupOpenedRef.current = true;
        })
        .catch((err) => {
          toast.error('Failed to re-enter Picture-in-Picture');
          console.error(err);
        });
    }

    if (recordedVideoUrl && videoRef.current) {
      videoRef.current.src = recordedVideoUrl;
    }
  };

  const handleStopRecording = () => {
    if (
      document.pictureInPictureEnabled &&
      document.pictureInPictureElement === cameraPreviewRef.current
    ) {
      document
        .exitPictureInPicture()
        .then(() => {
          console.log('✅ Exited Picture-in-Picture');
        })
        .catch((err) => {
          console.warn('Error exiting PiP:', err);
        });
    }

    stopRecording();
  };

  return (
    <div className="record">
      <button className="primary-btn" onClick={() => setIsOpen(true)}>
        <Image src={ICONS.record} alt="record" width={16} height={16} />
        <span>Record a video</span>
      </button>

      {isOpen && (
        <section className="dialog">
          <div
            className={'overlay-record'}
            onClick={() => {
              if (!isRecording && !recordedVideoUrl) {
                closeModal();
              }
            }}
          />
          <div className="dialog-content">
            <div className={'flex justify-between items-start mb-4'}>
              <div>
                <h3 className="text-lg font-semibold">Video Recording</h3>
                {!isRecording && <p>Select mode and click record to begin.</p>}
              </div>

              <button onClick={closeModal}>
                <Image src={ICONS.close} alt="close" width={20} height={20} />
              </button>
            </div>

            {/* Recording Mode Selector */}
            <div className={'w-fit mx-auto'}>
              {!isRecording && !recordedVideoUrl && (
                <aside className="flex gap-3 mb-4">
                  {['screen', 'camera', 'both'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setMode(type as typeof mode)}
                      className={`${
                        mode === type
                          ? 'primary-btn border border-pink-100'
                          : 'secondary-btn'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </aside>
              )}
            </div>

            {/* Status or Recorded Preview */}
            <section
              className={`mb-4 overflow-hidden ${isRecording ? (mode === 'camera' ? 'border-2 border-gray-500' : '') : recordedVideoUrl ? 'border-2 border-gray-500' : ''}`}
            >
              {isRecording ? (
                mode === 'camera' ? (
                  <video
                    ref={cameraPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className={'w-full'}
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
                  className={'w-full'}
                />
              ) : (
                <div />
              )}
            </section>

            {/* Actions */}
            <div className="block flex-wrap gap-3 mx-auto w-fit">
              {!isRecording && !recordedVideoUrl && (
                <button
                  onClick={handleStartRecording}
                  className="px-7 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center gap-2"
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
                  onClick={handleStopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center gap-2"
                >
                  <Image
                    className={'animate-ping'}
                    src={ICONS.record}
                    alt="stop"
                    width={16}
                    height={16}
                  />
                  Stop Recording
                </button>
              )}

              {recordedVideoUrl && (
                <div className={'flex items-center gap-3'}>
                  <button
                    onClick={recordAgain}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                  >
                    Record Again
                  </button>
                  <button
                    onClick={goToUpload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center gap-2"
                  >
                    Continue to Upload
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ✅ Floating Camera Preview with Resize */}
      {isOpen && mode === 'both' && (
        <video
          ref={cameraPreviewRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover hidden"
        />
      )}
    </div>
  );
};

export default RecordScreenWithCamera;
