import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Text,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  ChevronDown20Regular,
  Warning20Filled
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { callNavigationOpenInNewBrowserTab } from "../../controller/NavigationController";
import { HelloWorldItemDefinition } from "./HelloWorldItemModel";
import "../../styles.scss";

interface HelloWorldItemEditorGettingStartedProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<HelloWorldItemDefinition>;
}

/**
 * Getting Started component for HelloWorld items in Microsoft Fabric.
 * 
 * This component provides users with helpful resources and next steps after they've
 * moved beyond the initial empty state. It demonstrates various Fabric APIs and 
 * navigation patterns while displaying:
 * 
 * - Warning notice about deletable content
 * - Welcome hero section
 * - Expandable item details
 * - Three resource cards with external links
 * 
 * @param props - Component props containing workload client and item data
 * @returns JSX.Element - The complete getting started interface
 */
export function HelloWorldItemEditorGettingStarted({
  workloadClient,
  item,
}: HelloWorldItemEditorGettingStartedProps) {
  const { t } = useTranslation();
  const [expandedItemDetails, setExpandedItemDetails] = useState(true);

  /**
   * Opens an external resource URL using Fabric's navigation API.
   * Falls back to window.open if Fabric navigation fails.
   * 
   * @param url - The external URL to open in a new browser tab
   */
  const handleOpenResource = async (url: string) => {
    try {
      await callNavigationOpenInNewBrowserTab(workloadClient, url);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="getting-started-container">
      <MessageBar
        intent="warning"
        icon={<Warning20Filled />}
        className="warning-bar"
      >
        <MessageBarBody>
          {t('GettingStarted_Warning', 'You can delete the content on this page at any time.')}
        </MessageBarBody>
      </MessageBar>

      <div className="content-wrapper">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">{t('GettingStarted_Title', 'Hello, Fabric!')}</h1>
              <p className="hero-subtitle">
                {t('GettingStarted_Subtitle', 'Your new workload is ready to use. Use the resources here to customize it and get started.')}
              </p>
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="content-inner">
            <div className="content-header">
              <h2 className="section-title">{t('GettingStarted_SectionTitle', 'Start customizing your workload')}</h2>
              <p className="section-subtitle">{t('GettingStarted_SectionSubtitle', 'These resources will help you take the next steps.')}</p>
            </div>

            <div className="item-details-section">
              <div className="expandable-card">
                <button
                  className="expand-button"
                  onClick={() => setExpandedItemDetails(!expandedItemDetails)}
                  aria-expanded={expandedItemDetails}
                >
                  <ChevronDown20Regular
                    className={`expand-icon ${expandedItemDetails ? 'expanded' : ''}`}
                  />
                  <Text className="expand-title">{t('GettingStarted_ItemDetails', 'Item details')}</Text>
                </button>

                {expandedItemDetails && (
                  <div className="expand-content">
                    <div className="detail-row">
                      <span className="detail-label">{t('Item_Name_Label', 'Item Name')}</span>
                      <span className="detail-value">{item.displayName || 'Hello World'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t('Workspace_ID_Label', 'Workspace ID')}</span>
                      <span className="detail-value">{item.workspaceId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t('Item_ID_Label', 'Item ID')}</span>
                      <span className="detail-value">{item.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t('GettingStarted_WorkspaceType', 'Workspace Type')}</span>
                      <span className="detail-value">{item.type}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="recommended-section">
              <h3 className="recommended-title">{t('GettingStarted_RecommendedSteps', 'Recommended next steps')}</h3>

              <div className="cards-grid">
                <Card className="resource-card">
                  <div className="card-header-section">
                    <div className="card-image">
                      <img src="/assets/items/HelloWorld/card_1.svg" alt="Getting started" />
                    </div>
                    <CardHeader
                      header={<Text weight="semibold">{t('GettingStarted_Card1_Title', 'Getting to know your workload')}</Text>}
                      description={<Text >{t('GettingStarted_Card1_Description', 'See a step-by-step guide for customizing workloads.')}</Text>}
                    />
                  </div>
                  <div className="card-body">
                    <ul className="card-list">
                      <li>{t('GettingStarted_Card1_Bullet1', 'Review your workload\'s structure and file storage.')}</li>
                      <li>{t('GettingStarted_Card1_Bullet2', 'Learn how to set the required properties for publishing.')}</li>
                      <li>{t('GettingStarted_Card1_Bullet3', 'Explore adding optional features and custom settings.')}</li>
                    </ul>
                  </div>
                  <div className="card-footer">
                    <Button
                      appearance="outline"
                      onClick={() => handleOpenResource("https://aka.ms/getting-to-know-your-workload")}
                    >
                      {t('GettingStarted_OpenButton', 'Open')}
                    </Button>
                  </div>
                </Card>

                <Card className="resource-card">
                  <div className="card-header-section">
                    <div className="card-image">
                      <img src="/assets/items/HelloWorld/card_2.svg" alt="Playground" />
                    </div>
                    <CardHeader
                      header={<Text weight="semibold">{t('GettingStarted_Card2_Title', 'Explore samples and playground')}</Text>}
                      description={<Text >{t('GettingStarted_Card2_Description', 'Try available UI components in an interactive environment.')}</Text>}
                    />
                  </div>
                  <div className="card-body">
                    <ul className="card-list">
                      <li>{t('GettingStarted_Card2_Bullet1', 'Explore workload interaction in the sample calculator.')}</li>
                      <li>{t('GettingStarted_Card2_Bullet2', 'Test UI components in the Workload Playground.')}</li>
                      <li>{t('GettingStarted_Card2_Bullet3', 'Clone the repo to run and explore the sample workload.')}</li>
                    </ul>
                  </div>
                  <div className="card-footer">
                    <Button
                      appearance="outline"
                      onClick={() => handleOpenResource('https://aka.ms/explore-samples-and-playground')}
                    >
                      {t('GettingStarted_OpenButton', 'Open')}
                    </Button>
                  </div>
                </Card>

                <Card className="resource-card">
                  <div className="card-header-section">
                    <div className="card-image">
                      <img src="/assets/items/HelloWorld/card_3.svg" alt="Fabric UX" />
                    </div>
                    <CardHeader
                      header={<Text weight="semibold">{t('GettingStarted_Card3_Title', 'Use the Fabric UX system')}</Text>}
                      description={<Text >{t('GettingStarted_Card3_Description', 'Learn about design patterns and best practices.')}</Text>}
                    />
                  </div>
                  <div className="card-body">
                    <ul className="card-list">
                      <li>{t('GettingStarted_Card3_Bullet1', 'Build a consistent UI with official components and patterns.')}</li>
                      <li>{t('GettingStarted_Card3_Bullet2', 'Use design tokens and layouts to accelerate development.')}</li>
                      <li>{t('GettingStarted_Card3_Bullet3', 'Apply our accessibility guidelines for an inclusive experience.')}</li>
                    </ul>
                  </div>
                  <div className="card-footer">
                    <Button
                      appearance="outline"
                      onClick={() => handleOpenResource("https://aka.ms/use-fabric-ux-system")}
                    >
                      {t('GettingStarted_OpenButton', 'Open')}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}