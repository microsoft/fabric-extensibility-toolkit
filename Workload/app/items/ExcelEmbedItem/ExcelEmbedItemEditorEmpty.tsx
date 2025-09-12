import React, { useState } from "react";
import { Stack, TextField, PrimaryButton, Text } from "@fluentui/react";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { ExcelEmbedItemDefinition } from "./ExcelEmbedItemModel";

interface ExcelEmbedItemEditorEmptyProps {
  item: ItemWithDefinition<ExcelEmbedItemDefinition>;
  onSave: (definition: ExcelEmbedItemDefinition) => Promise<void>;
  onNavigateToConfigured: () => void;
}

export function ExcelEmbedItemEditorEmpty({ item, onSave, onNavigateToConfigured }: ExcelEmbedItemEditorEmptyProps) {
  const [embedCode, setEmbedCode] = useState(item?.definition?.embedCode || "");
  const [title, setTitle] = useState(item?.definition?.title || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!embedCode.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        embedCode: embedCode.trim(),
        title: title.trim() || "Excel Embed"
      });
      onNavigateToConfigured();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = embedCode.trim().length > 0;

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: "20px", maxWidth: "800px" } }}>
      <Stack tokens={{ childrenGap: 10 }}>
        <Text variant="xxLarge">Create Excel Embed</Text>
        <Text variant="medium">Embed an Excel document by pasting the embed code from SharePoint or OneDrive.</Text>
      </Stack>

      <Stack tokens={{ childrenGap: 15 }}>
        <TextField
          label="Title"
          placeholder="Enter a title for your Excel embed"
          value={title}
          onChange={(_, newValue) => setTitle(newValue || "")}
          styles={{ root: { maxWidth: "400px" } }}
        />

        <TextField
          label="Excel Embed Code"
          placeholder="Paste your Excel embed iframe code here..."
          value={embedCode}
          onChange={(_, newValue) => setEmbedCode(newValue || "")}
          multiline
          rows={8}
          required
        />

        <Stack tokens={{ childrenGap: 10 }}>
          <Text variant="medium" styles={{ root: { fontWeight: "600" } }}>
            Example embed code:
          </Text>
          <Text variant="small" styles={{ root: { fontFamily: "monospace", backgroundColor: "#f5f5f5", padding: "10px", border: "1px solid #ccc" } }}>
            {`<iframe width="700" height="800" frameborder="0" scrolling="no" src="https://microsofteur-my.sharepoint.com/personal/example_microsoft_com/_layouts/15/Doc.aspx?sourcedoc={7cb3b52c-e7fa-4291-810b-4b1d791eb403}&action=embedview&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True"></iframe>`}
          </Text>
        </Stack>

        <PrimaryButton
          text="Save Excel Embed"
          onClick={handleSave}
          disabled={!isValid || isSubmitting}
        />
      </Stack>
    </Stack>
  );
}