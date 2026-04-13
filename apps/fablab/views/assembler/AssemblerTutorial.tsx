import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AssemblerTutorialProps {
  isPinned: boolean;
  onPin: () => void;
  onComplete?: () => void;
  isActive: boolean;
  steps: TutorialStep[];
}

export type TutorialStep = {
  id: string;
  type: 'mascot' | 'preset' | 'module';
  title: string;
  description: string;
  itemTitle?: string;
  itemDescription?: string;
};

const AssemblerTutorial: React.FC<AssemblerTutorialProps> = ({
  isPinned,
  onPin,
  onComplete,
  isActive,
  steps,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<TutorialStep[]>([]);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [movingStep, setMovingStep] = useState<TutorialStep | null>(null);
  const [moveRect, setMoveRect] = useState<{
    from: { top: number; left: number; width: number; height: number };
    to: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [movePhase, setMovePhase] = useState<'from' | 'to' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const placeholderRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const step = steps[stepIndex];
  const isMascotOnly = step?.type === 'mascot';
  const presetSteps = useMemo(() => steps.filter((item) => item.type === 'preset'), [steps]);
  const moduleSteps = useMemo(() => steps.filter((item) => item.type === 'module'), [steps]);

  if (!step) {
    return null;
  }

  useEffect(() => {
    if (!isActive) return;
    setStepIndex(0);
    setIsAnimating(false);
    setIsLeaving(false);
    setCompletedSteps([]);
    setLastCompletedId(null);
    setMovingStep(null);
    setMoveRect(null);
    setMovePhase(null);
  }, [isActive]);

  useEffect(() => {
    if (!moveRect) return;
    const frame = window.requestAnimationFrame(() => setMovePhase('to'));
    return () => window.cancelAnimationFrame(frame);
  }, [moveRect]);

  const captureMoveRect = (targetId: string) => {
    if (!containerRef.current || !activeCardRef.current) return null;
    const placeholder = placeholderRefs.current[targetId];
    if (!placeholder) return null;
    const containerBox = containerRef.current.getBoundingClientRect();
    const fromBox = activeCardRef.current.getBoundingClientRect();
    const toBox = placeholder.getBoundingClientRect();
    return {
      from: {
        top: fromBox.top - containerBox.top,
        left: fromBox.left - containerBox.left,
        width: fromBox.width,
        height: fromBox.height,
      },
      to: {
        top: toBox.top - containerBox.top,
        left: toBox.left - containerBox.left,
        width: toBox.width,
        height: toBox.height,
      },
    };
  };

  const finishStep = (currentStep: TutorialStep, isLastStep: boolean) => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    setLastCompletedId(currentStep.id);
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    if (isLastStep) {
      onComplete?.();
    }
  };

  const handleNextStep = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isAnimating || !step) {
      return;
    }

    const isLastStep = stepIndex >= steps.length - 1;
    if (step.type === 'mascot') {
      if (isLastStep) {
        onComplete?.();
        return;
      }
      setIsAnimating(true);
      setIsLeaving(true);
      window.setTimeout(() => {
        setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
        setIsLeaving(false);
        setIsAnimating(false);
      }, 260);
      return;
    }

    const nextMoveRect = captureMoveRect(step.id);
    if (!nextMoveRect) {
      finishStep(step, isLastStep);
      return;
    }

    setIsAnimating(true);
    setIsLeaving(true);
    setMovingStep(step);
    setMoveRect(nextMoveRect);
    setMovePhase('from');

    window.setTimeout(() => {
      finishStep(step, isLastStep);
      setMovingStep(null);
      setMoveRect(null);
      setMovePhase(null);
      setIsLeaving(false);
      setIsAnimating(false);
    }, 520);
  };

  const renderSlotItem = (item: TutorialStep) => {
    const completed = completedSteps.find((entry) => entry.id === item.id);
    const isPlaceholder = !completed;

    if (completed) {
      return (
        <div
          key={item.id}
          className={`assembler-back-step-card ${item.type} pinned ${
            item.id === lastCompletedId ? 'is-new' : ''
          }`}
        >
          <span className="assembler-back-step-tag">{item.type === 'preset' ? 'Preset' : 'Módulo'}</span>
          <h5>{item.itemTitle ?? item.title}</h5>
        </div>
      );
    }

    if (isPlaceholder) {
      return (
        <div
          key={item.id}
          className={`assembler-back-step-placeholder ${item.type}`}
          ref={(node) => {
            placeholderRefs.current[item.id] = node;
          }}
        />
      );
    }

    return null;
  };

  return (
    <div
      className={`assembler-back-tutorial ${isPinned ? 'pinned' : ''} ${
        isMascotOnly ? 'mascot-only' : ''
      }`}
      onClick={onPin}
      role="presentation"
      ref={containerRef}
    >
      <div className="assembler-back-layout">
        <div className="assembler-back-layout-slot preset">
          <h4>Configuraciones predefinidas</h4>
          <div className="assembler-back-layout-card assembler-presets-list">
            {presetSteps.map(renderSlotItem)}
          </div>
        </div>

        <div className="assembler-back-layout-slot modules">
          <h4>Módulos personalizados</h4>
          <div className="assembler-back-layout-card assembler-modules-list">
            {moduleSteps.map(renderSlotItem)}
          </div>
        </div>
      </div>

      {moveRect && movingStep && (
        <div
          className={`assembler-back-step-moving ${movingStep.type} ${
            movePhase === 'to' ? 'to' : ''
          }`}
          style={{
            top: movePhase === 'to' ? moveRect.to.top : moveRect.from.top,
            left: movePhase === 'to' ? moveRect.to.left : moveRect.from.left,
            width: movePhase === 'to' ? moveRect.to.width : moveRect.from.width,
            height: movePhase === 'to' ? moveRect.to.height : moveRect.from.height,
          }}
        >
          <span className="assembler-back-step-tag">{movingStep.type === 'preset' ? 'Preset' : 'Módulo'}</span>
          <h5>{movingStep.itemTitle ?? movingStep.title}</h5>
        </div>
      )}

      <div className={`assembler-back-active-step ${isLeaving ? 'step-leave' : 'step-enter'}`}>
        <div className="assembler-back-tutorial-header">
          <button
            type="button"
            className="assembler-back-mascot"
            onClick={handleNextStep}
            aria-label="Avanzar tutorial"
          >
            <svg className="assembler-mascot-svg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-pulse-slow opacity-50">
                <line x1="50" y1="100" x2="150" y2="100" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="250" y1="100" x2="350" y2="100" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="100" y1="50" x2="100" y2="150" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="300" y1="50" x2="300" y2="150" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
              </g>

              <circle cx="200" cy="200" r="60" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="3" className="animate-pulse" />
              <circle cx="200" cy="200" r="40" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />

              <path d="M200 170 Q180 175, 180 190 T200 210 Q220 205, 220 190 T200 170" fill="white" className="animate-pulse-slow" />
              <circle cx="190" cy="190" r="3" fill="white" className="animate-ping-slow" />
              <circle cx="210" cy="190" r="3" fill="white" className="animate-ping-slow animation-delay-1000" />

              <g className="animate-spin-slow origin-center" style={{ transformOrigin: '200px 200px' }}>
                <circle cx="200" cy="120" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                <circle cx="280" cy="200" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                <circle cx="200" cy="280" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                <circle cx="120" cy="200" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
              </g>

              <g className="opacity-60">
                <line x1="200" y1="140" x2="200" y2="120" stroke="white" strokeWidth="2" />
                <line x1="240" y1="200" x2="280" y2="200" stroke="white" strokeWidth="2" />
                <line x1="200" y1="260" x2="200" y2="280" stroke="white" strokeWidth="2" />
                <line x1="160" y1="200" x2="120" y2="200" stroke="white" strokeWidth="2" />
              </g>

              <circle cx="150" cy="150" r="3" fill="white" className="animate-bounce-slow" />
              <circle cx="250" cy="150" r="3" fill="white" className="animate-bounce-slow animation-delay-2000" />
              <circle cx="250" cy="250" r="3" fill="white" className="animate-bounce-slow animation-delay-3000" />
              <circle cx="150" cy="250" r="3" fill="white" className="animate-bounce-slow animation-delay-1000" />

              <rect x="50" y="50" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse" />
              <rect x="330" y="50" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse animation-delay-1000" />
              <rect x="330" y="330" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse animation-delay-2000" />
              <rect x="50" y="330" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse animation-delay-3000" />
            </svg>
          </button>
          <div className="assembler-back-tutorial-intro">
            <h3>{step.title}</h3>
            <div className="assembler-mascot-speech">
              <p key={step.id} className="assembler-mascot-speech-text">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {step.type === 'preset' && (
          <div ref={activeCardRef} className="assembler-back-step-card preset active">
            <span className="assembler-back-step-tag">{step.title}</span>
            <h4>{step.itemTitle}</h4>
            <p>{step.itemDescription}</p>
          </div>
        )}

        {step.type === 'module' && (
          <div ref={activeCardRef} className="assembler-back-step-card module active">
            <span className="assembler-back-step-tag">Módulo</span>
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AssemblerTutorial;
