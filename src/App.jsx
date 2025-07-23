import React, { useState, useEffect, useRef } from "react";
import { paragraphs } from "./paragraphs";
import "./App.css";

function getRandomParagraph() {
  return paragraphs[Math.floor(Math.random() * paragraphs.length)];
}

const SLIDING_WINDOW = 8; // Number of recently typed chars to show

function getCategory(wpm) {
  if (wpm < 20) return { label: "Turtle 🐢", color: "#64748b" };
  if (wpm < 40) return { label: "Rabbit 🐇", color: "#22d3ee" };
  if (wpm < 60) return { label: "Cheetah 🐆", color: "#facc15" };
  return { label: "Hawk 🦅", color: "#22c55e" };
}

// Confetti component
function Confetti({ show }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!show) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    let particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H - H,
        r: Math.random() * 6 + 4,
        d: Math.random() * 100,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05
      });
    }
    let angle = 0;
    let animationFrame;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      angle += 0.01;
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(angle);
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 3);
        ctx.stroke();
      }
      animationFrame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [show]);
  return show ? (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 2000
      }}
    />
  ) : null;
}

export default function App() {
  const [target, setTarget] = useState(getRandomParagraph());
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [playSound, setPlaySound] = useState(false);
  const inputRef = useRef(null);
  const paraBoxRef = useRef(null);
  const currentCharRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setShowModal(true);
      setPlaySound(true);
      inputRef.current && inputRef.current.blur();
    }
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (playSound && showModal && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setPlaySound(false);
    }
  }, [playSound, showModal]);

  useEffect(() => {
    // Calculate WPM and accuracy
    const wordsTyped = input.trim().split(/\s+/).length;
    const minutes = (60 - timeLeft) / 60;
    setWpm(minutes > 0 ? Math.round(wordsTyped / minutes) : 0);

    let correct = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === target[i]) correct++;
    }
    setAccuracy(input.length > 0 ? Math.round((correct / input.length) * 100) : 100);
    setMistakes(input.length - correct);
  }, [input, timeLeft, target]);

  useEffect(() => {
    // Auto-scroll to current character
    if (currentCharRef.current && paraBoxRef.current) {
      const charRect = currentCharRef.current.getBoundingClientRect();
      const boxRect = paraBoxRef.current.getBoundingClientRect();
      if (charRect.left < boxRect.left || charRect.right > boxRect.right) {
        paraBoxRef.current.scrollLeft += charRect.left - boxRect.left - boxRect.width / 4;
      }
    }
  }, [input, target]);

  const handleInput = (e) => {
    if (!isRunning && timeLeft > 0) setIsRunning(true);
    if (timeLeft === 0) return;
    setInput(e.target.value);
  };

  const handleRestart = () => {
    setTarget(getRandomParagraph());
    setInput("");
    setTimeLeft(60);
    setIsRunning(false);
    setWpm(0);
    setAccuracy(100);
    setMistakes(0);
    setShowModal(false);
    setPlaySound(false);
    inputRef.current && inputRef.current.focus();
  };

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Sliding window logic
  const startIdx = Math.max(0, input.length - SLIDING_WINDOW);
  const recentTyped = target.slice(startIdx, input.length);
  const remaining = target.slice(input.length);

  const category = getCategory(wpm);

  return (
    <>
      <img className="background-img" src="/Moon.jpg" alt="mountain background" />
      <div className="background-overlay"></div>
      <div className={`typing-app${darkMode ? " dark" : ""}`}> 
        <Confetti show={showModal} />
        <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3" preload="auto" />
        <div className="header-row">
          <h1>Typing Speed Checker</h1>
          <button className="toggle-btn" onClick={handleToggleTheme}>
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <div
          className={`paragraph-box${darkMode ? " dark" : ""}`}
          ref={paraBoxRef}
        >
          {/* Show last N typed chars with correct/incorrect status */}
          {recentTyped.split("").map((char, idx) => {
            const realIdx = startIdx + idx;
            let className = "";
            if (input[realIdx]) {
              className = input[realIdx] === char ? "correct" : "incorrect";
            }
            return (
              <span key={realIdx} className={className}>{char}</span>
            );
          })}
          {/* Show remaining chars, highlight current */}
          {remaining.split("").map((char, idx) => {
            let className = "";
            if (idx === 0 && timeLeft > 0) className = "current";
            return (
              <span
                key={input.length + idx}
                className={className}
                ref={idx === 0 && timeLeft > 0 ? currentCharRef : null}
              >
                {char}
              </span>
            );
          })}
        </div>
        <textarea
          ref={inputRef}
          className={`typing-input${darkMode ? " dark" : ""}`}
          value={input}
          onChange={handleInput}
          placeholder="Start typing here..."
          disabled={timeLeft === 0}
          rows={2}
          style={{fontSize: '1.25rem', minHeight: 50}}
        />
        <div className="stats">
          <div><b>Time Left:</b> {timeLeft}s</div>
          <div><b>WPM:</b> {wpm}</div>
          <div><b>Accuracy:</b> {accuracy}%</div>
          <div><b>Mistakes:</b> {mistakes}</div>
        </div>
        <button className="restart-btn" onClick={handleRestart}>Restart</button>

        {/* Modal Popup for stats and chart */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Time's Up!</h2>
              <div className="category-label" style={{color: category.color}}>
                {category.label}
              </div>
              <div className="modal-stats">
                <div className="chart-row">
                  <span className="chart-label">WPM</span>
                  <span className="chart-value">{wpm}</span>
                  <div className="bar-bg"><div className="bar" style={{width: Math.min(wpm + 20, 100) + '%', background: '#6366f1'}}></div></div>
                </div>
                <div className="chart-row">
                  <span className="chart-label">Accuracy</span>
                  <span className="chart-value">{accuracy}%</span>
                  <div className="bar-bg"><div className="bar" style={{width: Math.min(accuracy, 100) + '%', background: '#22c55e'}}></div></div>
                </div>
                <div className="chart-row">
                  <span className="chart-label">Mistakes</span>
                  <span className="chart-value">{mistakes}</span>
                  <div className="bar-bg"><div className="bar" style={{width: Math.min(mistakes, 100) + '%', background: '#ef4444'}}></div></div>
                </div>
              </div>
              <button className="restart-btn" onClick={handleRestart} style={{marginTop: 18}}>Restart</button>
              <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
