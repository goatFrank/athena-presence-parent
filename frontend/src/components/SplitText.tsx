import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// @ts-ignore - GSAP SplitText is a bonus plugin.
import { SplitText as GSAPSplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines' | 'chars,words' | 'chars,words,lines';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify' | 'initial' | 'inherit';
  tag?: string;
  style?: React.CSSProperties;
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  style: styleProp,
  onLetterAnimationComplete
}) => {
  const ref = useRef<any>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    let isMounted = true;
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        if (isMounted) setFontsLoaded(true);
      }).catch(err => {
        console.error('Font loading failed:', err);
        if (isMounted) setFontsLoaded(true); // Fallback to proceed anyway
      });
    }
    return () => { isMounted = false; };
  }, []);

  useLayoutEffect(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    // Prevent re-animation if already completed
    if (animationCompletedRef.current) return;
    
    const el = ref.current;
    let ctx = gsap.context(() => {
      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch (error) {
          console.warn('GSAP revert failed:', error);
        }
        el._rbsplitInstance = null;
      }

      let targets: any;
      const assignTargets = (self: any) => {
        if (splitType.includes('chars') && self.chars.length) {
          targets = self.chars;
        } else if (splitType.includes('words') && self.words.length) {
          targets = self.words;
        } else if (splitType.includes('lines') && self.lines.length) {
          targets = self.lines;
        } else {
          targets = self.chars || self.words || self.lines;
        }
      };

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self: any) => {
          assignTargets(self);
          
          const isHeroH1 = text.includes('Sincronizza il tuo team');
          
          if (isHeroH1 && self.chars) {
            // Build a string from the actual char elements to find correct indices
            const charTexts = self.chars.map((c: HTMLElement) => c.textContent || '');
            const reconstructed = charTexts.join('');
            
            // Find "ovunque" in the reconstructed char list
            const targetStart = reconstructed.indexOf('ovunque');
            
            if (targetStart !== -1) {
              const targetEnd = reconstructed.lastIndexOf('i') + 1;
              const phraseChars = self.chars.slice(targetStart, targetEnd);
              const phraseLength = phraseChars.length;
              
              // Interpolate smoothly between two colors across the phrase
              // Using the page's indigo → violet palette for cohesion
              const startColor = { r: 79, g: 70, b: 229 };  // #4f46e5 (indigo-600)
              const endColor   = { r: 139, g: 92, b: 246 };  // #8b5cf6 (violet-500)
              
              phraseChars.forEach((char: HTMLElement, i: number) => {
                const t = phraseLength > 1 ? i / (phraseLength - 1) : 0;
                const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
                const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
                const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);
                
                gsap.set(char, {
                  color: `rgb(${r}, ${g}, ${b})`,
                  display: 'inline-block'
                });
              });
            }
          }

          const isGradient = className.includes('text-transparent');
          if (isGradient && !isHeroH1) {
            const allElements = [
              ...(self.lines || []),
              ...(self.words || []),
              ...(self.chars || [])
            ];
            
            if (allElements.length > 0) {
              gsap.set(allElements, {
                background: 'inherit',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                overflow: 'visible'
              });
            }
          }

          gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: el,
                start: "top 95%", // More reliable than complex margin math for Hero
                once: true,
                fastScrollEnd: true
              },
              onComplete: () => {
                animationCompletedRef.current = true;
                onCompleteRef.current?.();
              },
              willChange: 'transform, opacity',
              force3D: true
            }
          );
        }
      });

      el._rbsplitInstance = splitInstance;
    }, ref);

    return () => {
      ctx.revert();
      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch (error) {
          console.warn('GSAP revert failed on cleanup:', error);
        }
        el._rbsplitInstance = null;
      }
    };
  }, [
    text,
    delay,
    duration,
    ease,
    splitType,
    JSON.stringify(from),
    JSON.stringify(to),
    threshold,
    rootMargin,
    fontsLoaded
  ]);

  const style: React.CSSProperties = {
    textAlign,
    textAlignLast: textAlign,
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
    overflow: 'visible',
    ...styleProp
  };
  const classes = `split-parent ${className}`;
  const Tag = (tag || 'p') as any;

  return (
    <Tag ref={ref} style={style} className={classes}>
      {text}
    </Tag>
  );
};

export default SplitText;
