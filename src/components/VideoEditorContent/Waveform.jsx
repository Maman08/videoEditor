import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import styles from "./Waveform.module.css";
import { useWavesurfer } from '@wavesurfer/react';

const Waveform = forwardRef(({
  audioSrc,
  waveColor,
  trackId,
  audioId,
  count,
  initialTimePosition,
  onTimePositionChange,
  backgroundColor
}, ref) => {
  const waveformContainerRef = useRef();
  const [duration, setDuration] = useState(0);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const timeToPixelRatio = 60;
  const [isDragging, setIsDragging] = useState(false);
  const [timePosition, setTimePosition] = useState(initialTimePosition);
  const startPosRef = useRef({ x: 0, initialTimePosition });
  const initialPositionRef = useRef(initialTimePosition);
  const [error, setError] = useState(null);
  const { wavesurfer,isReady,currentTime } = useWavesurfer({
    container: waveformContainerRef,
    url: audioSrc,
    waveColor: waveColor,
    height: 30,
    barWidth: 1.5,
    autoCenter: true,
    minPxPerSec:timeToPixelRatio,
    interact:false,
    hideScrollbar:true,
    cursorWidth: 0,
    progressColor:waveColor,
  });

  useEffect(() => {
    if (isReady && wavesurfer) {
      try {
        const audioDuration = wavesurfer.getDuration();
        setDuration(audioDuration);
        const width = audioDuration * timeToPixelRatio;
        console.log(`Audio Details - audioId: ${audioId}, trackId: ${trackId}, count: ${count}, AudioDuration: ${audioDuration}, width: ${width}px`);
        setWaveformWidth(width+15);
      } catch (err) {
        console.error("Error processing audio:", err);
        setError("Failed to process audio file. Please check the file format and try again.");
      }
    }
  }, [isReady, wavesurfer, audioId, trackId, count, timeToPixelRatio]);


  useImperativeHandle(ref, () => ({
    play: () => wavesurfer.play(),
    pause: () => wavesurfer.pause(),
    seekTo: (position) => wavesurfer.seekTo(position),
  }), [wavesurfer]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX,
      initialTimePosition: 0,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && waveformContainerRef.current) {
      const deltaX = e.clientX - startPosRef.current.x;
      const timeDelta = deltaX / timeToPixelRatio;
      const newTimePosition = Math.max(0, startPosRef.current.initialTimePosition + timeDelta);

      setTimePosition(newTimePosition);
      onTimePositionChange(newTimePosition, audioId);
      waveformContainerRef.current.style.transform = `translateX(${deltaX}px)`;
    }
  }, [isDragging, timeToPixelRatio, onTimePositionChange, audioId]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      initialPositionRef.current = timePosition;
      if (waveformContainerRef.current) {
        waveformContainerRef.current.style.transform = 'translateX(0)';
        waveformContainerRef.current.style.left = `${timePosition * timeToPixelRatio}px`;
      }
    }
  }, [isDragging, timePosition, timeToPixelRatio]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


 
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  if(error){
    return <div>{error}</div>; 
  }

  return (
    <div
      className={styles.hideSlider}
      style={{ width: waveformWidth, height: '60px', border: 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div
        className={styles.waveformContainer}
        ref={waveformContainerRef}
        onMouseDown={handleMouseDown}
        style={{
          height: '30px',
          margin: '10px 0',
          width: `${waveformWidth}px`,
          position: 'relative',
          backgroundColor: backgroundColor,
          borderRadius: '5px',
          padding: '5px',
          borderLeft: isDragging ? '5px solid red' : 'none',
          borderRight: isDragging ? '5px solid red' : 'none',
          overflow: 'hidden',
          verticalAlign: 'middle',
        }}
      >
      </div>
    </div>
  );
});

Waveform.displayName = "Waveform";

export default Waveform;




















