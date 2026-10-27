import { WorkloadClientAPI, AccessToken } from "@ms-fabric/workload-client";
import { EnvironmentConstants } from "../constants";
import { SCOPES } from "./FabricPlatformScopes";
import { FabricAuthenticationService } from "./FabricAuthenticationService";
import { AuthenticationConfig } from "./FabricPlatformTypes";
import {
  ArmErrorResponse,
  ArmListResponse,
  ArmResourceIdParts,
  AsaStreamingJob,
  AzureResourceGroup,
  AzureSubscription
} from "./AzureResourceManagerTypes";

/**
 * API versions pinned per resource provider.
 *
 * 2020-03-01 is the current stable Stream Analytics management API and the one
 * the $expand documentation is written against.
 */
export const ARM_API_VERSIONS = {
  SUBSCRIPTIONS: "2022-12-01",
  RESOURCE_GROUPS: "2021-04-01",
  STREAM_ANALYTICS: "2020-03-01"
};

/** Error thrown for a non-2xx response from Azure Resource Manager. */
export class AzureResourceManagerError extends Error {
  public readonly statusCode: number;
  public readonly statusText: string;
  public readonly errorResponse?: ArmErrorResponse;
  public readonly correlationId?: string;

  constructor(
    statusCode: number,
    statusText: string,
    errorResponse?: ArmErrorResponse,
    correlationId?: string
  ) {
    super(errorResponse?.error?.message || `HTTP ${statusCode}: ${statusText}`);
    this.name = "AzureResourceManagerError";
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.errorResponse = errorResponse;
    this.correlationId = correlationId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AzureResourceManagerError);
    }
  }

  get errorCode(): string | undefined {
    return this.errorResponse?.error?.code;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      statusText: this.statusText,
      errorCode: this.errorCode,
      correlationId: this.correlationId
    };
  }
}

/**
 * Client for the Azure Resource Manager control plane.
 *
 * This deliberately does NOT extend FabricPlatformClient. It shares the token
 * acquisition path (FabricAuthenticationService, which routes through
 * workloadClient.auth.acquireFrontendAccessToken) but ARM differs from the
 * Fabric API in ways that make the base class a poor fit:
 *   - no /v1 path prefix, and every request needs an api-version query param
 *   - pagination uses an absolute nextLink URL rather than a continuationToken
 *   - a different error body shape
 *
 * Requires the workload Entra application to hold the Azure Service Management
 * user_impersonation delegated permission. See scripts/Setup/CreateDevAADApp.ps1.
 */
export class AzureResourceManagerClient {
  protected workloadClient?: WorkloadClientAPI;
  protected baseUrl: string = EnvironmentConstants.AzureResourceManagerBaseUrl;
  protected scopes: string = SCOPES.AZURE_RESOURCE_MANAGER;
  protected authService: FabricAuthenticationService;

  constructor(workloadClient?: WorkloadClientAPI, authConfig?: AuthenticationConfig) {
    this.workloadClient = workloadClient;
    this.authService = new FabricAuthenticationService(workloadClient, authConfig);
  }

  // ============================
  // Transport
  // ============================

  protected async getAccessToken(): Promise<AccessToken> {
    return this.authService.acquireAccessToken(this.scopes);
  }

  /**
   * Issue an authenticated GET against ARM.
   * @param pathOrUrl Either an ARM-relative path (/subscriptions) or an absolute
   *                  URL, which is what a nextLink gives us.
   * @param apiVersion Appended as api-version unless the URL already carries one.
   */
  protected async get<T>(pathOrUrl: string, apiVersion?: string): Promise<T> {
    const url = this.buildUrl(pathOrUrl, apiVersion);
    const accessToken = await this.getAccessToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      let errorResponse: ArmErrorResponse | undefined;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorResponse = JSON.parse(errorText) as ArmErrorResponse;
        }
      } catch (parseError) {
        console.warn("Failed to parse ARM error response as JSON:", parseError);
      }

      const correlationId =
        response.headers.get("x-ms-correlation-request-id") ||
        response.headers.get("x-ms-request-id") ||
        undefined;

      const error = new AzureResourceManagerError(
        response.status,
        response.statusText,
        errorResponse,
        correlationId
      );
      console.error(`ARM request failed for ${url}:`, error.toJSON());
      throw error;
    }

    return response.json();
  }

  private buildUrl(pathOrUrl: string, apiVersion?: string): string {
    const absolute = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `${this.baseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

    if (!apiVersion || absolute.includes("api-version=")) {
      return absolute;
    }
    return `${absolute}${absolute.includes("?") ? "&" : "?"}api-version=${apiVersion}`;
  }

  /** Follow nextLink until the full result set has been read. */
  protected async getAllPages<T>(path: string, apiVersion: string): Promise<T[]> {
    const items: T[] = [];
    let next: string | undefined = path;
    let isFirstPage = true;

    while (next) {
      // nextLink is absolute and already carries its own api-version.
      const page: ArmListResponse<T> = await this.get<ArmListResponse<T>>(
        next,
        isFirstPage ? apiVersion : undefined
      );
      if (page?.value?.length) {
        items.push(...page.value);
      }
      next = page?.nextLink;
      isFirstPage = false;
    }

    return items;
  }

  // ============================
  // Discovery
  // ============================

  /**
   * Lists the subscriptions the signed-in user can see.
   * An empty list is a valid answer, and usually means the user has no Azure
   * RBAC assignment rather than that the call failed.
   */
  async listSubscriptions(): Promise<AzureSubscription[]> {
    return this.getAllPages<AzureSubscription>("/subscriptions", ARM_API_VERSIONS.SUBSCRIPTIONS);
  }

  async listResourceGroups(subscriptionId: string): Promise<AzureResourceGroup[]> {
    return this.getAllPages<AzureResourceGroup>(
      `/subscriptions/${encodeURIComponent(subscriptionId)}/resourcegroups`,
      ARM_API_VERSIONS.RESOURCE_GROUPS
    );
  }

  // ============================
  // Stream Analytics
  // ============================

  /**
   * Lists Stream Analytics jobs, across a whole subscription or within one
   * resource group. The listing does not include inputs, outputs or the
   * transformation query - use getStreamingJob for those.
   */
  async listStreamingJobs(
    subscriptionId: string,
    resourceGroupName?: string
  ): Promise<AsaStreamingJob[]> {
    const scope = resourceGroupName
      ? `/subscriptions/${encodeURIComponent(subscriptionId)}/resourceGroups/${encodeURIComponent(resourceGroupName)}`
      : `/subscriptions/${encodeURIComponent(subscriptionId)}`;

    return this.getAllPages<AsaStreamingJob>(
      `${scope}/providers/Microsoft.StreamAnalytics/streamingjobs`,
      ARM_API_VERSIONS.STREAM_ANALYTICS
    );
  }

  /**
   * Reads one Stream Analytics job. By default expands the four properties that
   * are omitted from the standard response and that the migrator needs:
   * inputs, outputs, transformation and functions.
   */
  async getStreamingJob(
    subscriptionId: string,
    resourceGroupName: string,
    jobName: string,
    expand: string[] = ["inputs", "outputs", "transformation", "functions"]
  ): Promise<AsaStreamingJob> {
    const path =
      `/subscriptions/${encodeURIComponent(subscriptionId)}` +
      `/resourceGroups/${encodeURIComponent(resourceGroupName)}` +
      `/providers/Microsoft.StreamAnalytics/streamingjobs/${encodeURIComponent(jobName)}`;

    const query = expand?.length ? `?$expand=${encodeURIComponent(expand.join(","))}` : "";

    return this.get<AsaStreamingJob>(`${path}${query}`, ARM_API_VERSIONS.STREAM_ANALYTICS);
  }

  /** Convenience wrapper: read a job from the ARM resource id returned by a listing. */
  async getStreamingJobByResourceId(resourceId: string): Promise<AsaStreamingJob> {
    const { subscriptionId, resourceGroupName, name } =
      AzureResourceManagerClient.parseResourceId(resourceId);
    return this.getStreamingJob(subscriptionId, resourceGroupName, name);
  }

  // ============================
  // Helpers
  // ============================

  /**
   * Splits an ARM resource id into its subscription, resource group and name.
   * Segment casing varies between ARM responses, so match case-insensitively.
   */
  static parseResourceId(resourceId: string): ArmResourceIdParts {
    const match = /\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/[^/]+\/[^/]+\/([^/]+)/i.exec(
      resourceId
    );
    if (!match) {
      throw new Error(`Unrecognized ARM resource id: ${resourceId}`);
    }
    return {
      subscriptionId: match[1],
      resourceGroupName: match[2],
      name: match[3]
    };
  }

  updateWorkloadClient(workloadClient: WorkloadClientAPI): void {
    this.workloadClient = workloadClient;
    this.authService.updateWorkloadClient(workloadClient);
  }
}
