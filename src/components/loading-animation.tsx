'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';

interface LoadingStep {
    message: string;
    icon: React.ReactNode;
}

interface LoadingAnimationProps {
    isDone?: boolean;
    title: string;
    steps: LoadingStep[];
}


export function LoadingAnimation({ isDone = false, title, steps }: LoadingAnimationProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isDone) {
            setProgress(100);
            return;
        }

        const stepDuration = Math.max(2500, 10000 / steps.length);

        const interval = setInterval(() => {
            setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, stepDuration);
        return () => clearInterval(interval);
    }, [isDone, steps.length]);

    useEffect(() => {
      const targetProgress = isDone ? 100 : Math.min(((currentStep + 1) / steps.length) * 100, 95);
      
      const timer = setTimeout(() => {
        setProgress(targetProgress);
      }, 100)

      return () => clearTimeout(timer);

    }, [currentStep, isDone, steps.length])


    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
                duration: 0.5,
                ease: 'easeOut'
            }
        },
        exit: {
            opacity: 0,
            y: 50,
            transition: {
                duration: 0.5,
                ease: 'easeIn',
                delay: 0.8, // 0.8 second pause before transition
            }
        }
    };
    
    const stepVariants = {
        initial: { opacity: 0.5, y: 10, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        completed: { opacity: 0.5, y: 0, scale: 0.95 },
    };

    return (
        <AnimatePresence>
            <motion.div
                key="loading"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight animated-gradient-text">{title}</h2>
                    <p className="mt-2 text-muted-foreground">AI-powered brilliance, right where you need it.</p>
                </div>

                <div className="w-full max-w-md space-y-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className="flex items-center gap-4 p-4 rounded-lg border border-primary/20 bg-card/50"
                            variants={stepVariants}
                            initial="initial"
                            animate={currentStep === index ? "animate" : (currentStep > index ? "completed" : "initial")}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                           <motion.div 
                             className="text-primary"
                             animate={{ rotate: currentStep === index ? [0, 15, -15, 0] : 0 }}
                             transition={{ duration: 0.5, repeat: currentStep === index ? Infinity : 0}}
                           >
                            {step.icon}
                           </motion.div>
                            <span className="font-medium text-foreground/80">{step.message}</span>
                        </motion.div>
                    ))}
                </div>

                 <div className="w-full max-w-md mt-8">
                    <Progress value={progress} className="h-2 [&>div]:bg-primary" />
                    <p className="text-sm text-muted-foreground text-right mt-2">{Math.round(progress)}% Complete</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
