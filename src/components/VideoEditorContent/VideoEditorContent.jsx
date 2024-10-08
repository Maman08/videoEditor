import React, { useState, useRef, useEffect } from 'react';
import styles from "./VideoEditorContent.module.css";
import {  FaPlus,FaPause,FaPlay,FaExpand, FaCompress,FaTrash,FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import Waveform from './Waveform.jsx';

const formatDuration = (totalDurationInSeconds) => {
  const minutes = Math.floor(totalDurationInSeconds / 60);
  const seconds = Math.floor(totalDurationInSeconds % 60);

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};


const waveformsColor=[{waveColor:"#746957",trackBackground:"#1d1b1b"},{waveColor:"#8f5341",trackBackground:"#370404"},{waveColor:"#6d5272",trackBackground:"#160435"}]

const VideoEditorContent = () => {
    
    const pixelsPerSecond = 40; // 600px per 10 seconds
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const progressRef = useRef(null);
    const timelineIndicatorRef = useRef(null);
    const timeMarkersRef = useRef(null);
    const animationFrameRef = useRef(null);
    const startTimeRef = useRef(null);
    const progressBarRef = useRef(null);
    const [aspectRatio, setAspectRatio] = useState('16:9'); 
    const [videoAdded, setVideoAdded] = useState(false);
    const [isVideoRendered, setIsVideoRendered] = useState(false);
    const [videoSrc, setVideoSrc] = useState(null);
    const [audioTracks, setAudioTracks] = useState([]);
    const [audioPositions, setAudioPositions] = useState([]);
    const videoRef = useRef(null)
    const [storedWidths, setStoredWidths] = useState({});
    const [maxLength,setMaxLength]=useState(0);
    const [largetSizeAudio,setlargetSizeAudio]=useState(0);
    const totalDuration =videoRef.current?.duration || (maxLength>largetSizeAudio?maxLength:largetSizeAudio);
    const [selectedAudioId, setSelectedAudioId] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const seekBarRef = useRef();
    const formattedDuration = formatDuration(totalDuration);
    const formattedCurrentDuration = formatDuration(currentTime);
    const [seekBarValue, setSeekBarValue] = useState(0);
    const [frames, setFrames] = useState([]);
    const canvasRef = useRef(null);
    const trackRef = useRef(null);
    const [videoLength, setVideoLength] = useState(0);
    const [audioMovePosition, setAudioMovePosition] = useState(0);
    const audioMoveRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    
    
    


     useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setAudioMovePosition(prev => prev - 1); // Moving left by 1px every 16ms (~60px/sec)
            }, 16); // ~60 frames per second (1000ms/16 = ~60fps)
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval); // Clean up the interval on unmount or when paused
    }, [isPlaying]);

  useEffect(() => {
    const videoElement = videoRef.current; // Get the video element
  
    if (!videoElement) {
      return; // Exit the useEffect if the video element is not yet rendered
    }
  
    const canvas = canvasRef.current; // Get the canvas element for frame extraction
    const context = canvas?.getContext('2d'); // Get the 2D context of the canvas for drawing frames
  
    if (!canvas || !context) {
      return; // Exit if canvas or context is not available
    }
  
    // Event listener to handle when the video metadata is loaded (i.e., the video duration becomes available)
    const handleLoadedMetadata = () => {
      const duration = videoElement.duration; // Get the video duration
      setVideoLength(duration); // Set the video duration in state
      canvas.width = 70; // Set the canvas width for thumbnail extraction
      canvas.height = 80; // Set the canvas height for thumbnail extraction
  
      // Function to extract frames from the video
      const extractFrames = async () => {
        const framesToExtract = Math.ceil(duration); // Calculate how many frames to extract (one per second)
        const extractedFrames = []; // Array to store the extracted frames
  
        // Loop through each second of the video to extract frames
        for (let i = 0; i < framesToExtract; i++) {
          const time = i; // The time at which to extract the frame
          videoElement.currentTime = time; // Set the video to the current time
  
          // Wait for the video to seek to the correct time before extracting the frame
          await new Promise((resolve) => {
            videoElement.onseeked = () => {
              // Draw the current frame from the video onto the canvas
              context.drawImage(videoElement, 0, 0, 70, 80);
  
              // Convert the canvas drawing into a data URL (thumbnail image)
              const frameDataUrl = canvas.toDataURL('image/jpeg');
  
              // Store the frame in the array with its time and thumbnail data
              extractedFrames.push({ id: i, time, thumbnail: frameDataUrl });
  
              resolve(); // Resolve the promise once the frame is extracted
            };
          });
        }
        // Update the frames state with the extracted frames
        setFrames(extractedFrames);
      };
  
      extractFrames(); // Call the frame extraction function
    };
  
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
  
    // Event listener for updating the current time while the video plays
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
  
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
  
    // Cleanup the event listeners when the component unmounts
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoSrc]); // Add videoSrc as a dependency
  

   
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    const toggleAspectRatio = () => {
      setAspectRatio(prev => (prev === '16:9' ? '1:1' : '16:9'));
  };

    const createTimeMarkers = () => {
        const timeMarkers = [];
        const totalWidth = totalDuration * pixelsPerSecond;
        for (let i = 0; i <= totalDuration+20; i++) {
            timeMarkers.push(
                <div key={i} className="time-marker" style={{ left: `${i * pixelsPerSecond}px` }}>
                    {i % 2 === 0 ? formatTime(i) : <strong>.</strong>}
                </div>
            );
        }
        return timeMarkers;
    };

    // const updateProgress = (timestamp) => {
    //     if (!startTimeRef.current) startTimeRef.current = timestamp;
    //     const elapsed = (timestamp - startTimeRef.current) / 1000; // Convert to seconds

    //     if (elapsed <= totalDuration) {
    //         const progress = (elapsed / totalDuration) * 100;
    //         if (progressRef.current) progressRef.current.style.width = `${progress}%`;

    //         const pixelPosition = elapsed * pixelsPerSecond;
    //         if (pixelPosition <= 300) {
    //             if (timelineIndicatorRef.current) timelineIndicatorRef.current.style.left = `${pixelPosition}px`;
    //         } else {
    //             if (timeMarkersRef.current) timeMarkersRef.current.style.transform = `translateX(${300 - pixelPosition}px)`;
    //         }

    //         setElapsedTime(elapsed);
    //         animationFrameRef.current = requestAnimationFrame(updateProgress);
    //     } else {
    //         setIsPlaying(false);
    //     }
    // };

    // const handlePlayPause = () => {
    //     if (isPlaying) {
    //         cancelAnimationFrame(animationFrameRef.current);
    //         setIsPlaying(false);
    //     } else {
    //         startTimeRef.current = null;
    //         setIsPlaying(true);
    //         animationFrameRef.current = requestAnimationFrame(updateProgress);
    //     }
    // };

    // const handleProgressBarClick = (event) => {
    //     const { left, width } = progressBarRef.current.getBoundingClientRect();
    //     const clickX = event.clientX - left;
    //     const newTime = (clickX / width) * totalDuration;
    //     setElapsedTime(newTime);
    //     if (isPlaying) {
    //         startTimeRef.current = null; // Reset start time for animation
    //         animationFrameRef.current = requestAnimationFrame(updateProgress);
    //     }
    // };


    
  //   const togglePlayPause = () => {
  //     // Handle video play/pause only if a video is added
  //     if (videoAdded && videoRef.current) {
  //         if (isPlaying) {
  //             videoRef.current.pause();
  //         } else {
  //             videoRef.current.play();
  //         }
  //     }

  //     if (isPlaying) {
  //         pauseAllTracks();
  //     } else {
  //         playAllTracks();
  //     }

  //     setIsPlaying((prev) => !prev);
  // };




  const playAllTracks = () => {
    audioTracks.forEach((track) => {
      track.audioDetails.forEach((audioDetail) => {
        const wavesurferInstance = track.waveformRefs[audioDetail.url];
        if (wavesurferInstance) {
          const { timePosition } = audioDetail;
          console.log("uuppppppppppper",audioDetail)
          setTimeout(() => {
            if (wavesurferInstance) {
              console.log('wavesurferInstance',wavesurferInstance);
              console.log('seekBarValue ',seekBarValue);
              console.log('audioDetail.timePosition+ audioDetail.duration',audioDetail.timePosition+ audioDetail.duration)
              wavesurferInstance.play();
              
  
            }
          }, timePosition * 1000);
        }
      });
    });
  };

  const pauseAllTracks = () => {
    audioTracks.forEach((track) => {
      track.audioDetails.forEach((audioDetail) => {
        const wavesurferInstance = track.waveformRefs[audioDetail.url];
        if (wavesurferInstance) {
          console.log('wavesurferInstance',wavesurferInstance);
            wavesurferInstance.pause(); 
        }
      });
    });
  };
  

  const handlePlayPauseAll = () => {
    if (isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      pauseAllTracks(); // Pause all tracks
    } else {
      if (videoRef.current) {
        videoRef.current.play();
      }
      playAllTracks(); // Play all tracks
    }
    setIsPlaying(!isPlaying); // Toggle play/pause state
  };

  
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setSeekBarValue((prev) => {
          const newSeekBarValue = prev + 1;
          return newSeekBarValue <= 100 ? newSeekBarValue : 100; // Ensure seekBarValue stays within 0-100 range
        });
  
        setCurrentTime((prev) => {
          const newTime = prev + 1;
          return newTime <= totalDuration ? newTime : totalDuration; // Ensure currentTime doesn't exceed totalDuration
        });
  
        if (currentTime >= totalDuration) {
          setIsPlaying(false); // Stop playback when media reaches the end
          clearInterval(interval);
        }
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTime, totalDuration]);
  

  const handleSeekBarChange = (e) => {
    const value = e.target.value;
    const newTime = (value / 100) * totalDuration;
  
    if (newTime <= totalDuration) {
      setSeekBarValue(value);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };
  
   //if the audio starts playing move forward the seekbar and update the current time
useEffect(() => {
  let interval;
  if (isPlaying) {
    interval = setInterval(() => {
      setSeekBarValue((prev) => prev + 1);
      setCurrentTime((prev) => prev + 1);
    }, 1000);
  }

  return () => {
    clearInterval(interval);
  };
}, [isPlaying]);
  
useEffect(() => {
  if (videoRef.current) {
    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime;

      if (totalDuration && currentTime <= totalDuration) {
        setCurrentTime(currentTime);
        setSeekBarValue((currentTime / totalDuration) * 100);
      }
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }
}, [audioTracks, totalDuration]);


    const handleAddVideo = (event) => {
     const file = event.target.files[0];
     if (file) {
       const videoURL = URL.createObjectURL(file);
       setVideoSrc(videoURL);
       setVideoAdded(true);
       if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setIsVideoRendered(true);
        const timelineData = generateTimelineData();
        console.log('Timeline Data:', timelineData);

      };
    }
     }
   };
   useEffect(() => {
    if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
            setIsVideoRendered(true);  
        };
    }
}, [videoSrc]);

const handleWaveformClick = (audioId) => {
  setSelectedAudioId(audioId);
};

const handleDeleteAudio = (audioId) => {
  setAudioTracks((prevTracks) => 
    prevTracks.map(track => ({
      ...track,
      audioDetails: track.audioDetails.filter(audio => audio.audioId !== audioId)
    }))
  );
  setSelectedAudioId(null); // Clear the selected audio after deletion
};
const toggleMute = () => {
    if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted); // Update the state based on the muted property of the video element
    }
};

  const renderVideoTrack = () => (
    videoAdded ? (
        <div className={styles["video-track"]} style={{ marginTop: isVideoRendered ? "4vh" : "4vh" }}>
            {/* <video ref={videoRef} src={videoSrc} width="400"  /> */}.
            <div className={styles["video-container"]} >
                    <video ref={videoRef} src={videoSrc}   style={{
                    width: aspectRatio === '16:9' ? '350px' : '212px',  // Adjust width for 16:9 or 1:1
                    height: aspectRatio === '16:9' ? '177px' : '200px',  // Adjust height for 16:9 or 1:1
                    position: 'relative',objectFit: "cover" 
                }}/>
                    <div className={styles["aspect-ratio-toggle"]} onClick={toggleAspectRatio}>
                        {aspectRatio === '16:9' ? <FaExpand /> : <FaCompress />}
                    </div>
                </div>

        </div>
    ) : (
        <div className={styles["add-video-button"]} style={{marginTop:"7vh",display:"flex"}}>
            <div className='coll' style={{width:"11%",display: "flex", alignItems: "center" ,top:"50%"}}>{!isVideoRendered ? <FaVolumeMute style={{ fontSize: "30px" ,color:"#5F5F5F"}} /> : <></>}</div>
            <div style={{background:"#121212",width:"88%",height:"9vh" }}>  
               <div style={{transform:"translateY(2.5vh)"}}>
               <label
                style={{ background: "#3a1d83", color: "white", border: "none", borderRadius: "5px", padding: "14px 18px", cursor: "pointer"}}
                htmlFor="video-upload"
                    >
                        + Add Video
                    </label>
                     
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleAddVideo}
                        style={{ display: 'none'}}
                        id="video-upload"
                    />
               </div>
            </div> 
            
        </div>
    )
);
  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same track
      const trackIndex = audioTracks.findIndex(track => track.id.toString() === source.droppableId);
      const newAudioDetails = Array.from(audioTracks[trackIndex].audioDetails);
      const [reorderedItem] = newAudioDetails.splice(source.index, 1);
      newAudioDetails.splice(destination.index, 0, reorderedItem);

      const newTracks = [...audioTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        audioDetails: newAudioDetails
      };

      setAudioTracks(newTracks);
    } else {
      // Moving between tracks
      const sourceTrackIndex = audioTracks.findIndex(track => track.id.toString() === source.droppableId);
      const destTrackIndex = audioTracks.findIndex(track => track.id.toString() === destination.droppableId);

      const sourceAudioDetails = Array.from(audioTracks[sourceTrackIndex].audioDetails);
      const destAudioDetails = Array.from(audioTracks[destTrackIndex].audioDetails);

      const [movedItem] = sourceAudioDetails.splice(source.index, 1);
      destAudioDetails.splice(destination.index, 0, movedItem);

      const newTracks = [...audioTracks];
      newTracks[sourceTrackIndex] = {
        ...newTracks[sourceTrackIndex],
        audioDetails: sourceAudioDetails
      };
      newTracks[destTrackIndex] = {
        ...newTracks[destTrackIndex],
        audioDetails: destAudioDetails
      };

      setAudioTracks(newTracks);
    }
  };
  // const renderAudioTracks = () => {
  //   const handleTimePositionChange = (newTimePosition, audioId) => {
  //     setAudioTracks((prevTracks) => 
  //       prevTracks.map(track => ({
  //         ...track,
  //         audioDetails: track.audioDetails.map(audio => 
  //           audio.audioId === audioId 
  //             ? { ...audio, timePosition: newTimePosition }
  //             : audio
  //         )
  //       }))
  //     );
  //   };
  
  //   return (
  //     <DragDropContext onDragEnd={onDragEnd}>
  //       <div className={styles["audio-tracks-container"]} style={{ marginTop: "1vh" }}>
  //         {audioTracks.map((track, index) => (
  //           <Droppable droppableId={track.id.toString()} direction="horizontal" key={track.id}>
  //             {(provided) => (
  //               <div
  //                 {...provided.droppableProps}
  //                 ref={provided.innerRef}
  //                 className={styles["audio-track"]}
  //                 style={{ backgroundColor: track.colors.trackBackground, position: 'relative' }}
  //               >
  //                 <div className={styles["audio-track-row"]}>
  //                   {track.audioDetails.map((audioDetail, idx) => (
  //                     <Draggable key={audioDetail.audioId} draggableId={audioDetail.audioId.toString()} index={idx}>
  //                       {(provided) => (
  //                         <div
  //                           ref={provided.innerRef}
  //                           {...provided.draggableProps}
  //                           {...provided.dragHandleProps}
  //                         >
  //                           <Waveform
  //                             audioSrc={audioDetail.url}
  //                             ref={(el) => track.waveformRefs[audioDetail.url] = el}
  //                             waveColor={track.colors.waveColor}
  //                             cursorColor={track.colors.cursorColor}
  //                             trackId={track.id}
  //                             audioId={audioDetail.audioId}
  //                             count={track.count}
  //                             position={audioDetail.position}
  //                             initialTimePosition={audioDetail.timePosition}
  //                             onTimePositionChange={handleTimePositionChange}
  //                           />
  //                         </div>
  //                       )}
  //                     </Draggable>
  //                   ))}
  //                   {provided.placeholder}
  //                   <div className={styles["plus-icon-container"]}>
  //                     <FaPlus
  //                       className={styles["add-icon"]}
  //                       onClick={() => document.getElementById(`audio-upload-${index}`).click()}
  //                     />
  //                   </div>
  //                   <input
  //                     type="file"
  //                     accept="audio/*"
  //                     onChange={(e) => handleAudioUpload(e, index)}
  //                     style={{ display: 'none' }}
  //                     id={`audio-upload-${index}`}
  //                   />
  //                 </div>
  //               </div>
  //             )}
  //           </Droppable>
  //         ))}
  //       </div>
  //     </DragDropContext>
  //   );
  // };
  
  
  
 
  // const handleAudioUpload = (event, trackIndex = null) => {
  //   const files = event.target.files;
  //   if (files.length > 0) {
  //     const file = files[0];
  //     const newAudioUrl = URL.createObjectURL(file);
  //     const newAudioId = Date.now();
  //     let position = 1;
  //     let timePosition = 0;

  //     const audio = new Audio(newAudioUrl);
      
  //     audio.addEventListener('loadedmetadata', () => {
  //       const audioDuration = audio.duration;
        
  //       if (trackIndex !== null && audioTracks[trackIndex]) {
  //         timePosition = audioTracks[trackIndex].audioDetails.reduce((sum, audio) => sum + (audio.duration || 0), 0);
  //         position = audioTracks[trackIndex].count + 1;
          
  //         setAudioTracks((prevTracks) => {
  //           const updatedTracks = [...prevTracks];
  //           const track = updatedTracks[trackIndex];
  //           track.audioUrls.push(newAudioUrl);
  //           track.count += 1;
  //           track.audioDetails.push({ 
  //             audioId: newAudioId, 
  //             url: newAudioUrl, 
  //             position,
  //             duration: audioDuration,
  //             timePosition
  //           });
  //           return updatedTracks;
  //         });
  //       } else {
  //         const newTrackIndex = audioTracks.length;
  //         const colors = waveformsColor[newTrackIndex % 3];
          
  //         const newAudioTrack = {
  //           id: Date.now(),
  //           audioUrls: [newAudioUrl],
  //           waveformRefs: {},
  //           colors: colors,
  //           count: 1,
  //           audioDetails: [{ 
  //             audioId: newAudioId, 
  //             url: newAudioUrl, 
  //             position,
  //             duration: audioDuration,
  //             timePosition
  //           }]
  //         };
  //         setAudioTracks((prevTracks) => [...prevTracks, newAudioTrack]);
  //       }

  //       // Update audioPositions state
  //       setAudioPositions((prevPositions) => [
  //         ...prevPositions,
  //         { audioId: newAudioId, timePosition: timePosition }
  //       ]);

  //       console.log(`Audio uploaded - ID: ${newAudioId}, Track: ${trackIndex}, Position: ${position}, Duration: ${audioDuration.toFixed(2)}s, Time Position: ${timePosition.toFixed(2)}s`);
        
  //     });

  //     event.target.value = '';
  //   }    
  // };


  const handleAudioUpload = (event, trackIndex = null) => {
    const files = event.target.files;
    if (files.length > 0) {
        const file = files[0];
        const newAudioUrl = URL.createObjectURL(file);
        const newAudioId = Date.now();
        let position = 1;
        let timePosition = 0;

        const audio = new Audio(newAudioUrl);
        
        audio.addEventListener('loadedmetadata', () => {
            const audioDuration = audio.duration;
            if(audioDuration>largetSizeAudio){
              setlargetSizeAudio(audioDuration)
            }

            if (!isNaN(audioDuration) && audioDuration > 0) {
                if (trackIndex !== null && audioTracks[trackIndex]) {
                    timePosition = audioTracks[trackIndex].audioDetails.reduce((sum, audio) => sum + (audio.duration || 0), 0);
                    position = audioTracks[trackIndex].count + 1;
                    
                    setAudioTracks((prevTracks) => {
                        const updatedTracks = [...prevTracks];
                        const track = updatedTracks[trackIndex];
                        track.audioUrls.push(newAudioUrl);
                        track.count += 1;
                        track.audioDetails.push({ 
                            audioId: newAudioId, 
                            url: newAudioUrl, 
                            position,
                            duration: audioDuration,
                            timePosition
                        });
                        return updatedTracks;
                    });
                } else {
                    const newTrackIndex = audioTracks.length;
                    const colors = waveformsColor[newTrackIndex % 3];

                    const newAudioTrack = {
                        id: Date.now(),
                        audioUrls: [newAudioUrl],
                        waveformRefs: {},
                        colors: colors,
                        count: 1,
                        audioDetails: [{ 
                            audioId: newAudioId, 
                            url: newAudioUrl, 
                            position,
                            duration: audioDuration,
                            timePosition
                        }]
                    };
                    setAudioTracks((prevTracks) => [...prevTracks, newAudioTrack]);
                }

                // Update audioPositions state
                setAudioPositions((prevPositions) => [
                    ...prevPositions,
                    { audioId: newAudioId, timePosition: timePosition }
                ]);

                console.log(`Audio uploaded - ID: ${newAudioId}, Track: ${trackIndex}, Position: ${position}, Duration: ${audioDuration.toFixed(2)}s, Time Position: ${timePosition.toFixed(2)}s`);
                const timelineData = generateTimelineData();
                console.log('Timeline Data:', timelineData);

            } else {
                console.error("Invalid audio duration", audioDuration);
            }
        });

        event.target.value = '';
    }    
};




  useEffect(() => {
    console.log("audioTracks:", audioTracks);
    audioTracks.forEach(track => console.log("track.audioDetails:", track.audioDetails));
  }, [audioTracks]);
  

  const handleTimePositionChange = (newTimePosition, audioId) => {
    setAudioTracks((prevTracks) =>
        prevTracks.map(track => {
            let playTime = 0; // Reset playTime for each track
            const updatedAudioDetails = track.audioDetails.map((audio, index) => {
                if (audio.audioId === audioId) {
                    for (let k = 0; k < index; k++) {
                        playTime += track.audioDetails[k].duration;
                    }
                    
                    const updatedTimePosition = playTime + newTimePosition;
                    
                    console.log(`Updated time position for audio ${audioId}: ${updatedTimePosition.toFixed(2)} seconds`);

                    // Return the updated audio object
                    return { ...audio, timePosition: updatedTimePosition };
                }

                return audio;  // Return the audio without changes if it's not the one we're updating
            });

            return { ...track, audioDetails: updatedAudioDetails };
        })
    );

    setAudioPositions((prevPositions) =>
        prevPositions.map(pos =>
            pos.audioId === audioId
                ? { ...pos, timePosition: newTimePosition }
                : pos
        )
    );

    console.log(`Final updated time position for audio ${audioId}: ${newTimePosition.toFixed(2)} seconds`);
    console.log("audioTracks",audioTracks)
    updateMaxLength();
};

const updateMaxLength = () => {
  let maxTimePosition = 0;
  let maxDuration = 0;

  audioTracks.forEach(track => {
      track.audioDetails.forEach(audio => {
        console.log("audioDetails in changing",audio)
          if (audio.timePosition > maxTimePosition) {
              maxTimePosition = audio.timePosition;
              maxDuration = audio.duration; // Assuming each audio object has a duration property
          }
      });
  });
  const newMaxLength = maxTimePosition + maxDuration; // Add maxTimePosition and maxDuration
  setMaxLength(newMaxLength); // Update state
  console.log(`Max Length updated: ${newMaxLength.toFixed(2)} seconds`);
};

const generateTimelineData = () => {
  const timelineData = {
    video: null,  // Default to null if no video is added
    audioTracks: []
  };

  // Check if video is present
  if (videoSrc) {
    // Get video duration from your `videoRef`
    const videoDuration = videoRef.current?.duration || 0;

    timelineData.video = {
      path: videoSrc,   // The URL of the video
      duration: videoDuration.toFixed(2) // Store the video duration
    };
  }

  // Loop through audioTracks and structure them into the correct format
  audioTracks.forEach(track => {
    const clips = track.audioDetails.map(audio => ({
      path: audio.url,  // URL of the audio
      start: audio.timePosition,  // Start time in seconds
      duration: audio.duration    // Duration in seconds
    }));

    // Add this track's clips to the audioTracks array in timelineData
    timelineData.audioTracks.push({ clips });
  });

  return timelineData;
};



  

  const renderAudioTracks = () => {
    
    console.log("Rendering audio tracks:", audioTracks); 

    if (!audioTracks) {
        return <div>No audio tracks available.</div>; 
    }

    return (
        <div className={styles["audio-tracks-container"]} style={{ marginTop: "-2vh",overflowX: "auto" ,gap:"0vh" , maxHeight:isVideoRendered?"17.5vh" :"40vh"}}>
            {audioTracks.map((track, index) => {
                // Check if track is valid
                if (!track || !track.audioDetails) {
                    console.error("Invalid track:", track); // Log invalid track
                    return null; // Skip rendering this track
                }

                return (
                    <div
                        key={track.id}
                        className={styles["audio-track"]}
                        style={{ position: 'relative', padding: "-15px" }}
                    >
                        <div className={styles["audio-track-row"]}>
                            {track.audioDetails.map((audioDetail) => {
                                // Check if audioDetail is valid
                                if (!audioDetail || !audioDetail.audioId || !audioDetail.url) {
                                    console.error("Invalid audio detail:", audioDetail); // Log invalid audio detail
                                    return null; // Skip rendering this audio detail
                                }

                                try {
                                    return (
                                        <div key={audioDetail.audioId} style={{ position: 'relative', transform: `translateX(${audioMovePosition}px)` }}>
                                            <Waveform
                                                audioSrc={audioDetail.url}
                                                ref={(el) => track.waveformRefs[audioDetail.url] = el}
                                                waveColor={track.colors.waveColor}
                                                trackId={track.id}
                                                audioId={audioDetail.audioId}
                                                count={track.count}
                                                position={audioDetail.position}
                                                initialTimePosition={audioDetail.timePosition}
                                                onTimePositionChange={handleTimePositionChange}
                                                backgroundColor={track.colors.trackBackground}
                                            />
                                        </div>
                                    );
                                } catch (error) {
                                    console.error("Error rendering Waveform:", error);
                                    return <div>Error rendering waveform for audio ID: {audioDetail.audioId}</div>;
                                }
                            })}
                            <div className={styles["plus-icon-container"]} style={{ zIndex: "1000" ,position:"absolute",left:"97%"}}>
                                <FaPlus
                                    className={styles["add-icon"]}
                                    onClick={() => document.getElementById(`audio-upload-${index}`).click()}
                                />
                            </div>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleAudioUpload(e, index)}
                                style={{ display: 'none' }}
                                id={`audio-upload-${index}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


  const renderFrames = () => (
    <div ref={trackRef} className="overflow-x-auto whitespace-nowrap pb-4" style={{ maxWidth: '100%', height: '80px',marginTop:"4vh" }}>
      <div style={{ display: 'inline-block', whiteSpace: 'nowrap',paddingLeft:"5px" }}>
        {frames.map((frame) => (
          <img
            key={frame.id}
            src={frame.thumbnail}
            alt={`Frame at ${frame.time.toFixed(2)}s`}
            style={{
              width: '47px',
              height: '64px',
              display: 'inline-block',
              marginRight: '2px',
              border: Math.abs(frame.time - currentTime) < 0.5 ? '2px solid blue' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
  




      return (
        <div className="container">
            <style>
                {`
                    .container {
                      
                        width: 90%;
                        height:95vh;
                        margin: 0 75px;
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        font-family: "Urbanist", sans-serif;
                        background-color: black;
                    }
                    .timeline {
                        background-color: rgba(0, 0, 0, 0.3);
                        position: relative;
                        margin-bottom: 20px;
                        overflow: hidden;
                        margin-top:3vh;
                    }
                    .time-markers {
                        display: flex;
                        position: absolute;
                        top: 5px;
                        left: 0;
                        transition: transform 0.1s linear;
                    }
                    .time-marker {
                        font-size: 12px;
                        color: #5F5F5F;
                        width: 60px;
                        text-align: center;
                        font-family: "Urbanist", sans-serif;
                        font-weight:700;
                    }
                    .add-buttons {
                        position: absolute;
                        top: 30px;
                        left: 15px;
                    }
                    .add-button {
                        background-color: #3a1d83;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        display: block;
                    }
                    .controls {
                        display: flex;
                        align-items: center;
                        margin-top: auto;
                    }
                    .play-button {
                        width: 60px;
                        height: 60px;
                        background-color: white;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        cursor: pointer;
                        margin-top: 4vh;
                    }
                    .play-icon {
                        width: 0;
                        height: 0;
                        border-top: 15px solid transparent;
                        border-left: 25px solid black;
                        border-bottom: 15px solid transparent;
                        margin-left: 5px;
                    }
                    .progress-bar {
                        flex-grow: 1;
                        height: 5px;
                        background-color: #444;
                        margin: 0 20px;
                        position: relative;
                    }
                    .progress {
                        width: 0;
                        height: 100%;
                        background-color: white;
                        transition: width 0.1s linear;
                    }
                    .time {
                        font-size: 14px;
                        min-width: 40px;
                    }
                    .timeline-indicator {
                        position: absolute;
                        top: 1%;
                        left: 11%;
                        width: 2px;
                        height: 65vh;
                        background-color: white;
                        z-index: 10;
                    }
                `}
            </style>
            
            {isVideoRendered && renderVideoTrack()  }
            {/* {console.log("Video Came",isVideoRendered)} */}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <div className="timeline" style={{marginTop: isVideoRendered ? '3vh' : '10vh',height:isVideoRendered ? '45vh' : '65vh'}}>
                <div className="row" style={{display:"flex"}}>
                  <div className="coll" style={{width:"11.30%",boxShadow: "4px 0 8px rgba(0, 0, 0, 0.7)", position: "relative"}}></div>
                  <div className="col" style={{width:"88%", transform:"translateX(0)"}} >
                    <div className="time-markers"  style={{marginTop:"-1vh",transform: `translateX(${audioMovePosition}px)`}}>
                       {createTimeMarkers()}

                    </div>
                  </div>
                </div>

                {isVideoRendered && (
                    <div className="row" style={{ display: "flex" }}>
                      <div className="coll" style={{ width: "11.30%",display: "flex", alignItems: "center" ,top:"50%",boxShadow: "4px 0 8px rgba(0, 0, 0, 0.7)", position: "relative"}}>
                      <div onClick={toggleMute} style={{cursor:"pointer"}}>
                         {isMuted ? (
                             <FaVolumeMute style={{ fontSize: "30px", color: "#5F5F5F" }} />
                         ) : (
                             <FaVolumeUp style={{ fontSize: "30px", color: "#5F5F5F" }} />
                         )}
                     </div>
                      </div>
                      <div className="col" style={{ width: "88%", transform: "translateX(0)",marginTop:"-1vh" }}>
                        {renderFrames()} 
                      </div>
                    </div>
                  )}

                       {!isVideoRendered && renderVideoTrack()}
                      <div className="row" style={{display:"flex"}}>
                        <div className="coll" style={{width:"11%",boxShadow: "4px 0 8px rgba(0, 0, 0, 0.7)", position: "relative"}}></div>
                        <div className="col" style={{width:"88%",transition: 'transform 0.1s linear'}}>
                        <div className="audio-move" style={{maxHeight: isVideoRendered? "140px" : "260px",paddingTop:"1vh"}}>{renderAudioTracks()}</div>
                       <div className={styles["add-audio-button"]} style={{ marginTop: (!isVideoRendered && audioTracks.length >= 6) || (isVideoRendered && audioTracks.length >= 3) ? "5vh" : "0vh"}}>
                            <label htmlFor="audio-upload-new" style={{background: "#3a1d83", color: "white", border: "none", borderRadius: "5px", padding: "14px 18px", cursor: "pointer",fontFamily:"Urbanist" }}>
                              + Add Audio
                            </label>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleAudioUpload(e)}
                              style={{ display: 'none' }}
                              id="audio-upload-new"
                            />
                        </div>
                        </div>
                      </div>
                  


                <div className="timeline-indicator" ref={timelineIndicatorRef}  ></div> 
            </div>
            <div className="controls">


            <div className={styles["seek-bar"]} >
                   <input
                     ref={seekBarRef}
                     name="seekBar"
                     id="seekBar"
                     type="range"
                     min="0"
                     max={100}
                     value={seekBarValue} // Bind to seekBarValue
                     onChange={handleSeekBarChange} // Handle seeking
                   />
                 </div>
                
            </div>
            <div className={styles["play-pause-button"]} style={{marginBottom:"30px"}} >
                <button  style={{marginRight:"10px"}}
                   className={styles["seek-controls-button-play"]}
                   onClick={handlePlayPauseAll}
                >
                {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
            </div>
          </div>
            
        
    );
};

export default VideoEditorContent;








