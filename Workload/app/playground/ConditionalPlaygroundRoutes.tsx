import React from "react";
import { Route } from "react-router-dom";
import { PageProps } from "../App";

// Dynamic imports that only resolve if files exist and environment allows
let ClientSDKPlayground: React.ComponentType<any> | null = null;
let ClientSDKStore: any = null;
let DataPlayground: React.ComponentType<any> | null = null;
let SamplePage: React.ComponentType<any> | null = null;
let PlaygroundSharedStatePage: React.ComponentType<any> | null = null;
let PlaygroundPanel: React.ComponentType<any> | null = null;
let Provider: React.ComponentType<any> | null = null;

// Only load playground components in development
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_PLAYGROUND === 'true') {
  try {
    const playgroundModule = require("./ClientSDKPlayground/ClientSDKPlayground");
    ClientSDKPlayground = playgroundModule.ClientSDKPlayground;
    SamplePage = playgroundModule.SamplePage;
    
    const storeModule = require("./ClientSDKPlayground/Store/Store");
    ClientSDKStore = storeModule.ClientSDKStore;
    
    const dataModule = require("./DataPlayground/DataPlayground");
    DataPlayground = dataModule.DataPlayground;
    
    const sharedStateModule = require("./ClientSDKPlayground/playgroundSharedStatePage");
    PlaygroundSharedStatePage = sharedStateModule.default;
    
    const panelModule = require("./ClientSDKPlayground/PlaygroungPanel");
    PlaygroundPanel = panelModule.PlaygroundPanel;
    
    const reactReduxModule = require("react-redux");
    Provider = reactReduxModule.Provider;
    
    console.log('🎮 Playground components loaded for development');
  } catch (error) {
    console.log('⚠️ Playground components not available:', error.message);
  }
}

interface ConditionalPlaygroundRoutesProps extends PageProps {}

/**
 * Conditionally rendered playground routes
 * Only includes routes when components are available (development mode)
 */
export function ConditionalPlaygroundRoutes({ workloadClient }: ConditionalPlaygroundRoutesProps) {
  // If playground components aren't loaded, return null
  if (!ClientSDKPlayground || !DataPlayground || !SamplePage || !PlaygroundSharedStatePage || !PlaygroundPanel || !Provider || !ClientSDKStore) {
    return null;
  }

  return (
    <>
      <Route path="/playground-client-sdk">
        <Provider store={ClientSDKStore}>
          <ClientSDKPlayground workloadClient={workloadClient} />
        </Provider>
      </Route>

      <Route path="/playground-data">
        <DataPlayground workloadClient={workloadClient} />
      </Route>

      <Route path="/playground-sample-page">
        <SamplePage workloadClient={workloadClient} />
      </Route>

      <Route path="/playground-shared-state-page">
        <PlaygroundSharedStatePage workloadClient={workloadClient} />
      </Route>

      <Route path="/playground-panel">
        <PlaygroundPanel workloadClient={workloadClient} />
      </Route>
    </>
  );
}