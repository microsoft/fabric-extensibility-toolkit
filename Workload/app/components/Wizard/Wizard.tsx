/**
 * @fileoverview WizardControl Component - Step-by-step interface for guided workflows
 * 
 * Provides a comprehensive wizard interface with visual progress tracking, interactive
 * navigation, and flexible content areas. Designed to follow Fabric Design System
 * guidelines and accessibility standards.
 * 
 * Key Features:
 * - Visual step progress indicators (completed/current/upcoming states)
 * - Interactive navigation between completed and current steps
 * - Responsive design for mobile and desktop viewports
 * - Semantic HTML structure with ARIA attributes
 * - CSS-based styling using design tokens
 * - Flexible content area and optional footer
 * 
 * @see {@link ../../../docs/components/Wizard.md} - Complete documentation with examples
 * @see {@link ./Wizard.scss} - CSS implementation with .wizard-control classes
 */

import './Wizard.scss';

import React from "react";
import { Text, Button } from "@fluentui/react-components";

/**
 * Built-in navigation component for wizard
 * Provides Previous, Next, Complete, and Cancel buttons based on current step
 */
function WizardNavigation({
    canFinish,
    onPrevious,
    onNext,
    onComplete,
    onCancel,
    labels,
    currentStepIndex,
    totalSteps
}: WizardNavigationProps) {
    // Derive states from the registration data
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === totalSteps - 1;
    
    return (
        <div className="wizard-control__navigation">
            {/* Left side - Cancel button */}
            <div className="wizard-control__navigation-left">
                {onCancel && (
                    <Button 
                        appearance="secondary"
                        onClick={onCancel}
                        data-testid="wizard-cancel-btn"
                    >
                        {labels.cancel}
                    </Button>
                )}
            </div>

            {/* Right side - Navigation buttons */}
            <div className="wizard-control__navigation-right">
                <Button 
                    appearance="secondary"
                    onClick={onPrevious}
                    disabled={isFirstStep}
                    data-testid="wizard-previous-btn"
                >
                    {labels.previous}
                </Button>
                
                {isLastStep ? (
                    <Button 
                        appearance="primary"
                        onClick={onComplete}
                        disabled={!canFinish}
                        data-testid="wizard-complete-btn"
                    >
                        {labels.complete}
                    </Button>
                ) : (
                    <Button 
                        appearance="primary"
                        onClick={onNext}
                        disabled={false}
                        data-testid="wizard-next-btn"
                    >
                        {labels.next}
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Represents a single step in the wizard flow with view component
 * @interface WizardStep
 */
export interface WizardStep {
    /** Unique identifier for the step */
    id: string;
    /** Display title for the step */
    title: string;
    /** Optional description text shown below the title */
    description?: string;
    /** View component to render for this step */
    component: React.ComponentType<WizardStepProps>;
    /** Whether this step can be skipped (allows forward navigation without completion) */
    canSkip?: boolean;
    /** Validation function that returns true if step is valid and can proceed */
    validate?: (context: Record<string, any>) => boolean | Promise<boolean>;
    /** Function called when the step is shown */
    onShow?: (context: Record<string, any>) => boolean | Promise<boolean>;
    /** Function called when the step is left */
    onLeave?: (context: Record<string, any>) => boolean | Promise<boolean>;
    /** Reserved for future use - whether the step has been completed */
    completed?: boolean;
}

/**
 * Props passed to each step component
 * @interface WizardStepProps
 */
export interface WizardStepProps {
    /** Current step data */
    step: WizardStep;
    /** Index of current step (0-based) */
    stepIndex: number;
    /** Total number of steps */
    totalSteps: number;
    /** Shared wizard context for passing data between steps */
    wizardContext: Record<string, any>;
    /** Function to update wizard context */
    updateContext: (key: string, value: any) => void;
    /** Function to go to next step (validates current step) */
    onNext: () => Promise<void>;
    /** Function to go to previous step */
    onPrevious: () => void;
    /** Function to go to a specific step */
    onGoToStep: (stepId: string) => void;
    /** Whether this is the first step */
    isFirstStep: boolean;
    /** Whether this is the last step */
    isLastStep: boolean;
}

/**
 * Props for the WizardControl component
 * @interface WizardControlProps
 */
export interface WizardControlProps {
    /** Array of steps to display in the wizard */
    steps: WizardStep[];
    /** Title to display at the top of the wizard */
    title?: string;
    /** ID of the initially active step (defaults to first step if not provided) */
    initialStepId?: string;
    /** Callback fired when step changes */
    onStepChange?: (stepId: string, stepIndex: number) => void;
    /** Callback fired when wizard is completed */
    onComplete?: (context: Record<string, any>) => void;
    /** Callback fired when wizard is cancelled */
    onCancel?: () => void;
    /** Callback to determine if wizard can be finished in current state */
    canFinish?: (currentStepId: string, context: Record<string, any>) => boolean;
    /** Initial wizard context data */
    initialContext?: Record<string, any>;
    /** Whether to show built-in navigation footer */
    showNavigation?: boolean;
    /** Additional CSS classes to apply to the wizard container */
    className?: string;
    /** Whether to allow navigation to any completed step (default: true) */
    allowStepNavigation?: boolean;
    /** Custom labels for navigation buttons */
    navigationLabels?: {
        previous?: string;
        next?: string;
        complete?: string;
        cancel?: string;
    };
}

/**
 * Props for custom navigation components
 * @interface WizardNavigationProps
 */
export interface WizardNavigationProps {
    /** Whether the wizard can be finished/completed in its current state */
    canFinish: boolean;
    /** Function to go to previous step */
    onPrevious: () => void;
    /** Function to go to next step */
    onNext: () => Promise<void>;
    /** Function to complete wizard */
    onComplete: () => void;
    /** Function to cancel wizard */
    onCancel?: () => void;
    /** Navigation button labels */
    labels: {
        previous: string;
        next: string;
        complete: string;
        cancel: string;
    };
    /** Current step index (derived from registration) */
    currentStepIndex: number;
    /** Total number of steps (derived from registration) */
    totalSteps: number;
}

/**
 * WizardControl - A step-by-step interface component for guiding users through multi-stage processes
 * 
 * Features:
 * - Visual progress tracking with step indicators
 * - View registration system with step components
 * - Built-in navigation with validation support
 * - Shared context for data flow between steps
 * - Responsive design for mobile and desktop
 * - Accessibility compliant with semantic HTML
 * - Fabric Design System integration
 * 
 * @example
 * ```tsx
 * const steps = [
 *   { 
 *     id: 'step1', 
 *     title: 'Get Started', 
 *     description: 'Basic setup',
 *     component: SetupStep,
 *     validate: async () => validateSetup()
 *   },
 *   { 
 *     id: 'step2', 
 *     title: 'Configure', 
 *     description: 'Advanced settings',
 *     component: ConfigStep
 *   }
 * ];
 * 
 * <WizardControl
 *   steps={steps}
 *   onComplete={(context) => handleComplete(context)}
 *   showNavigation={true}
 * />
 * ```
 * 
 * @param props - WizardControl configuration props
 * @returns JSX element representing the wizard interface
 */
export function WizardControl({ 
    steps, 
    title,
    initialStepId,
    onStepChange, 
    onComplete,
    onCancel,
    canFinish,
    initialContext = {},
    showNavigation = true,
    className = "",
    allowStepNavigation = true,
    navigationLabels = {}
}: WizardControlProps) {
    // State management
    const [currentStepId, setCurrentStepId] = React.useState(initialStepId || steps[0]?.id);
    const [wizardContext, setWizardContext] = React.useState<Record<string, any>>(initialContext);
    const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set());
    
    // Find the index of the current step for status calculations
    const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
    const currentStep = steps[currentStepIndex];
    
    // Navigation labels with defaults
    const labels = {
        previous: 'Previous',
        next: 'Next', 
        complete: 'Complete',
        cancel: 'Cancel',
        ...navigationLabels
    };

    /**
     * Updates the wizard context with new data
     * @param key - Context key to update
     * @param value - New value for the key
     */
    const updateContext = React.useCallback((key: string, value: any) => {
        setWizardContext(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    // Effect to call onShow when the current step changes
    React.useEffect(() => {
        const callOnShow = async () => {
            if (currentStep?.onShow) {
                try {
                    // Create a wrapper context that includes updateContext for proper state management
                    const contextWithUpdate = {
                        ...wizardContext,
                        updateContext
                    };
                    await currentStep.onShow(contextWithUpdate);
                } catch (error) {
                    console.error('Step onShow failed:', error);
                }
            }
        };
        
        callOnShow();
    }, [currentStepId, currentStep, wizardContext, updateContext]); // Run when step changes

    /**
     * Determines the visual status of a step based on its position relative to the current step
     * @param stepIndex - Zero-based index of the step to check
     * @returns Step status: 'completed' | 'current' | 'upcoming'
     */
    const getStepStatus = (stepIndex: number) => {
        if (completedSteps.has(steps[stepIndex].id) || stepIndex < currentStepIndex) return 'completed';
        if (stepIndex === currentStepIndex) return 'current';
        return 'upcoming';
    };

    /**
     * Validates the current step if validation function is provided
     * @returns Promise<boolean> - true if step is valid
     */
    const validateCurrentStep = async (): Promise<boolean> => {
        if (!currentStep?.validate) return true;
        
        try {
            const isValid = await currentStep.validate(wizardContext);
            return isValid;
        } catch (error) {
            console.error('Step validation failed:', error);
            return false;
        }
    };

    const onLeave = async (): Promise<void> => {
        if (!currentStep?.onLeave) return;
        try {
           await currentStep.onLeave(wizardContext);
        } catch (error) {
            console.error('Step onLeave failed:', error);
        }
    };

    /**
     * Navigates to the next step after validation
     */
    const handleNext = async () => {
        const isValid = await validateCurrentStep();
        if (!isValid) return;

        await onLeave();
        // Mark current step as completed
        setCompletedSteps(prev => new Set([...prev, currentStepId]));

        if (currentStepIndex < steps.length - 1) {
            const nextStep = steps[currentStepIndex + 1];
            setCurrentStepId(nextStep.id);
            onStepChange?.(nextStep.id, currentStepIndex + 1);
        } else {
            // Last step - complete wizard
            onComplete?.(wizardContext);
        }
    };

    /**
     * Navigates to the previous step
     */
    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            const previousStep = steps[currentStepIndex - 1];
            setCurrentStepId(previousStep.id);
            onStepChange?.(previousStep.id, currentStepIndex - 1);
        }
    };

    /**
     * Navigates to a specific step
     * @param stepId - ID of the step to navigate to
     */
    const goToStep = async (stepId: string) => {
        const targetIndex = steps.findIndex(s => s.id === stepId);
        if (targetIndex === -1) return;

        // Only allow navigation to completed steps, current step, or if allowStepNavigation is false
        if (!allowStepNavigation) return;
        
        const canNavigate = targetIndex <= currentStepIndex || completedSteps.has(stepId);
        if (!canNavigate) return;

        await onLeave(); // Call onLeave for current step
        setCurrentStepId(stepId);
        onStepChange?.(stepId, targetIndex);
    };

    /**
     * Handles step click navigation
     * Only allows navigation to completed steps or the current step
     * @param step - The step that was clicked
     * @param stepIndex - Zero-based index of the clicked step
     */
    const handleStepClick = async (step: WizardStep, stepIndex: number) => {
        const canNavigate = allowStepNavigation && (
            stepIndex <= currentStepIndex || completedSteps.has(step.id)
        );
        
        if (canNavigate) {
            await goToStep(step.id);
        }
    };

    /**
     * Completes the wizard
     */
    const handleComplete = () => {
        onComplete?.(wizardContext);
    };

    /**
     * Cancels the wizard
     */
    const handleCancel = () => {
        onCancel?.();
    };

    // Step props for the current step component
    const stepProps: WizardStepProps = {
        step: currentStep,
        stepIndex: currentStepIndex,
        totalSteps: steps.length,
        wizardContext,
        updateContext,
        onNext: handleNext,
        onPrevious: handlePrevious,
        onGoToStep: goToStep,
        isFirstStep: currentStepIndex === 0,
        isLastStep: currentStepIndex === steps.length - 1
    };

    // Navigation props
    const navigationProps: WizardNavigationProps = {
        currentStepIndex,
        totalSteps: steps.length,
        canFinish: canFinish ? canFinish(currentStepId, wizardContext) : true,
        onPrevious: handlePrevious,
        onNext: handleNext,
        onComplete: handleComplete,
        onCancel: onCancel ? handleCancel : undefined,
        labels
    };

    return (
        <div className={`wizard-control ${className}`.trim()}>
            {/* Title Header */}
            {title && (
                <div className="wizard-control__header">
                    <Text size={500} weight="semibold" className="wizard-control__title">
                        {title}
                    </Text>
                </div>
            )}

            {/* Main Content Area - Split layout with steps panel and content */}
            <div className="wizard-control__main">
                {/* Left Panel - Steps Navigation */}
                <div className="wizard-control__steps-panel">
                    <div>
                        {steps.map((step, index) => {
                            const status = getStepStatus(index);
                            const isClickable = allowStepNavigation && (
                                index <= currentStepIndex || completedSteps.has(step.id)
                            );

                            return (
                                <div key={step.id}>
                                    {/* Individual Step Container */}
                                    <div 
                                        className={`wizard-control__step ${isClickable ? 'wizard-control__step--clickable' : 'wizard-control__step--disabled'}`}
                                        onClick={() => handleStepClick(step, index)}
                                        role="button"
                                        tabIndex={isClickable ? 0 : -1}
                                        aria-current={status === 'current' ? 'step' : undefined}
                                        aria-disabled={!isClickable}
                                    >
                                        {/* Step Circle Indicator */}
                                        <div className={`wizard-control__step-circle wizard-control__step-circle--${status}`}>
                                            {status === 'completed' ? (
                                                // Checkmark for completed steps
                                                <div 
                                                    className="wizard-control__step-checkmark" 
                                                    aria-label="Completed"
                                                />
                                            ) : (
                                                // Step number for current and upcoming steps
                                                <Text 
                                                    size={200} 
                                                    weight="semibold" 
                                                    className={`wizard-control__step-number wizard-control__step-number--${status}`}
                                                    aria-label={`Step ${index + 1}`}
                                                >
                                                    {index + 1}
                                                </Text>
                                            )}
                                        </div>

                                        {/* Step Text Content */}
                                        <div className="wizard-control__step-content">
                                            <Text 
                                                className={`wizard-control__step-title ${status === 'current' ? 'wizard-control__step-title--current' : 'wizard-control__step-title--normal'}`}
                                                as="h3"
                                            >
                                                {step.title}
                                            </Text>
                                            {step.description && (
                                                <Text 
                                                    size={200} 
                                                    className="wizard-control__step-description"
                                                >
                                                    {step.description}
                                                </Text>
                                            )}
                                        </div>
                                    </div>

                                    {/* Connecting Line Between Steps */}
                                    {index < steps.length - 1 && (
                                        <div 
                                            className={`wizard-control__step-connector ${
                                                index < currentStepIndex || completedSteps.has(step.id) 
                                                    ? 'wizard-control__step-connector--completed' 
                                                    : 'wizard-control__step-connector--upcoming'
                                            }`} 
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel - Dynamic Content Area */}
                <div className="wizard-control__content-panel" role="main">
                    {currentStep && (
                        <currentStep.component {...stepProps} />
                    )}
                </div>
            </div>

            {/* Navigation Footer */}
            {showNavigation && (
                <div className="wizard-control__footer" role="contentinfo">
                    <WizardNavigation {...navigationProps} />
                </div>
            )}
        </div>
    );
}
