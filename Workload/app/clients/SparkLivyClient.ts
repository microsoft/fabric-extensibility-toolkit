import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { FabricPlatformClient } from "./FabricPlatformClient";
import { SCOPE_PAIRS } from "./FabricPlatformScopes";
import { BatchRequest, BatchResponse, BatchState, SessionRequest, SessionResponse, StatementRequest, StatementResponse, AsyncOperationIndicator } from "./FabricPlatformTypes";

// Livy API version
const LIVY_API_VERSION = "2024-07-30";

/**
 * API wrapper for Spark Livy operations in Fabric
 * Provides methods for managing Spark batch jobs and interactive sessions
 * 
 * Based on the official Fabric REST API:
 * https://learn.microsoft.com/en-us/rest/api/fabric/spark/spark-livy
 * 
 * Uses method-based scope selection:
 * - GET operations use read-only scopes
 * - POST/PUT/PATCH/DELETE operations use read-write scopes
 */
export class SparkLivyClient extends FabricPlatformClient {
  
  constructor(workloadClient: WorkloadClientAPI) {
    // Use scope pairs for method-based scope selection
    super(workloadClient, SCOPE_PAIRS.SPARK_LIVY);
  }

  // ============================
  // Batch Job Management
  // ============================

  /**
   * Create a new batch job in a Fabric lakehouse
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param batchRequest The batch request parameters
   * @returns A promise resolving to the batch response
   */
  async createBatch(
    workspaceId: string,
    lakehouseId: string,
    batchRequest: BatchRequest
  ): Promise<AsyncOperationIndicator> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches`;
      return this.post<AsyncOperationIndicator>(endpoint, batchRequest);
    } catch (error: any) {
      console.error(`Error creating batch job: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all batch jobs in a Fabric lakehouse
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @returns A promise resolving to an array of batch responses
   */
  async listBatches(
    workspaceId: string,
    lakehouseId: string
  ): Promise<BatchResponse[]> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches`;
      const response = await this.get<{ value: BatchResponse[] }>(endpoint);
      return response.value || [];
    } catch (error: any) {
      console.error(`Error listing batch jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific batch job by ID
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param batchId The batch job ID
   * @returns A promise resolving to the batch response
   */
  async getBatch(
    workspaceId: string,
    lakehouseId: string,
    batchId: string
  ): Promise<BatchResponse> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches/${batchId}`;
      return this.get<BatchResponse>(endpoint);
    } catch (error: any) {
      console.error(`Error getting batch job ${batchId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a specific batch job by ID
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param batchId The batch job ID
   * @returns A promise resolving when the batch job is deleted
   */
  async deleteBatch(
    workspaceId: string,
    lakehouseId: string,
    batchId: string
  ): Promise<void> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches/${batchId}`;
      await this.delete<void>(endpoint);
    } catch (error: any) {
      console.error(`Error deleting batch job ${batchId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a specific batch job by ID
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param batchId The batch job ID
   * @returns A promise resolving to the batch response
   */
  async cancelBatch(
    workspaceId: string,
    lakehouseId: string,
    batchId: string
  ): Promise<BatchResponse> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches/${batchId}`;
      return this.delete<BatchResponse>(endpoint);
    } catch (error: any) {
      console.error(`Error cancelling batch job ${batchId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the logs for a specific batch job
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param batchId The batch job ID
   * @param from Optional starting line for logs
   * @param size Optional number of lines to retrieve
   * @returns A promise resolving to an object containing log lines
   */
  async getBatchLogs(
    workspaceId: string,
    lakehouseId: string,
    batchId: string,
    from?: number,
    size?: number
  ): Promise<{ id: string, log: string[] }> {
    try {
      let endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches/${batchId}/log`;
      
      // Add optional query parameters if provided
      const params = new URLSearchParams();
      if (from !== undefined) params.append("from", from.toString());
      if (size !== undefined) params.append("size", size.toString());
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      return this.get<{ id: string, log: string[] }>(endpoint);
    } catch (error: any) {
      console.error(`Error getting logs for batch job ${batchId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the state of a specific batch job
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param batchId The batch job ID
   * @returns A promise resolving to the batch state
   */
  async getBatchState(
    workspaceId: string,
    lakehouseId: string,
    batchId: string
  ): Promise<{ id: string, state: BatchState }> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/batches/${batchId}/state`;
      return this.get<{ id: string, state: BatchState }>(endpoint);
    } catch (error: any) {
      console.error(`Error getting state for batch job ${batchId}: ${error.message}`);
      throw error;
    }
  }

  // ============================
  // Session Management
  // ============================

  /**
   * Create a new Livy session
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionRequest The session request parameters
   * @returns A promise resolving to the async operation indicator
   */
  async createSession(
    workspaceId: string,
    lakehouseId: string,
    sessionRequest: SessionRequest
  ): Promise<AsyncOperationIndicator> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions`;
      return this.post<AsyncOperationIndicator>(endpoint, sessionRequest);
    } catch (error: any) {
      console.error(`Error creating session: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all Livy sessions
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @returns A promise resolving to an array of session responses
   */
  async listSessions(
    workspaceId: string,
    lakehouseId: string
  ): Promise<SessionResponse[]> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions`;
      const response = await this.get<{ value: SessionResponse[] }>(endpoint);
      return response.value;
    } catch (error: any) {
      console.error(`Error listing sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific session by ID
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionId The session ID
   * @returns A promise resolving to the session response
   */
  async getSession(
    workspaceId: string,
    lakehouseId: string,
    sessionId: string
  ): Promise<SessionResponse> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions/${sessionId}`;
      return this.get<SessionResponse>(endpoint);
    } catch (error: any) {
      console.error(`Error getting session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a specific session by ID
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionId The session ID
   * @returns A promise resolving when the session is deleted
   */
  async deleteSession(
    workspaceId: string,
    lakehouseId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions/${sessionId}`;
      await this.delete<void>(endpoint);
    } catch (error: any) {
      console.error(`Error deleting session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a session by ID
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionId The session ID
   * @returns A promise resolving to the session response
   */
  async cancelSession(
    workspaceId: string,
    lakehouseId: string,
    sessionId: string
  ): Promise<SessionResponse> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions/${sessionId}`;
      return this.delete<SessionResponse>(endpoint);
    } catch (error: any) {
      console.error(`Error cancelling session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  // ============================
  // Statement Management
  // ============================

  /**
   * Submit a statement to a specific session
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionId The session ID
   * @param statementRequest The statement request containing code to execute
   * @returns A promise resolving to the statement response
   */
  async submitStatement(
    workspaceId: string,
    lakehouseId: string,
    sessionId: string,
    statementRequest: StatementRequest
  ): Promise<StatementResponse> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions/${sessionId}/statements`;
      return this.post<StatementResponse>(endpoint, statementRequest);
    } catch (error: any) {
      console.error(`Error submitting statement to session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific statement by ID within a session
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionId The session ID
   * @param statementId The statement ID
   * @returns A promise resolving to the statement response
   */
  async getStatement(
    workspaceId: string,
    lakehouseId: string,
    sessionId: string,
    statementId: string
  ): Promise<StatementResponse> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions/${sessionId}/statements/${statementId}`;
      return this.get<StatementResponse>(endpoint);
    } catch (error: any) {
      console.error(`Error getting statement ${statementId} in session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all statements in a specific session
   * @param workspaceId The workspace ID
   * @param lakehouseId The lakehouse ID
   * @param sessionId The session ID
   * @returns A promise resolving to an array of statement responses
   */
  async listStatements(
    workspaceId: string,
    lakehouseId: string,
    sessionId: string
  ): Promise<StatementResponse[]> {
    try {
      const endpoint = `/workspaces/${workspaceId}/lakehouses/${lakehouseId}/livyApi/versions/${LIVY_API_VERSION}/sessions/${sessionId}/statements`;
      const response = await this.get<{ value: StatementResponse[] }>(endpoint);
      return response.value;
    } catch (error: any) {
      console.error(`Error listing statements in session ${sessionId}: ${error.message}`);
      throw error;
    }
  }
}
