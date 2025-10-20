/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useAudioStore, useLogStore } from '../../lib/state';

// Helper function for linear interpolation
const lerp = (start: number, end: number, amt: number): number => {
  return (1 - amt) * start + amt * end;
};

// AI States
type AIState = 'idle' | 'listening' | 'speaking' | 'thinking';

const getAIState = (
  inputVolume: number,
  outputVolume: number,
  turns: any[]
): AIState => {
  const lastTurn = turns[turns.length - 1];

  if (inputVolume > 0.02) return 'listening';
  if (outputVolume > 0.02) return 'speaking';
  if (lastTurn && !lastTurn.isFinal) return 'thinking';
  return 'idle';
};

const stateColors = {
  idle: { primary: 'rgba(75, 123, 245, 0.6)', secondary: 'rgba(58, 95, 184, 0.3)' },
  listening: { primary: 'rgba(75, 123, 245, 0.9)', secondary: 'rgba(91, 140, 255, 0.5)' },
  speaking: { primary: 'rgba(34, 197, 94, 0.9)', secondary: 'rgba(74, 222, 128, 0.5)' },
  thinking: { primary: 'rgba(251, 146, 60, 0.9)', secondary: 'rgba(253, 186, 116, 0.5)' },
};

const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { volume: outputVolume } = useLiveAPIContext();
  const { inputVolume } = useAudioStore();
  const turns = useLogStore(state => state.turns);
  const animationFrameId = useRef<number | null>(null);
  const currentVolume = useRef(0);
  const rippleEffects = useRef<{ radius: number; opacity: number }[]>([]);
  const waveformData = useRef<number[]>(new Array(32).fill(0));

  // Refs for interactivity
  const cameraOffset = useRef({ x: 0, y: 0 });
  const targetCameraOffset = useRef({ x: 0, y: 0 });
  const cameraZoom = useRef(1);
  const targetCameraZoom = useRef(1);
  const isDragging = useRef(false);
  const lastInteractionPos = useRef({ x: 0, y: 0 });
  const initialPinchDist = useRef(0);
  const zoomAtPinchStart = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio;
      canvas.height =
        canvas.parentElement.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${canvas.parentElement.clientWidth}px`;
      canvas.style.height = `${canvas.parentElement.clientHeight}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- Interaction Handlers ---
    const getPinchDist = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleInteractionStart = (x: number, y: number) => {
      isDragging.current = true;
      lastInteractionPos.current = { x, y };
      canvas.style.cursor = 'grabbing';
    };

    const handleInteractionMove = (x: number, y: number) => {
      if (!isDragging.current) return;
      const dx = (x - lastInteractionPos.current.x) * window.devicePixelRatio;
      const dy = (y - lastInteractionPos.current.y) * window.devicePixelRatio;

      const panLimitX = canvas.width / 3;
      const panLimitY = canvas.height / 3;

      targetCameraOffset.current.x = Math.max(
        -panLimitX,
        Math.min(panLimitX, targetCameraOffset.current.x + dx)
      );
      targetCameraOffset.current.y = Math.max(
        -panLimitY,
        Math.min(panLimitY, targetCameraOffset.current.y + dy)
      );

      lastInteractionPos.current = { x, y };
    };

    const handleInteractionEnd = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };

    const handleMouseDown = (e: MouseEvent) => {
      handleInteractionStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleInteractionMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleInteractionEnd();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomAmount = e.deltaY * -0.001;
      targetCameraZoom.current = Math.max(
        0.5,
        Math.min(2.0, targetCameraZoom.current + zoomAmount)
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        isDragging.current = false; // Stop panning
        initialPinchDist.current = getPinchDist(e);
        zoomAtPinchStart.current = cameraZoom.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2 && initialPinchDist.current > 0) {
        const newPinchDist = getPinchDist(e);
        const zoomFactor = newPinchDist / initialPinchDist.current;
        targetCameraZoom.current = Math.max(
          0.5,
          Math.min(2.0, zoomAtPinchStart.current * zoomFactor)
        );
      }
    };

    const handleTouchEnd = () => {
      handleInteractionEnd();
      initialPinchDist.current = 0;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    const render = (timestamp: number) => {
      animationFrameId.current = requestAnimationFrame(render);

      // Update camera with easing
      cameraOffset.current.x = lerp(
        cameraOffset.current.x,
        targetCameraOffset.current.x,
        0.1
      );
      cameraOffset.current.y = lerp(
        cameraOffset.current.y,
        targetCameraOffset.current.y,
        0.1
      );
      cameraZoom.current = lerp(
        cameraZoom.current,
        targetCameraZoom.current,
        0.1
      );

      const targetVolume = Math.max(inputVolume, outputVolume);
      const prevVolume = currentVolume.current;
      currentVolume.current = lerp(currentVolume.current, targetVolume, 0.08);

      // Determine AI state
      const aiState = getAIState(inputVolume, outputVolume, turns);
      const colors = stateColors[aiState];

      // Update waveform data
      waveformData.current.shift();
      waveformData.current.push(currentVolume.current);

      // Add a new ripple effect on sound spike
      if (currentVolume.current > 0.05 && prevVolume <= 0.05) {
        rippleEffects.current.push({ radius: 0, opacity: 1 });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2 + cameraOffset.current.x;
      const centerY = canvas.height / 2 + cameraOffset.current.y;
      const baseRadius =
        Math.min(canvas.width, canvas.height) * 0.15 * cameraZoom.current;

      // Background Gradient
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, // background stays centered
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width / 2, canvas.height / 2)
      );
      bgGradient.addColorStop(0, '#0a0f21');
      bgGradient.addColorStop(1, '#000004');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- Rainbow Glow Edge (Siri 2025 style) ---
      if (aiState !== 'idle') {
        ctx.save();
        const glowWidth = baseRadius * 0.15;
        const rainbowGradient = ctx.createRadialGradient(
          centerX, centerY, baseRadius - glowWidth,
          centerX, centerY, baseRadius + glowWidth
        );

        if (aiState === 'listening') {
          rainbowGradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
          rainbowGradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.8)');
          rainbowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        } else if (aiState === 'speaking') {
          rainbowGradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
          rainbowGradient.addColorStop(0.5, 'rgba(74, 222, 128, 0.8)');
          rainbowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        } else if (aiState === 'thinking') {
          const pulse = (Math.sin(timestamp * 0.005) + 1) * 0.5;
          rainbowGradient.addColorStop(0, `rgba(251, 146, 60, 0)`);
          rainbowGradient.addColorStop(0.5, `rgba(253, 186, 116, ${0.6 + pulse * 0.3})`);
          rainbowGradient.addColorStop(1, `rgba(251, 146, 60, 0)`);
        }

        ctx.strokeStyle = rainbowGradient;
        ctx.lineWidth = glowWidth * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // --- Ripples ---
      ctx.save();
      rippleEffects.current = rippleEffects.current.filter(
        ripple => ripple.opacity > 0
      );
      rippleEffects.current.forEach(ripple => {
        ripple.radius += (baseRadius * 0.015) / cameraZoom.current;
        ripple.opacity -= 0.01;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + ripple.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = colors.primary.replace(/[\d.]+\)$/, `${ripple.opacity * 0.5})`);
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.stroke();
      });
      ctx.restore();

      // --- Glass Sphere ---
      ctx.save();
      // Drop shadow for depth, with parallax
      const shadowBaseOffset = 10 * window.devicePixelRatio;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 40 * window.devicePixelRatio * cameraZoom.current;
      ctx.shadowOffsetX = shadowBaseOffset - cameraOffset.current.x * 0.1;
      ctx.shadowOffsetY = shadowBaseOffset - cameraOffset.current.y * 0.1;

      // Outer glass casing gradient with parallax highlight
      const highlightX =
        centerX - baseRadius * 0.3 - cameraOffset.current.x * 0.2;
      const highlightY =
        centerY - baseRadius * 0.3 - cameraOffset.current.y * 0.2;
      const glassGradient = ctx.createRadialGradient(
        highlightX,
        highlightY,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius
      );
      glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)');

      ctx.fillStyle = glassGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowColor = 'transparent'; // reset shadow for next elements
      ctx.restore();

      // --- Frosted Edge ---
      ctx.save();
      const frostGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.8,
        centerX,
        centerY,
        baseRadius
      );
      frostGradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
      frostGradient.addColorStop(0.8, 'rgba(200, 230, 255, 0.0)');
      frostGradient.addColorStop(1, 'rgba(200, 230, 255, 0.15)');

      ctx.strokeStyle = frostGradient;
      ctx.lineWidth = baseRadius * 0.2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - ctx.lineWidth / 2, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // --- Waveform Visualization (inside sphere) ---
      if (currentVolume.current > 0.01) {
        ctx.save();
        const waveformRadius = baseRadius * 0.6;
        const barCount = waveformData.current.length;
        const angleStep = (Math.PI * 2) / barCount;

        for (let i = 0; i < barCount; i++) {
          const angle = i * angleStep + timestamp * 0.001;
          const barHeight = waveformData.current[i] * waveformRadius * 0.8;
          const innerRadius = waveformRadius - barHeight;
          const outerRadius = waveformRadius;

          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;

          const barGradient = ctx.createLinearGradient(x1, y1, x2, y2);
          barGradient.addColorStop(0, colors.primary);
          barGradient.addColorStop(1, colors.secondary);

          ctx.strokeStyle = barGradient;
          ctx.lineWidth = 3 * window.devicePixelRatio;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- Inner Core & Glow ---
      const idlePulse = (Math.sin(timestamp * 0.001) + 1) * 0.05;
      const coreScale = 0.3 + Math.max(idlePulse, currentVolume.current * 0.8);
      const coreRadius = baseRadius * coreScale;
      const glowRadius = coreRadius * 2.0;

      // Glow with state colors
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.3,
        centerX,
        centerY,
        glowRadius
      );
      glowGradient.addColorStop(0, colors.primary);
      glowGradient.addColorStop(0.7, colors.secondary);
      glowGradient.addColorStop(1, colors.secondary.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Core with state colors
      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius
      );

      const corePrimary = colors.primary.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/,
        (_, r, g, b) => `rgba(${Math.min(255, parseInt(r) + 40)}, ${Math.min(255, parseInt(g) + 40)}, ${Math.min(255, parseInt(b) + 40)}, 1)`);

      coreGradient.addColorStop(0, corePrimary);
      coreGradient.addColorStop(1, colors.primary);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, 2 * Math.PI);
      ctx.fill();

      // --- Subtle Reflection ---
      ctx.save();
      const reflectionAngle = timestamp * 0.0003;
      const reflectionGradient = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY + baseRadius
      );
      reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      reflectionGradient.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
      reflectionGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
      reflectionGradient.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
      reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = reflectionGradient;
      ctx.globalCompositeOperation = 'overlay';
      ctx.translate(centerX, centerY);
      ctx.rotate(reflectionAngle);
      ctx.translate(-centerX, -centerY);
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    };

    render(0);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [inputVolume, outputVolume, turns]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        className="audio-visualizer"
        style={{ cursor: 'grab' }}
      ></canvas>
      {/* State indicator */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: (() => {
            const aiState = getAIState(inputVolume, outputVolume, turns);
            if (aiState === 'listening') return '#3b82f6';
            if (aiState === 'speaking') return '#22c55e';
            if (aiState === 'thinking') return '#fb923c';
            return '#a1e4f2';
          })(),
          animation: getAIState(inputVolume, outputVolume, turns) !== 'idle' ? 'pulse 1s infinite' : 'none'
        }} />
        {(() => {
          const aiState = getAIState(inputVolume, outputVolume, turns);
          if (aiState === 'listening') return 'Listening';
          if (aiState === 'speaking') return 'Speaking';
          if (aiState === 'thinking') return 'Thinking';
          return 'Ready';
        })()}
      </div>
    </div>
  );
};

export default AudioVisualizer;
