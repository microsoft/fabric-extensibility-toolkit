/**
 * @fileoverview Dialog Component - Simple dialog interface with wizard-like styling
 * 
 * This module exports the DialogControl component for creating simple dialogs
 * that maintain the same visual style as the Wizard component but without
 * step navigation.
 * 
 * @example
 * ```tsx
 * import { DialogControl } from '../components/Dialog';
 * 
 * function MyDialog() {
 *   return (
 *     <DialogControl
 *       title="Confirm Action"
 *       onConfirm={handleConfirm}
 *       onCancel={handleCancel}
 *       confirmLabel="Confirm"
 *       cancelLabel="Cancel"
 *       isConfirmDisabled={!isValid}
 *     >
 *       <p>Dialog content goes here</p>
 *     </DialogControl>
 *   );
 * }
 * ```
 * 
 * @see {@link ./DialogControl.tsx} - Main component implementation
 * @see {@link ./Dialog.scss} - Component styles
 */

// Export the main component and types
export { DialogControl } from './DialogControl';
export type { DialogControlProps } from './DialogControl';
