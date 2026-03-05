import React, { useState } from 'react';
import { Stack } from '@fluentui/react';
import {
  Button,
  Field,
  Input
} from "@fluentui/react-components";
import {
  Save24Regular,
  Dismiss24Regular
} from "@fluentui/react-icons";
import { PageProps, SharedState } from '../../App';
import { callDialogClose } from '../../controller/DialogController';
import '../Playground.scss';

/**
 * SharedStatePage - Dialog component for shared state management
 * 
 * Demonstrates the shared state pattern across different dialog instances.
 * This component is opened from the ActionDialog example in ClientSDKPlayground.
 * 
 * Key Features:
 * - Reads and modifies workload shared state
 * - Dialog-based interface with save/cancel actions
 * - Follows Fluent UI v9 component patterns
 * - Proper state synchronization between dialog and parent
 */
export function PlaygroundSharedStatePage(props: PageProps) {
  const { workloadClient } = props;

  // Access workload's shared state
  const sharedState = workloadClient.state.sharedState as SharedState;

  // Local state for editing
  const [localMessage, setLocalMessage] = useState<string>(
    sharedState.message || ''
  );

  async function handleSave() {
    try {
      // Update shared state
      sharedState.message = localMessage;
      await callDialogClose(workloadClient);
    } catch (error) {
      console.error('Failed to save shared state:', error);
    }
  }

  async function handleCancel() {
    try {
      await callDialogClose(workloadClient);
    } catch (error) {
      console.error('Failed to close dialog:', error);
    }
  }

  return (
    <Stack className="shared-state-dialog">
      
      <Stack  className="section">
        <Field 
          label="New Shared State Message:"
          orientation="vertical"
          className="field"
        >
          <Input
            size="medium"
            placeholder="Enter message to share across dialogs"
            value={localMessage}
            onChange={(e, data) => setLocalMessage(data.value)}
            data-testid="iframe-shared-state-input"
          />
        </Field>

        <Stack 
          horizontal 
          tokens={{ childrenGap: 10 }}
          className="shared-state-buttons"
        >
          <Button 
            appearance="primary"
            icon={<Save24Regular />}
            onClick={handleSave}
            data-testid="save-iframe-shared-state"
          >
            Save
          </Button>
          <Button 
            appearance="outline"
            icon={<Dismiss24Regular />}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Stack>
      </Stack >
    </Stack>
  );
}

export default PlaygroundSharedStatePage;