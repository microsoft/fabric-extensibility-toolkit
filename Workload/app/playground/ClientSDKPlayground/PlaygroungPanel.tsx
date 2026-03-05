import React, { useState } from 'react';
import { Stack } from '@fluentui/react';
import {
  Button,
  Radio,
  RadioGroup,
  Label,
  useId,
  Divider
} from '@fluentui/react-components';
import {
  Lightbulb24Regular,
  Dismiss24Regular
} from "@fluentui/react-icons";
import { TabContentProps } from './ClientSDKPlaygroundModel';
import { callPanelClose } from '../../controller/PanelController';
import "../Playground.scss"

export function PlaygroundPanel(props: TabContentProps) {
  const { workloadClient } = props;
  const [selectedOption, setSelectedOption] = useState<string>('option1');
  
  const radioName = useId("radio");
  const labelId = useId("label");

  async function onClosePanel() {
    await callPanelClose(workloadClient);
  }

  return (
    <Stack className="panel">
      <Divider alignContent="start">Panel Example</Divider>
      
      {/* Button Section */}
      <div className="section">
        <Stack tokens={{ childrenGap: 10 }}>
          <Button 
            icon={<Lightbulb24Regular />} 
            appearance="primary"
          >
            Button 1
          </Button>
          <Button 
            icon={<Lightbulb24Regular />} 
            appearance="primary"
          >
            Button 2
          </Button>
          <Button 
            icon={<Lightbulb24Regular />} 
            appearance="primary"
          >
            Button 3
          </Button>
        </Stack>
      </div>

      {/* Radio Group Section */}
      <div className="section">
        <Label id={labelId}>Radio group</Label>
        <RadioGroup 
          aria-labelledby={labelId} 
          value={selectedOption}
          onChange={(e, data) => setSelectedOption(data.value)}
        >
          <Radio name={radioName} value="option1" label="Option 1" />
          <Radio name={radioName} value="option2" label="Option 2" />
          <Radio name={radioName} value="option3" label="Option 3" />
        </RadioGroup>
      </div>

      {/* Close Button Section */}
      <div className="section">
        <Button 
          icon={<Dismiss24Regular />}
          appearance="outline"
          onClick={onClosePanel}
        >
          Close Panel
        </Button>
      </div>
    </Stack>
  );
}

export default PlaygroundPanel;