import React, { useState } from "react";
import { Stack, Text, PrimaryButton, DefaultButton, MessageBar, MessageBarType } from "@fluentui/react";
import { SandboxRelaxationService, FabricSandboxRelaxationScopes } from "../services/SandboxRelaxationService";
import "./SandboxConsentDialog.css";

interface SandboxConsentDialogProps {
  isVisible: boolean;
  onConsentGranted: () => void;
  onConsentDenied: () => void;
  requiredScopes: (keyof FabricSandboxRelaxationScopes)[];
}

// Official Fabric scope descriptions as per design document
const OFFICIAL_SCOPE_DESCRIPTIONS: Record<keyof FabricSandboxRelaxationScopes, string> = {
  'Fabric.Extend': 'Base scope for iframe relaxation (required for all enhanced features)',
  'DOWNLOAD': 'Allow downloading files from embedded content (protects against drive-by download attacks)',
  'POP-UP': 'Allow opening new windows or popups (protects against clickjacking and phishing)',
  'FORMS': 'Allow form submissions and interactive features (protects against formjacking attacks)'
};

export function SandboxConsentDialog({ 
  isVisible, 
  onConsentGranted, 
  onConsentDenied, 
  requiredScopes
}: SandboxConsentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrantConsent = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const service = SandboxRelaxationService.getInstance();
      const success = await service.requestConsent(requiredScopes);
      
      if (success) {
        onConsentGranted();
      } else {
        setError('Failed to grant consent. Please try again or contact your administrator.');
      }
    } catch (err) {
      setError('An error occurred while processing consent. Please try again.');
      console.error('Official Fabric consent error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="sandbox-consent-overlay">
      <div className="sandbox-consent-dialog">
        <Stack tokens={{ childrenGap: 20 }}>
          <Stack.Item>
            <Text variant="xLarge" block>
              🔒 Security Permissions Required
            </Text>
            <Text variant="medium" block style={{ marginTop: 8 }}>
              This application requires additional permissions to function properly.
              These permissions follow the official Microsoft Fabric security model.
            </Text>
          </Stack.Item>

          <Stack.Item>
            <Text variant="mediumPlus" block style={{ marginBottom: 12 }}>
              Required Permissions (Official Fabric Scopes):
            </Text>
            <Stack tokens={{ childrenGap: 8 }}>
              {requiredScopes.map((scope) => (
                <Stack key={scope} horizontal tokens={{ childrenGap: 8 }} verticalAlign="start">
                  <Text style={{ fontWeight: 600, minWidth: 140 }}>
                    {scope}:
                  </Text>
                  <Text>
                    {OFFICIAL_SCOPE_DESCRIPTIONS[scope]}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Stack.Item>

          <Stack.Item>
            <MessageBar messageBarType={MessageBarType.warning}>
              <Text>
                <strong>Official Fabric Security:</strong> These permissions are managed by Microsoft Fabric's 
                built-in security system. Granting these permissions enables enhanced functionality while 
                maintaining protection against malicious content.
              </Text>
            </MessageBar>
          </Stack.Item>

          {error && (
            <Stack.Item>
              <MessageBar messageBarType={MessageBarType.error}>
                {error}
              </MessageBar>
            </Stack.Item>
          )}

          <Stack.Item>
            <Stack horizontal tokens={{ childrenGap: 12 }} horizontalAlign="end">
              <DefaultButton 
                text="Cancel" 
                onClick={onConsentDenied}
                disabled={isProcessing}
              />
              <PrimaryButton 
                text={isProcessing ? "Processing..." : "Grant Permissions"}
                onClick={handleGrantConsent}
                disabled={isProcessing}
              />
            </Stack>
          </Stack.Item>
        </Stack>
      </div>
    </div>
  );
}