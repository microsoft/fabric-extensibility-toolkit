import React from "react";
import { useTranslation } from "react-i18next";

import { ItemEditorEmptyView, EmptyStateTask } from "../../components/ItemEditor";
import "./StreamMigratorItem.scss";

export interface StreamMigratorItemEmptyViewProps {
  onStartMigration: () => void;
}

/**
 * First screen for a newly created Stream Migrator item.
 */
export function StreamMigratorItemEmptyView({
  onStartMigration
}: StreamMigratorItemEmptyViewProps) {
  const { t } = useTranslation();

  const tasks: EmptyStateTask[] = [
    {
      id: "start-migration",
      label: t("StreamMigratorItemEmptyView_Start", "Migrate a job"),
      description: t(
        "StreamMigratorItemEmptyView_Start_Description",
        "Read a Stream Analytics job from Azure, see what converts, and build the matching Eventstream."
      ),
      onClick: onStartMigration
    }
  ];

  return (
    <ItemEditorEmptyView
      title={t("StreamMigratorItemEmptyView_Title", "Stream Analytics migrator")}
      description={t(
        "StreamMigratorItemEmptyView_Description",
        "Migrate Azure Stream Analytics jobs to Fabric Eventstreams. The migrator reports exactly which inputs, outputs and query constructs convert before anything is created."
      )}
      tasks={tasks}
    />
  );
}
