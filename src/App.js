import React, {useState, useRef, useEffect} from 'react';
import audio from './audio/test.wav';
import captionJSON from './audio/test.json';
import './App.scss';

function App() {
  // Element references to be used to manipulate dom;
  const audioEl     = useRef(null);
  const progressBar = useRef(null);

  // Set initial state using state hooks;
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [currentWords, setCurrentWords] = useState(null);
  const [duration, setDuration]         = useState(null);
  const [progStyles, setProgStyles ]    = useState({ maxWidth: 0, width: 0 }); 

  // Play audio and set audioPlaying flag to true;
  function playAudio() {
    audioEl.current.play();
    setAudioPlaying(true);
  }

  // Play audio and set audioPlaying flag to false;
  function pauseAudio() {
    audioEl.current.pause();
    setAudioPlaying(false);
  }

  // At the end of the audio file, reset the player
  function audioEnded() {
    setAudioPlaying(false);
    audioEl.current.currentTime = 0;
  }

  // As audio plays, store the currentTime in the state;
  function timeUpdated() {
    setCurrentTime(audioEl.current.currentTime);
  }

  // Once audio metadata has loaded, store the duration in the state;
  function metaLoaded() {
    setDuration(audioEl.current.duration);
  }

  // Determine the last word that was stated and determine which sentence it is in;
  // Return all of the words in that sentence to be displayed together;
  function getCurrentWords() {
    const captions = [...captionJSON].reverse();
    const lastActiveWord = captions.find(caption => caption.startTime < currentTime);
    if(!lastActiveWord){
      return;
    }
    const currentSentence = lastActiveWord.sentence;
    const wordsInSentence = captionJSON.filter(caption => caption.sentence === currentSentence);
    return wordsInSentence;
  }

  // Watches `currentTime` and determines the progress;
  // Gets current words based on `currentTime` and stores in state;
  // Only proceed if the currentTime is set and the duration has been loaded;
  useEffect(() => {
    if(currentTime === false || !duration){
      return;
    }
    setCurrentWords(getCurrentWords());
    handleProgress();
  }, [currentTime]);

  function handleProgress() {
    const percentage = currentTime/duration;
    const progMaxWidth = progressBar.current.offsetWidth * percentage;
    let newProgStyles = { ...progStyles  }
        newProgStyles.width = progressBar.current.offsetWidth;
        newProgStyles.maxWidth = progMaxWidth;
    setProgStyles({...newProgStyles});
  }
  
  // Based on where within the progress bar the user clicks, advance audio to appropriate time.
  // Only allow if duration is set and audioElement has been rendered. 
  function changeTime(e) {
    if(!duration && audioEl.current){
      return;
    }
    const adjustedClickPosition = e.pageX - progressBar.current.offsetLeft;
    const clickPercentage = adjustedClickPosition/progressBar.current.offsetWidth;
    if(audioPlaying){
      pauseAudio();
    }
    audioEl.current.currentTime = duration * clickPercentage;
    if(audioPlaying){
      setTimeout(playAudio, 500);
    }
  }

  // Fix for sentence value in json being incorrect;
  // Check for pauses of more than a second to determine a new sentence;
  // Handle formatting of words based on sentence structure;
  function getRealSentences() {
    const rs = [''];
    let realSentenceCount = 0;
    currentWords && currentWords.forEach((word, index) => {
      if(word.startTime > currentTime){
        return;
      }
      const isLastInSetence = (currentWords[index+1] && (currentWords[index+1].startTime - word.startTime > 1));
      rs[realSentenceCount] += word.word;
      if(isLastInSetence){
        rs[realSentenceCount] += '. '; 
        realSentenceCount++;
        rs[realSentenceCount] = ''; 
      } else {
        rs[realSentenceCount] += ' ';
      }
    });
    return rs;
  }

  const realSentences = getRealSentences();
  return (
    <div className="siberia">
      <div className={audioPlaying || currentWords ? "current-caption  active" : "current-caption" }>
        {realSentences.map((sentence, index) => (
          <span key={'sentence-' + index}>{sentence}</span>
        ))}
      </div>
      <div className="audio-player">
        <button disabled={!duration} className="play" onClick={ audioPlaying ? pauseAudio : playAudio }>
          { !duration ? 'Loading' : audioPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="progress-bar" ref={progressBar} onClick={changeTime}>
          <div className="progress-visible" style={progStyles} ></div>
        </div>
      </div>
      <audio src={audio} ref={audioEl} onLoadedMetadata={metaLoaded} onTimeUpdate={timeUpdated} onEnded={audioEnded}></audio>
    </div>
  );
}

export default App;
