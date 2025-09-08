import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { FabricPlatformClient } from "./FabricPlatformClient";
import { SCOPE_PAIRS } from "./FabricPlatformScopes";
import {
  OperationState,
  ErrorResponse,
  AuthenticationConfig,
  AsyncOperationIndicator
} from "./FabricPlatformTypes";

/**
 * API wrapper for Long Running Operations
 * Provides methods for tracking and managing long-running operations
 * 
 * Based on the official Fabric REST API:
 * https://learn.microsoft.com/en-us/rest/api/fabric/core/long-running-operations
 * 
 * Supported operations:
 * - Get Operation State: GET /v1/operations/{operationId}
 * - Get Operation Result: GET /v1/operations/{operationId}/result
 */
export class LongRunningOperationsClient extends FabricPlatformClient {
  
  constructor(workloadClientOrAuthConfig?: WorkloadClientAPI | AuthenticationConfig) {
    // Use scope pairs for method-based scope selection
    super(workloadClientOrAuthConfig, SCOPE_PAIRS.ITEM); // Operations are typically item-related
  }

  // ============================
  // Official Fabric API Methods
  // ============================

  /**
   * Gets the current state of a long-running operation
   * 
   * Official API: GET /v1/operations/{operationId}
   * @param operationId The operation ID (UUID)
   * @returns Promise<OperationState>
   */
  async getOperationState(operationId: string): Promise<OperationState> {
    return this.get<OperationState>(`/operations/${operationId}`);
  }

  /**
   * Gets the result of a long-running operation
   * Should only be called after the operation status is 'Succeeded'
   * 
   * Official API: GET /v1/operations/{operationId}/result
   * @param operationId The operation ID (UUID)
   * @returns Promise<T> The operation result (type varies by operation)
   */
  async getOperationResult<T = any>(asyncIndicator: AsyncOperationIndicator): Promise<T> {
    return this.get<T>(`/operations/${asyncIndicator.operationId}/result`);
  }

  // ============================
  // Utility Methods
  // ============================

  /**
   * Polls an operation until it completes (succeeds or fails)
   * @param operationId The operation ID
   * @param pollingIntervalMs Polling interval in milliseconds (default: 2000)
   * @param timeoutMs Timeout in milliseconds (default: 300000 - 5 minutes)
   * @returns Promise<OperationState>
   */
  async pollUntilComplete(
    asyncIndicator: AsyncOperationIndicator,
    pollingIntervalMs: number = 2000,
    timeoutMs: number = 300000
  ): Promise<OperationState> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const state = await this.getOperationState(asyncIndicator.operationId);
      
      if (state.status === 'Succeeded' || state.status === 'Failed') {
        return state;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
    }
    
    throw new Error(`Operation ${asyncIndicator.operationId} timed out after ${timeoutMs}ms`);
  }

  /**
   * Waits for an operation to complete successfully and returns the result
   * @param operationId The operation ID
   * @param pollingIntervalMs Polling interval in milliseconds (default: 2000)
   * @param timeoutMs Timeout in milliseconds (default: 300000 - 5 minutes)
   * @returns Promise<T> The operation result
   * @throws Error if operation fails or times out
   */
  async waitForSuccessAndGetResult<T = any>(
    asyncIndicator: AsyncOperationIndicator,
    pollingIntervalMs: number = 2000,
    timeoutMs: number = 300000
  ): Promise<T> {
    const finalState = await this.pollUntilComplete(asyncIndicator, pollingIntervalMs, timeoutMs);

    if (finalState.status === 'Failed') {
      const errorMessage = finalState.error?.error?.message || 'Operation failed';
      throw new Error(`Operation ${asyncIndicator.operationId} failed: ${errorMessage}`);
    }
    
    // Get the operation result
    return this.getOperationResult<T>(asyncIndicator);
  }

  /**
   * Waits for an operation to complete successfully (without retrieving result)
   * @param operationId The operation ID
   * @param pollingIntervalMs Polling interval in milliseconds (default: 2000)
   * @param timeoutMs Timeout in milliseconds (default: 300000 - 5 minutes)
   * @returns Promise<OperationState>
   * @throws Error if operation fails or times out
   */
  async waitForSuccess(
    asyncIndicator: AsyncOperationIndicator,
    pollingIntervalMs: number = 2000,
    timeoutMs: number = 300000
  ): Promise<OperationState> {
    const finalState = await this.pollUntilComplete(asyncIndicator, pollingIntervalMs, timeoutMs);

    if (finalState.status === 'Failed') {
      const errorMessage = finalState.error?.error?.message || 'Operation failed';
      throw new Error(`Operation ${asyncIndicator.operationId} failed: ${errorMessage}`);
    }
    
    return finalState;
  }

  /**
   * Checks if an operation is still running
   * @param operationId The operation ID
   * @returns Promise<boolean>
   */
  async isRunning(operationId: string): Promise<boolean> {
    try {
      const state = await this.getOperationState(operationId);
      return state.status === 'Running' || state.status === 'NotStarted';
    } catch (error) {
      // If we can't get the state, assume it's not running
      return false;
    }
  }

  /**
   * Checks if an operation has completed (either succeeded or failed)
   * @param operationId The operation ID
   * @returns Promise<boolean>
   */
  async isComplete(operationId: string): Promise<boolean> {
    try {
      const state = await this.getOperationState(operationId);
      return state.status === 'Succeeded' || state.status === 'Failed';
    } catch (error) {
      // If we can't get the state, assume it's complete (possibly deleted)
      return true;
    }
  }

  /**
   * Checks if an operation has succeeded
   * @param operationId The operation ID
   * @returns Promise<boolean>
   */
  async hasSucceeded(operationId: string): Promise<boolean> {
    try {
      const state = await this.getOperationState(operationId);
      return state.status === 'Succeeded';
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if an operation has failed
   * @param operationId The operation ID
   * @returns Promise<boolean>
   */
  async hasFailed(operationId: string): Promise<boolean> {
    try {
      const state = await this.getOperationState(operationId);
      return state.status === 'Failed';
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the progress percentage of an operation
   * @param operationId The operation ID
   * @returns Promise<number | null> Returns null if progress is not available
   */
  async getProgress(operationId: string): Promise<number | null> {
    try {
      const state = await this.getOperationState(operationId);
      return state.percentComplete ?? null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets the error details of a failed operation
   * @param operationId The operation ID
   * @returns Promise<ErrorResponse | null>
   */
  async getError(operationId: string): Promise<ErrorResponse | null> {
    try {
      const state = await this.getOperationState(operationId);
      return state.error ?? null;
    } catch (error) {
      return null;
    }
  }
}