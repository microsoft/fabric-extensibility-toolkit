import React from "react";
import { PageProps } from '../../App';
import { 
  Ribbon, 
  RibbonAction,
  RibbonActionButton,
  createSaveAction,
  createSettingsAction
} from '../../components/ItemEditor';
import { ViewContext } from '../../components';

/**
 * Props interface for the HelloWorld Ribbon component
 */
export interface HelloWorldItemRibbonProps extends PageProps {
  isSaveButtonEnabled?: boolean;
  viewContext: ViewContext;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
}

/**
 * HelloWorldItemRibbon - Demonstrates the recommended ribbon pattern
 * 
 * This demonstrates the recommended pattern for creating consistent ribbons
 * across all item editors in the Fabric Extensibility Toolkit.
 * 
 * Key Features:
 * - Uses Ribbon with clean API pattern
 * - Uses action factories with automatic internationalization
 * - Defines homeToolbarActions (mandatory Home tab actions)
 * - Demonstrates additional toolbars with Test tab
 * - Shows how to add custom actions
 * - Maintains accessibility with built-in Tooltip + ToolbarButton pattern
 * - Follows Fabric design guidelines
 */
export function HelloWorldItemRibbon(props: HelloWorldItemRibbonProps) {
  const { viewContext } = props;
  
  // Use the action factories for automatic translation and consistent styling
  const saveAction = createSaveAction(
    props.saveItemCallback,
    !props.isSaveButtonEnabled
  );
  
  const settingsAction = createSettingsAction(
    props.openSettingsCallback
  );
  

  const ribbonActions: RibbonActionButton[] = [
    // Uncoment when you want to see how the action looks
    // SAMPLE RIBBON ACTION
    /*{
      key: 'share-item',
      icon: Share24Regular,
      label: t("ItemEditor_Ribbon_Share_Label", "Share"),
      onClick: async () => {
        // Sample share functionality
        console.log("Share action clicked!");       
      },
      testId: 'ribbon-share-btn',
      tooltip: t("ItemEditor_Ribbon_Share_Tooltip", "Share this item with others")
    }*/
  ]

  // Define home toolbar actions - these appear on the mandatory Home toolbar
  const homeToolbarActions: RibbonAction[] = [
    saveAction,
    settingsAction,

    // CUSTOM ACTION EXAMPLE: Getting Started navigation
    // This demonstrates how to create custom actions for view navigation
    /*{
      key: 'getting-started',
      icon: Rocket24Regular,
      label: t("ItemEditor_Ribbon_GettingStarted_Label", "Getting Started"),
      onClick: () => {
        console.log("Open getting started!")
      },
      testId: 'ribbon-getting-started-btn',
    }*/
  ];

  
  return (
    <Ribbon 
      homeToolbarActions={homeToolbarActions} 
      // ADDITIONAL TOOLBAR EXAMPLE
      // This demonstrates how you can add an addtional toolbar
      additionalToolbars={[
        //Uncomment when you want to see how a 2nd toolbar looks
        /*{
          key: 'edit',
          label: "Edit",
          actions: [
                    settingsAction
                  ]
        }*/
      ]}
      rightActionButtons={ribbonActions} // Added sample share action
      viewContext={viewContext} 
    />
  );
}