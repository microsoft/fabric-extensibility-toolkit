/**
 * Configuration Controller for Microsoft Fabric Workload
 * Provides methods to access workload configuration from environment variables
 */

/**
 * Represents a configured workload item
 */
export interface WorkloadItem {
  /** The item name (e.g., "OneLakeExplorer") */
  name: string;
  /** The full item type identifier (e.g., "Org.FabricTools.OneLakeExplorer") */
  fullType: string;
  /** The editor route path (e.g., "/OneLakeExplorerItem-editor") */
  editorRoute: string;
}

/**
 * Represents the complete workload configuration
 */
export interface WorkloadConfiguration {
  /** The workload name (e.g., "Org.FabricTools") */
  workloadName: string;
  /** The workload version */
  version: string;
  /** Log level */
  logLevel: string;
  /** Array of configured workload items */
  items: WorkloadItem[];
}

/**
 * Gets all items that are configured in the process.env variables
 * @returns Array of WorkloadItem objects representing all configured items
 */
export function getConfiguredWorkloadItems(): WorkloadItem[] {
  const workloadName = process.env.WORKLOAD_NAME;
  const itemNames = process.env.ITEM_NAMES;

  if (!workloadName) {
    console.warn('WORKLOAD_NAME is not defined in environment variables');
    return [];
  }

  if (!itemNames) {
    console.warn('ITEM_NAMES is not defined in environment variables');
    return [];
  }

  try {
    // Parse comma-separated item names
    const items: WorkloadItem[] = itemNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map(name => ({
        name,
        fullType: `${workloadName}.${name}`,
        editorRoute: `/${name}Item-editor`
      }));

    return items;
  } catch (error) {
    console.error('Error parsing configured items:', error);
    return [];
  }
}

/**
 * Gets a specific configured item by name
 * @param itemName The name of the item to retrieve (e.g., "OneLakeExplorer")
 * @returns WorkloadItem if found, undefined otherwise
 */
export function getConfiguredWorkloadItem(itemName: string): WorkloadItem | undefined {
  const items = getConfiguredWorkloadItems();
  return items.find(item => item.name === itemName);
}

/**
 * Gets the full workload configuration from environment variables
 * @returns Complete WorkloadConfiguration object
 */
export function getWorkloadConfiguration(): WorkloadConfiguration {
  const workloadName = process.env.WORKLOAD_NAME || '';
  const version = process.env.WORKLOAD_VERSION || '';
  const logLevel = process.env.LOG_LEVEL || '';

  const items = getConfiguredWorkloadItems();

  return {
    workloadName,
    version,
    logLevel,
    items
  };
}

/**
 * Gets an array of full item type identifiers for all configured items
 * @returns Array of strings like ["Org.FabricTools.OneLakeExplorer", "Org.FabricTools.PackageInstaller"]
 */
export function getConfiguredWorkloadItemTypes(): string[] {
  return getConfiguredWorkloadItems().map(item => item.fullType);
}

/**
 * Gets an array of item names only
 * @returns Array of strings like ["OneLakeExplorer", "PackageInstaller"]
 */
export function getConfiguredWorkloadItemNames(): string[] {
  return getConfiguredWorkloadItems().map(item => item.name);
}

/**
 * Checks if a specific item is configured in the workload
 * @param itemName The name of the item to check
 * @returns True if the item is configured, false otherwise
 */
export function isWorkloadItemConfigured(itemName: string): boolean {
  return getConfiguredWorkloadItems().some(item => item.name === itemName);
}

/**
 * Gets the workload name from environment variables
 * @returns The workload name (e.g., "Org.FabricTools")
 */
export function getWorkloadName(): string {
  return process.env.WORKLOAD_NAME || '';
}
