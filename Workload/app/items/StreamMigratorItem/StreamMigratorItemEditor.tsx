import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationType } from "@ms-fabric/workload-client";

import { PageProps, ContextProps } from "../../App";
import {
  ItemWithDefinition,
  getWorkloadItem,
  callGetItem,
  saveWorkloadItem
} from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditor, useViewNavigation, RegisteredNotification } from "../../components/ItemEditor";
import { MessageBar, MessageBarBody, MessageBarTitle, Spinner } from "@fluentui/react-components";
import { StreamMigratorItemDefinition } from "./StreamMigratorItemDefinition";
import { StreamMigratorItemEmptyView } from "./StreamMigratorItemEmptyView";
import { StreamMigratorItemDefaultView } from "./StreamMigratorItemDefaultView";
import { StreamMigratorItemRibbon } from "./StreamMigratorItemRibbon";
import { MigratorWizardContext } from "./steps/WizardContext";
import { bindPlan, createEventstream } from "./migration";
import "./StreamMigratorItem.scss";

export const EDITOR_VIEW_TYPES = {
  EMPTY: "empty",
  DEFAULT: "default"
} as const;

const enum SaveStatus {
  NotSaved = "NotSaved",
  Saving = "Saving",
  Saved = "Saved"
}

/**
 * Editor for the Stream Migrator item.
 *
 * Empty state until a migration is started, then the wizard. Completing the wizard
 * saves the reviewed plan on the item definition and creates the Eventstream in
 * this item's workspace.
 */
export function StreamMigratorItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<StreamMigratorItemDefinition>>();
  const [currentDefinition, setCurrentDefinition] = useState<StreamMigratorItemDefinition>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NotSaved);
  const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string>("");
  const [migrationError, setMigrationError] = useState<string>("");

  async function loadDataFromUrl(context: ContextProps, path: string): Promise<void> {
    if (context.itemObjectId && item && item.id === context.itemObjectId) {
      return;
    }

    setIsLoading(true);

    if (context.itemObjectId) {
      try {
        let loadedItem = await getWorkloadItem<StreamMigratorItemDefinition>(
          workloadClient,
          context.itemObjectId
        );

        if (!loadedItem.definition) {
          setSaveStatus(SaveStatus.NotSaved);
          loadedItem = { ...loadedItem, definition: {} };
        } else {
          setSaveStatus(SaveStatus.Saved);
        }

        setItem(loadedItem);
        setCurrentDefinition(loadedItem.definition || {});
      } catch (error) {
        console.error("Failed to load Stream Migrator item:", error);
        setItem(undefined);
      }
    } else {
      console.log(`non-editor context. Current Path: ${path}`);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageContext, pathname]);

  const handleOpenSettings = async () => {
    if (item) {
      try {
        const result = await callGetItem(workloadClient, item.id);
        await callOpenSettings(workloadClient, result.item, "About");
      } catch (error) {
        console.error("Failed to open settings:", error);
      }
    }
  };

  async function persist(
    definitionToSave: StreamMigratorItemDefinition,
    options: { notify?: boolean } = { notify: true }
  ): Promise<boolean> {
    setSaveStatus(SaveStatus.Saving);

    let saved = false;
    let errorMessage = "";

    try {
      saved = Boolean(
        await saveWorkloadItem<StreamMigratorItemDefinition>(workloadClient, {
          ...item,
          definition: definitionToSave
        })
      );
    } catch (error) {
      errorMessage = error?.message;
    }

    if (saved) {
      item.definition = definitionToSave;
      setCurrentDefinition(definitionToSave);
      setSaveStatus(SaveStatus.Saved);
      if (!options.notify) {
        return true;
      }
      callNotificationOpen(
        workloadClient,
        t("ItemEditor_Saved_Notification_Title"),
        t("ItemEditor_Saved_Notification_Text", { itemName: item.displayName }),
        undefined,
        undefined
      );
    } else {
      setSaveStatus(SaveStatus.NotSaved);
      callNotificationOpen(
        workloadClient,
        t("ItemEditor_SaveFailed_Notification_Title"),
        errorMessage
          ? `${t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName })} ${errorMessage}.`
          : t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName }),
        NotificationType.Error,
        undefined
      );
    }

    return saved;
  }

  /** Flattens the wizard context into the item's persisted shape. */
  function definitionFromWizard(
    context: MigratorWizardContext
  ): StreamMigratorItemDefinition {
    const assessment = context.plan?.assessment;

    return {
      subscriptionId: context.subscriptionId,
      subscriptionDisplayName: context.subscriptionDisplayName,
      jobResourceId: context.jobResourceId,
      jobName: context.job?.name,
      eventstreamName: context.eventstreamName,
      connections: Object.keys(context.connections || {}).map(asaInputName => ({
        asaInputName,
        connectionId: context.connections[asaInputName],
        connectionDisplayName: context.connectionNames?.[asaInputName]
      })),
      targets: Object.keys(context.targets || {}).map(asaOutputName => ({
        asaOutputName,
        ...context.targets[asaOutputName],
        itemDisplayName: context.targetNames?.[asaOutputName]
      })),
      lastAssessmentSummary: assessment
        ? {
            mapped: assessment.counts.Mapped,
            approximated: assessment.counts.Approximated,
            blocked: assessment.counts.Blocked,
            canMigrate: assessment.canMigrate,
            assessedAt: new Date().toISOString()
          }
        : undefined,
      createdEventstreamId: currentDefinition.createdEventstreamId,
      createdEventstreamIds: currentDefinition.createdEventstreamIds,
      migratedAt: currentDefinition.migratedAt
    };
  }

  /**
   * Saves the reviewed plan, then creates the Eventstream(s) in this item's workspace.
   *
   * The plan is persisted before the create is attempted so that a rejected
   * topology does not cost the user their connection and target selections.
   * A job split into independent pipelines yields several Eventstreams; they are
   * created one at a time and each id is persisted as soon as it exists, so a
   * failure part-way leaves an accurate record of what was already created.
   */
  async function runMigration(context: MigratorWizardContext): Promise<void> {
    if (!context.plan || !item) {
      return;
    }

    setMigrationError("");
    setMigrationStatus(t("StreamMigrator_Status_Saving", "Saving migration plan..."));

    const planDefinition = definitionFromWizard(context);
    if (!(await persist(planDefinition, { notify: false }))) {
      // persist has already raised its own failure notification.
      setMigrationStatus("");
      return;
    }

    const jobName = context.plan.assessment.jobName;
    const bound = bindPlan(context.plan, (context.eventstreamName || "").trim() || jobName);
    const createdIds: string[] = [];
    const createdNames: string[] = [];
    let current = "";

    try {
      for (const eventstream of bound) {
        current = eventstream.displayName;
        setMigrationStatus(
          bound.length > 1
            ? t("StreamMigrator_Status_CreatingOneOf", {
                index: createdIds.length + 1,
                count: bound.length,
                eventstreamName: current,
                defaultValue: `Creating Eventstream ${createdIds.length + 1} of ${bound.length} (${current})...`
              })
            : t("StreamMigrator_Status_Creating", "Creating Eventstream...")
        );

        const result = await createEventstream(workloadClient, item.workspaceId, eventstream.definition, {
          displayName: current,
          description:
            `Migrated from Azure Stream Analytics job '${jobName}'` +
            (bound.length > 1 ? ` (inputs: ${eventstream.inputs.join(", ")}).` : ".")
        });
        createdIds.push(result.item.id);
        createdNames.push(result.item.displayName);

        await persist(
          {
            ...planDefinition,
            createdEventstreamId: createdIds[0],
            createdEventstreamIds: [...createdIds],
            migratedAt: new Date().toISOString()
          },
          { notify: false }
        );
      }

      setMigrationStatus("");
      const names = createdNames.join(", ");
      callNotificationOpen(
        workloadClient,
        t("StreamMigrator_Created_Title", "Eventstream created"),
        t("StreamMigrator_Created_Text", {
          eventstreamName: names,
          defaultValue: `${names} ${createdNames.length > 1 ? "were" : "was"} created in this workspace.`
        }),
        undefined,
        undefined
      );
    } catch (error) {
      // Fabric validates the topology server-side, so its message is the useful one.
      let message = error?.message || String(error);
      if (bound.length > 1) {
        message =
          `Could not create '${current}': ${message}` +
          (createdIds.length > 0
            ? ` ${createdIds.length} of ${bound.length} Eventstreams (${createdNames.join(", ")}) ` +
              "were already created. Delete them before retrying, or they will be duplicated."
            : "");
      }
      console.error("Eventstream creation failed:", error);
      setMigrationStatus("");
      setMigrationError(message);
      callNotificationOpen(
        workloadClient,
        t("StreamMigrator_CreateFailed_Title", "Could not create the Eventstream"),
        message,
        NotificationType.Error,
        undefined
      );
    }
  }

  const EmptyViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    return (
      <StreamMigratorItemEmptyView
        onStartMigration={() => setCurrentView(EDITOR_VIEW_TYPES.DEFAULT)}
      />
    );
  };

  const DefaultViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    return (
      <StreamMigratorItemDefaultView
        workloadClient={workloadClient}
        definition={currentDefinition}
        onWizardComplete={async context => {
          await runMigration(context);
        }}
        onWizardCancel={() => setCurrentView(EDITOR_VIEW_TYPES.EMPTY)}
      />
    );
  };

  const views = [
    { name: EDITOR_VIEW_TYPES.EMPTY, component: <EmptyViewWrapper /> },
    { name: EDITOR_VIEW_TYPES.DEFAULT, component: <DefaultViewWrapper /> }
  ];

  // Creating an Eventstream is a long-running operation, so the wizard alone
  // gives no feedback. Surface progress and failure at the editor level.
  const notifications: RegisteredNotification[] = [
    {
      name: "migration-progress",
      showInViews: [EDITOR_VIEW_TYPES.DEFAULT],
      component: migrationStatus ? (
        <MessageBar intent="info">
          <MessageBarBody>
            <Spinner size="tiny" label={migrationStatus} />
          </MessageBarBody>
        </MessageBar>
      ) : null
    },
    {
      name: "migration-error",
      showInViews: [EDITOR_VIEW_TYPES.DEFAULT],
      component: migrationError ? (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Migration failed</MessageBarTitle>
            {migrationError}
          </MessageBarBody>
        </MessageBar>
      ) : null
    }
  ];

  useEffect(() => {
    if (!isLoading && item && viewSetter) {
      viewSetter(
        currentDefinition?.jobResourceId ? EDITOR_VIEW_TYPES.DEFAULT : EDITOR_VIEW_TYPES.EMPTY
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, item, viewSetter]);

  return (
    <ItemEditor
      isLoading={isLoading}
      loadingMessage={t("StreamMigratorItemEditor_Loading", "Loading item...")}
      ribbon={context => (
        <StreamMigratorItemRibbon
          {...props}
          viewContext={context}
          isSaveButtonEnabled={saveStatus !== SaveStatus.Saved}
          saveItemCallback={async () => {
            await persist(currentDefinition);
          }}
          openSettingsCallback={handleOpenSettings}
        />
      )}
      views={views}
      messageBar={notifications}
      viewSetter={setCurrentView => {
        if (!viewSetter) {
          setViewSetter(() => setCurrentView);
        }
      }}
    />
  );
}
