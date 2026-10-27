import React from "react";
import { PageProps } from "../../App";
import {
  Ribbon,
  RibbonAction,
  createSaveAction,
  createSettingsAction
} from "../../components/ItemEditor";
import { ViewContext } from "../../components";

export interface StreamMigratorItemRibbonProps extends PageProps {
  viewContext: ViewContext;
  isSaveButtonEnabled?: boolean;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
}

/**
 * Ribbon for the Stream Migrator item.
 *
 * Uses the standard action factories so labels and styling stay consistent with
 * the rest of the workload.
 */
export function StreamMigratorItemRibbon(props: StreamMigratorItemRibbonProps) {
  const { viewContext } = props;

  const homeToolbarActions: RibbonAction[] = [
    createSaveAction(props.saveItemCallback, !props.isSaveButtonEnabled),
    createSettingsAction(props.openSettingsCallback)
  ];

  return <Ribbon homeToolbarActions={homeToolbarActions} viewContext={viewContext} />;
}
