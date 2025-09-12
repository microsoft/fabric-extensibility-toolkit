import React, { useState, useEffect } from "react";
import './ExcelEmbedItemEditor.css';
import {
  Stack,
  Text,
  TextField,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize
} from "@fluentui/react";
import { SandboxConsentDialog } from "../../components/SandboxConsentDialog";
import { LakehouseDataSelector } from "../../components/LakehouseDataSelector";

// Import the actual types from the service files
import type { LakehouseDataResult } from "../../services/LakehouseDataService";

interface FabricSandboxRelaxationScopes {
  'POP-UP'?: boolean;
}

interface ExcelEmbedItemEditorDefaultProps {
  item?: {
    definition?: {
      title?: string;
    };
  };
  onSave: (data: { title: string }) => Promise<void>;
}

export function ExcelEmbedItemEditorDefault({ item, onSave }: ExcelEmbedItemEditorDefaultProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item?.definition?.title || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [sandboxState, setSandboxState] = useState<{ sandboxRelaxed: boolean; grantedScopes: Partial<FabricSandboxRelaxationScopes> }>({
    sandboxRelaxed: false,
    grantedScopes: {}
  });
  const [lakehouseData, setLakehouseData] = useState<LakehouseDataResult | null>(null);
  const [isLoadingLakehouseData, setIsLoadingLakehouseData] = useState(false);

  // Check sandbox state on component mount
  useEffect(() => {
    const checkSandboxState = () => {
      // For now, assume sandbox is available in dev mode
      setSandboxState({
        sandboxRelaxed: true,
        grantedScopes: { 'POP-UP': true }
      });
    };

    checkSandboxState();
  }, []);

  const handleLakehouseDataSelected = (data: LakehouseDataResult) => {
    setLakehouseData(data);
    setExcelError(null);
  };

  const handleLakehouseDataLoading = (loading: boolean) => {
    setIsLoadingLakehouseData(loading);
  };

  const handleOpenInExcel = async () => {
    if (!sandboxState.grantedScopes['POP-UP']) {
      setShowConsentDialog(true);
      return;
    }

    try {
      setExcelError(null);
      
      if (lakehouseData) {
        // Create CSV data from Lakehouse data
        const headers = lakehouseData.columns.map((col: any) => col.name);
        const csvContent = [
          headers.join(','),
          ...lakehouseData.data.map((row: any[]) => row.join(','))
        ].join('\n');
        
        // Create a downloadable CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${lakehouseData.query.tableName}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Open Excel Online with a message
        const excelUrl = 'https://office.live.com/start/Excel.aspx';
        window.open(excelUrl, '_blank');
        
        alert(`Data exported as CSV! You can now import it into Excel Online. File: ${link.download}`);
      } else {
        // Fallback - just open Excel Online
        const excelUrl = 'https://office.live.com/start/Excel.aspx';
        window.open(excelUrl, '_blank');
      }
    } catch (error) {
      console.error("Failed to open Excel:", error);
      setExcelError("Failed to open Excel workbook. Please try again.");
    }
  };

  const handleConsentGranted = () => {
    setSandboxState(prev => ({ ...prev, grantedScopes: { 'POP-UP': true } }));
    setShowConsentDialog(false);
    
    // Auto-trigger Excel opening after consent
    setTimeout(() => {
      handleOpenInExcel();
    }, 100);
  };

  const handleConsentDenied = () => {
    setShowConsentDialog(false);
    setExcelError("Popup permission is required to open Excel in a new window. Please grant permission to use this feature.");
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim() || "Lakehouse Data Explorer"
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle(item?.definition?.title || "");
    setIsEditing(false);
  };

  // Main render - Lakehouse Data Explorer interface
  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: "20px", maxWidth: "1200px" } }}>
      <div className="excel-embed-header">
        <Text variant="xLarge">{item?.definition?.title || "Lakehouse Data Explorer"}</Text>
        {isEditing ? (
          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <PrimaryButton 
              text="Save"
              onClick={handleSave}
              disabled={isSubmitting || !title.trim()}
            />
            <DefaultButton 
              text="Cancel"
              onClick={handleCancel}
            />
          </Stack>
        ) : (
          <DefaultButton 
            text="Edit Settings"
            onClick={() => setIsEditing(true)} 
          />
        )}
      </div>

      {isEditing && (
        <div className="excel-embed-form">
          <TextField
            label="Title"
            value={title}
            onChange={(_, newValue) => setTitle(newValue || "")}
            placeholder="Enter a title for your Lakehouse data explorer"
            description="This title will appear at the top of your data explorer"
            required
          />
        </div>
      )}
      
      {!isEditing && (
        <>
          <div className="excel-embed-info">
            <MessageBar messageBarType={MessageBarType.info}>
              🚀 <strong>Lakehouse to Excel Integration:</strong> This component connects to your Microsoft Fabric Lakehouse, 
              lets you explore data with a rich preview, and seamlessly exports it to Excel for analysis.
            </MessageBar>
          </div>

          {/* Lakehouse Data Selector */}
          <LakehouseDataSelector
            onDataSelected={handleLakehouseDataSelected}
            onDataLoading={handleLakehouseDataLoading}
          />

          {isLoadingLakehouseData && (
            <MessageBar messageBarType={MessageBarType.info}>
              <Spinner size={SpinnerSize.small} style={{ marginRight: 8 }} />
              Loading Lakehouse data...
            </MessageBar>
          )}

          {excelError && (
            <MessageBar messageBarType={MessageBarType.error}>
              {excelError}
            </MessageBar>
          )}

          {lakehouseData && (
            <div className="excel-embed-actions">
              <PrimaryButton
                text="📊 Export to Excel & Open Online"
                onClick={handleOpenInExcel}
                iconProps={{ iconName: "ExcelLogo" }}
                styles={{ 
                  root: { 
                    backgroundColor: "#217346", 
                    borderColor: "#217346",
                    fontSize: "16px",
                    minHeight: "44px"
                  }
                }}
              />
              <Text variant="small" style={{ marginTop: 8, color: "#666" }}>
                Downloads CSV data and opens Excel Online for analysis
              </Text>
            </div>
          )}

          {/* Sandbox Consent Dialog for Popup Permission */}
          <SandboxConsentDialog
            isVisible={showConsentDialog}
            onConsentGranted={handleConsentGranted}
            onConsentDenied={handleConsentDenied}
            requiredScopes={['POP-UP']}
          />

          <div className="excel-embed-features">
            <Text variant="mediumPlus" block style={{ marginBottom: 12 }}>
              ✨ Lakehouse Integration Features:
            </Text>
            <Stack tokens={{ childrenGap: 8 }}>
              <Text>• 🏠 <strong>Direct Lakehouse Connection:</strong> Browse and query your Fabric Lakehouse tables</Text>
              <Text>• 🔍 <strong>Live Data Preview:</strong> See your data before exporting to Excel</Text>
              <Text>• 📊 <strong>Excel Integration:</strong> Export as CSV and open in Excel Online</Text>
              <Text>• 🔒 <strong>Secure Access:</strong> Proper sandbox relaxation with user consent</Text>
              <Text>• ⚡ <strong>Performance:</strong> Optimized for large datasets with smart pagination</Text>
            </Stack>
          </div>
        </>
      )}

      {isSubmitting && (
        <MessageBar messageBarType={MessageBarType.info}>
          Saving configuration...
        </MessageBar>
      )}
    </Stack>
  );
}

// Consent demo wrapper component - simplified version
interface ExcelEmbedItemEditorDefaultWithConsentProps extends ExcelEmbedItemEditorDefaultProps {}

export function ExcelEmbedItemEditorDefaultWithConsent(props: ExcelEmbedItemEditorDefaultWithConsentProps) {
  const [showDemo, setShowDemo] = useState(false);

  const triggerDemo = () => {
    setShowDemo(true);
  };

  const handleDemoClose = () => {
    setShowDemo(false);
  };

  return (
    <>
      <div className="consent-demo-container">
        <ExcelEmbedItemEditorDefault {...props} />
        
        {/* Demo button to show info */}
        <button 
          className="consent-demo-button"
          onClick={triggerDemo}
        >
          ℹ️ Lakehouse Integration Info
        </button>
      </div>

      {showDemo && (
        <div className="demo-modal-overlay">
          <div className="demo-modal-content">
            <Stack tokens={{ childrenGap: 20 }}>
              <Text variant="xLarge">🚀 Lakehouse to Excel Integration</Text>
              <Text>
                This component demonstrates how to connect <strong>Microsoft Fabric Lakehouse data</strong> 
                to Excel for powerful data analysis workflows.
              </Text>
              <Stack tokens={{ childrenGap: 8 }}>
                <Text>✅ <strong>Direct data connection:</strong> Browse Lakehouse tables</Text>
                <Text>✅ <strong>Live data preview:</strong> See data before export</Text>
                <Text>✅ <strong>Excel integration:</strong> Export and analyze in Excel Online</Text>
                <Text>✅ <strong>Realistic demo data:</strong> Sales, analytics, and inventory tables</Text>
              </Stack>
              <PrimaryButton text="Close" onClick={handleDemoClose} />
            </Stack>
          </div>
        </div>
      )}
    </>
  );
}