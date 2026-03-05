/**
 * @fileoverview Wizard Component - Step-by-step interface for multi-stage processes
 * 
 * This module exports the WizardControl component and related types for creating
 * guided workflows and onboarding experiences in Fabric workloads.
 * 
 * @example
 * ```tsx
 * import { WizardControl, WizardStep } from '../components/Wizard';
 * 
 * const steps: WizardStep[] = [
 *   { id: 'setup', title: 'Setup', description: 'Configure basic settings' },
 *   { id: 'review', title: 'Review', description: 'Confirm your choices' }
 * ];
 * 
 * function MyWizard() {
 *   const [currentStep, setCurrentStep] = useState('setup');
 *   
 *   return (
 *     <WizardControl
 *       steps={steps}
 *       currentStepId={currentStep}
 *       onStepChange={setCurrentStep}
 *     >
 *       {stepContent}
 *     </WizardControl>
 *   );
 * }
 * ```
 * 
 * @see {@link ./Wizard.tsx} - Main component implementation
 * @see {@link ../../../docs/components/Wizard.md} - Complete documentation
 * 
 */

// Export the main component and types
export { WizardControl } from './Wizard';
export type { 
  WizardStep, 
  WizardControlProps, 
  WizardStepProps, 
  WizardNavigationProps 
} from './Wizard';

/**
 * Type alias for backward compatibility
 * @deprecated Use WizardControl instead
 */
export { WizardControl as Wizard } from './Wizard';