/**
 * Sandbox Relaxation Service - Official Fabric Implementation
 * Based on Microsoft Fabric LWW Design Document
 * 
 * Handles workload-level iframe sandbox relaxation with MSAL consent flow
 */

// Official Fabric sandbox relaxation scopes as per design document
export interface FabricSandboxRelaxationScopes {
  'Fabric.Extend': boolean;  // Base scope for iframe relaxation
  'DOWNLOAD': boolean;       // Allow downloads
  'POP-UP': boolean;        // Allow popups  
  'FORMS': boolean;         // Allow forms
}

export interface SandboxRelaxationConfig {
  mode: 'mandatory' | 'optional';
  // Official scopes from Fabric design document
  requiredScopes: (keyof FabricSandboxRelaxationScopes)[];
}

export interface IframeSandboxState {
  sandboxRelaxed: boolean;
  grantedScopes: Partial<FabricSandboxRelaxationScopes>;
  sandboxAttributes: string;
  permissionsPolicy: string;
}

export class SandboxRelaxationService {
  private static instance: SandboxRelaxationService;
  private consentedScopes: Partial<FabricSandboxRelaxationScopes> = {};
  private isInitialized = false;

  public static getInstance(): SandboxRelaxationService {
    if (!SandboxRelaxationService.instance) {
      SandboxRelaxationService.instance = new SandboxRelaxationService();
    }
    return SandboxRelaxationService.instance;
  }

  /**
   * Initialize the service with current consent state
   * In a real implementation, this would integrate with MSAL service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // In the official implementation, this would:
    // 1. Call ExtensionFrontendMsalService
    // 2. Check for Fabric.Extend + additional scopes in token
    // 3. Update NgRx state with sandboxRelaxed flag
    
    // For demo purposes, assume scopes are granted if EnableSandboxRelaxation=true
    this.consentedScopes = {
      'Fabric.Extend': true,
      'DOWNLOAD': true,
      'POP-UP': true,
      'FORMS': true
    };

    this.isInitialized = true;
  }

  /**
   * Request consent for official Fabric sandbox relaxation scopes
   * In production, this integrates with MSAL for AAD token acquisition
   */
  public async requestConsent(scopes: (keyof FabricSandboxRelaxationScopes)[]): Promise<boolean> {
    try {
      // Official implementation would:
      // 1. Call ExtensionFrontendMsalService.acquireToken()
      // 2. Combine Fabric.Extend + relaxed scopes from manifest
      // 3. Show consent prompt if missing (first time or previously declined)
      // 4. Update NgRx store with sandboxRelaxed flag
      // 5. Dispatch addIframe action with new sandbox attributes

      console.log('Requesting official Fabric sandbox relaxation consent for scopes:', scopes);
      
      // Simulate MSAL consent approval
      scopes.forEach(scope => {
        this.consentedScopes[scope] = true;
      });

      return true;
    } catch (error) {
      console.error('Failed to request Fabric sandbox relaxation consent:', error);
      return false;
    }
  }

  /**
   * Check if specific official Fabric scopes have been consented to
   */
  public hasConsent(scopes: (keyof FabricSandboxRelaxationScopes)[]): boolean {
    return scopes.every(scope => this.consentedScopes[scope] === true);
  }

  /**
   * Get current iframe sandbox state based on official Fabric consent
   * Follows the mandatory approach from design document
   */
  public getIframeSandboxState(config: SandboxRelaxationConfig): IframeSandboxState {
    const hasRequiredConsent = this.hasConsent(config.requiredScopes);

    if (config.mode === 'mandatory' && !hasRequiredConsent) {
      // Mandatory mode: iframe will NOT open without consent (official approach)
      return {
        sandboxRelaxed: false,
        grantedScopes: {},
        sandboxAttributes: '', // No iframe created
        permissionsPolicy: ''
      };
    }

    // Build official Fabric sandbox attributes based on consented scopes
    const sandboxAttributes = this.buildOfficialSandboxAttributes();
    const permissionsPolicy = this.buildOfficialPermissionsPolicy();

    return {
      sandboxRelaxed: hasRequiredConsent,
      grantedScopes: this.consentedScopes,
      sandboxAttributes,
      permissionsPolicy
    };
  }

  /**
   * Build sandbox attributes based on official Fabric scopes
   * As per design document: "allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
   */
  private buildOfficialSandboxAttributes(): string {
    const attributes = ['allow-same-origin', 'allow-scripts']; // Base Fabric attributes

    if (this.consentedScopes['FORMS']) {
      attributes.push('allow-forms');
    }

    if (this.consentedScopes['POP-UP']) {
      attributes.push('allow-popups');
    }

    if (this.consentedScopes['DOWNLOAD']) {
      attributes.push('allow-downloads');
    }

    return attributes.join(' ');
  }

  /**
   * Build permissions policy for official Fabric implementation
   */
  private buildOfficialPermissionsPolicy(): string {
    const policies: string[] = [];

    // Standard policies for Fabric iframe relaxation
    if (this.consentedScopes['DOWNLOAD']) {
      policies.push("downloads 'self'");
    }

    if (this.consentedScopes['POP-UP']) {
      policies.push("popups 'self'");
    }

    return policies.join('; ');
  }

  /**
   * Reset consent state (for testing or admin override)
   */
  public resetConsent(): void {
    this.consentedScopes = {};
  }

  /**
   * Get current consent state for debugging
   */
  public getConsentState(): Partial<FabricSandboxRelaxationScopes> {
    return { ...this.consentedScopes };
  }
}

// Official Fabric configuration for Excel embeds (mandatory approach)
export const FABRIC_EXCEL_EMBED_CONFIG: SandboxRelaxationConfig = {
  mode: 'mandatory', // Official approach: iframe won't open without consent
  requiredScopes: [
    'Fabric.Extend',  // Base scope required
    'FORMS',          // Essential for Excel functionality  
    'DOWNLOAD'        // Required for Excel downloads
  ]
};