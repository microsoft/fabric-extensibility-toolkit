import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { FabricPlatformClient } from './FabricPlatformClient';
import { SCOPE_PAIRS } from './FabricPlatformScopes';
import {
  Gateway,
  OnPremisesGateway,
  OnPremisesGatewayPersonal,
  VirtualNetworkGateway,
  ListGatewaysResponse,
  CreateVirtualNetworkGatewayRequest,
  UpdateOnPremisesGatewayRequest,
  UpdateVirtualNetworkGatewayRequest,
  OnPremisesGatewayMember,
  ListGatewayMembersResponse,
  UpdateGatewayMemberRequest,
  GatewayRoleAssignment,
  GatewayRoleAssignments,
  AddGatewayRoleAssignmentRequest,
  UpdateGatewayRoleAssignmentRequest,
  GatewayRole,
  GatewayType,
  PrincipalType
} from './FabricPlatformTypes';

/**
 * Client for interacting with Microsoft Fabric Gateway APIs
 * Provides comprehensive management of gateways including on-premises, personal, and virtual network gateways.
 * 
 * Based on the official Fabric REST API:
 * https://learn.microsoft.com/en-us/rest/api/fabric/core/gateways
 * 
 * API Features:
 * - Gateway Management: List, get, create, update, and delete gateways
 * - Gateway Members: Manage members of on-premises gateway clusters
 * - Role Assignments: Manage user/group access to gateways with specific roles
 * 
 * Supported Gateway Types:
 * - OnPremises: Standard on-premises data gateway clusters
 * - OnPremisesPersonal: Personal mode on-premises data gateways
 * - VirtualNetwork: Virtual network data gateways
 */
export class GatewayClient extends FabricPlatformClient {
  constructor(workloadClient: WorkloadClientAPI) {
    super(workloadClient, SCOPE_PAIRS.GATEWAY);
  }

  // ==========================================
  // Gateway Management Operations
  // ==========================================

  /**
   * List all gateways the user has permission for
   * @param continuationToken Optional token for retrieving the next page of results
   * @returns Promise resolving to list of gateways
   */
  async listGateways(continuationToken?: string): Promise<ListGatewaysResponse> {
    let endpoint = '/gateways';
    if (continuationToken) {
      endpoint += `?continuationToken=${encodeURIComponent(continuationToken)}`;
    }

    return this.get<ListGatewaysResponse>(endpoint);
  }

  /**
   * Get all gateways with automatic pagination
   * @param maxResults Optional maximum number of gateways to retrieve (default: no limit)
   * @returns Promise resolving to array of all gateways
   */
  async getAllGateways(maxResults?: number): Promise<Gateway[]> {
    const allGateways: Gateway[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.listGateways(continuationToken);
      allGateways.push(...response.value);

      if (maxResults && allGateways.length >= maxResults) {
        return allGateways.slice(0, maxResults);
      }

      continuationToken = response.continuationToken;
    } while (continuationToken);

    return allGateways;
  }

  /**
   * Get a specific gateway by ID
   * @param gatewayId The ID of the gateway
   * @returns Promise resolving to the gateway
   */
  async getGateway(gatewayId: string): Promise<Gateway> {
    return this.get<Gateway>(`/gateways/${gatewayId}`);
  }

  /**
   * Create a virtual network gateway
   * @param request The gateway creation request
   * @returns Promise resolving to the created gateway
   */
  async createVirtualNetworkGateway(request: CreateVirtualNetworkGatewayRequest): Promise<VirtualNetworkGateway> {
    return this.post<VirtualNetworkGateway>('/gateways', request);
  }

  /**
   * Update an on-premises gateway
   * @param gatewayId The ID of the gateway to update
   * @param request The update request
   * @returns Promise resolving when the gateway is updated
   */
  async updateOnPremisesGateway(gatewayId: string, request: UpdateOnPremisesGatewayRequest): Promise<OnPremisesGateway> {
    return this.patch<OnPremisesGateway>(`/gateways/${gatewayId}`, request);
  }

  /**
   * Update a virtual network gateway
   * @param gatewayId The ID of the gateway to update
   * @param request The update request
   * @returns Promise resolving when the gateway is updated
   */
  async updateVirtualNetworkGateway(gatewayId: string, request: UpdateVirtualNetworkGatewayRequest): Promise<VirtualNetworkGateway> {
    return this.patch<VirtualNetworkGateway>(`/gateways/${gatewayId}`, request);
  }

  /**
   * Delete a gateway by ID
   * @param gatewayId The ID of the gateway to delete
   * @returns Promise resolving when the gateway is deleted
   */
  async deleteGateway(gatewayId: string): Promise<void> {
    await this.delete(`/gateways/${gatewayId}`);
  }

  // ==========================================
  // Gateway Member Operations (OnPremises only)
  // ==========================================

  /**
   * List gateway members of an on-premises gateway
   * @param gatewayId The ID of the on-premises gateway
   * @returns Promise resolving to list of gateway members
   */
  async listGatewayMembers(gatewayId: string): Promise<ListGatewayMembersResponse> {
    return this.get<ListGatewayMembersResponse>(`/gateways/${gatewayId}/members`);
  }

  /**
   * Update a gateway member (enable/disable)
   * @param gatewayId The ID of the gateway
   * @param memberId The ID of the gateway member
   * @param request The update request
   * @returns Promise resolving when the member is updated
   */
  async updateGatewayMember(gatewayId: string, memberId: string, request: UpdateGatewayMemberRequest): Promise<void> {
    await this.patch(`/gateways/${gatewayId}/members/${memberId}`, request);
  }

  /**
   * Delete a gateway member
   * @param gatewayId The ID of the gateway
   * @param memberId The ID of the gateway member to delete
   * @returns Promise resolving when the member is deleted
   */
  async deleteGatewayMember(gatewayId: string, memberId: string): Promise<void> {
    await this.delete(`/gateways/${gatewayId}/members/${memberId}`);
  }

  /**
   * Enable a gateway member
   * @param gatewayId The ID of the gateway
   * @param memberId The ID of the gateway member
   * @returns Promise resolving when the member is enabled
   */
  async enableGatewayMember(gatewayId: string, memberId: string): Promise<void> {
    await this.updateGatewayMember(gatewayId, memberId, { enabled: true });
  }

  /**
   * Disable a gateway member
   * @param gatewayId The ID of the gateway
   * @param memberId The ID of the gateway member
   * @returns Promise resolving when the member is disabled
   */
  async disableGatewayMember(gatewayId: string, memberId: string): Promise<void> {
    await this.updateGatewayMember(gatewayId, memberId, { enabled: false });
  }

  // ==========================================
  // Gateway Role Assignment Operations
  // ==========================================

  /**
   * List gateway role assignments
   * @param gatewayId The ID of the gateway
   * @param continuationToken Optional token for retrieving the next page of results
   * @returns Promise resolving to list of role assignments
   */
  async listGatewayRoleAssignments(gatewayId: string, continuationToken?: string): Promise<GatewayRoleAssignments> {
    let endpoint = `/gateways/${gatewayId}/roleAssignments`;
    if (continuationToken) {
      endpoint += `?continuationToken=${encodeURIComponent(continuationToken)}`;
    }

    return this.get<GatewayRoleAssignments>(endpoint);
  }

  /**
   * Get all gateway role assignments with automatic pagination
   * @param gatewayId The ID of the gateway
   * @param maxResults Optional maximum number of assignments to retrieve (default: no limit)
   * @returns Promise resolving to array of all role assignments
   */
  async getAllGatewayRoleAssignments(gatewayId: string, maxResults?: number): Promise<GatewayRoleAssignment[]> {
    const allAssignments: GatewayRoleAssignment[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.listGatewayRoleAssignments(gatewayId, continuationToken);
      allAssignments.push(...response.value);

      if (maxResults && allAssignments.length >= maxResults) {
        return allAssignments.slice(0, maxResults);
      }

      continuationToken = response.continuationToken;
    } while (continuationToken);

    return allAssignments;
  }

  /**
   * Get a specific gateway role assignment
   * @param gatewayId The ID of the gateway
   * @param principalId The ID of the principal
   * @returns Promise resolving to the role assignment
   */
  async getGatewayRoleAssignment(gatewayId: string, principalId: string): Promise<GatewayRoleAssignment> {
    return this.get<GatewayRoleAssignment>(`/gateways/${gatewayId}/roleAssignments/${principalId}`);
  }

  /**
   * Add a gateway role assignment
   * @param gatewayId The ID of the gateway
   * @param request The role assignment request
   * @returns Promise resolving to the created role assignment
   */
  async addGatewayRoleAssignment(gatewayId: string, request: AddGatewayRoleAssignmentRequest): Promise<GatewayRoleAssignment> {
    return this.post<GatewayRoleAssignment>(`/gateways/${gatewayId}/roleAssignments`, request);
  }

  /**
   * Update a gateway role assignment
   * @param gatewayId The ID of the gateway
   * @param principalId The ID of the principal
   * @param request The update request
   * @returns Promise resolving to the updated role assignment
   */
  async updateGatewayRoleAssignment(gatewayId: string, principalId: string, request: UpdateGatewayRoleAssignmentRequest): Promise<GatewayRoleAssignment> {
    return this.patch<GatewayRoleAssignment>(`/gateways/${gatewayId}/roleAssignments/${principalId}`, request);
  }

  /**
   * Delete a gateway role assignment
   * @param gatewayId The ID of the gateway
   * @param principalId The ID of the principal
   * @returns Promise resolving when the role assignment is deleted
   */
  async deleteGatewayRoleAssignment(gatewayId: string, principalId: string): Promise<void> {
    await this.delete(`/gateways/${gatewayId}/roleAssignments/${principalId}`);
  }

  // ==========================================
  // Helper Methods for Common Operations
  // ==========================================

  /**
   * Get gateways by type
   * @param type The type of gateway to filter by
   * @returns Promise resolving to gateways of the specified type
   */
  async getGatewaysByType(type: GatewayType): Promise<Gateway[]> {
    const allGateways = await this.getAllGateways();
    return allGateways.filter(gateway => gateway.type === type);
  }

  /**
   * Get on-premises gateways only
   * @returns Promise resolving to on-premises gateways
   */
  async getOnPremisesGateways(): Promise<OnPremisesGateway[]> {
    const gateways = await this.getGatewaysByType('OnPremises');
    return gateways as OnPremisesGateway[];
  }

  /**
   * Get personal mode gateways only
   * @returns Promise resolving to personal mode gateways
   */
  async getPersonalGateways(): Promise<OnPremisesGatewayPersonal[]> {
    const gateways = await this.getGatewaysByType('OnPremisesPersonal');
    return gateways as OnPremisesGatewayPersonal[];
  }

  /**
   * Get virtual network gateways only
   * @returns Promise resolving to virtual network gateways
   */
  async getVirtualNetworkGateways(): Promise<VirtualNetworkGateway[]> {
    const gateways = await this.getGatewaysByType('VirtualNetwork');
    return gateways as VirtualNetworkGateway[];
  }

  /**
   * Find a gateway by display name
   * @param displayName The display name to search for
   * @returns Promise resolving to the gateway if found, undefined otherwise
   */
  async findGatewayByName(displayName: string): Promise<Gateway | undefined> {
    const allGateways = await this.getAllGateways();
    return allGateways.find(gateway => 
      ('displayName' in gateway && gateway.displayName === displayName)
    );
  }

  /**
   * Get role assignments for a specific principal
   * @param principalId The ID of the principal
   * @returns Promise resolving to gateways where the principal has role assignments
   */
  async getGatewaysForPrincipal(principalId: string): Promise<{ gateway: Gateway; assignment: GatewayRoleAssignment }[]> {
    const allGateways = await this.getAllGateways();
    const results: { gateway: Gateway; assignment: GatewayRoleAssignment }[] = [];

    for (const gateway of allGateways) {
      try {
        const assignment = await this.getGatewayRoleAssignment(gateway.id, principalId);
        results.push({ gateway, assignment });
      } catch (error) {
        // Principal doesn't have access to this gateway, continue
        continue;
      }
    }

    return results;
  }

  /**
   * Get all admins for a gateway
   * @param gatewayId The ID of the gateway
   * @returns Promise resolving to admin role assignments
   */
  async getGatewayAdmins(gatewayId: string): Promise<GatewayRoleAssignment[]> {
    const allAssignments = await this.getAllGatewayRoleAssignments(gatewayId);
    return allAssignments.filter(assignment => assignment.role === 'Admin');
  }

  /**
   * Check if a principal has admin access to a gateway
   * @param gatewayId The ID of the gateway
   * @param principalId The ID of the principal
   * @returns Promise resolving to true if the principal is an admin
   */
  async isGatewayAdmin(gatewayId: string, principalId: string): Promise<boolean> {
    try {
      const assignment = await this.getGatewayRoleAssignment(gatewayId, principalId);
      return assignment.role === 'Admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Grant admin access to a gateway
   * @param gatewayId The ID of the gateway
   * @param principalId The ID of the principal
   * @param principalType The type of the principal
   * @returns Promise resolving to the created role assignment
   */
  async grantGatewayAdmin(gatewayId: string, principalId: string, principalType: PrincipalType): Promise<GatewayRoleAssignment> {
    return this.addGatewayRoleAssignment(gatewayId, {
      principal: { id: principalId, type: principalType },
      role: 'Admin'
    });
  }

  /**
   * Grant connection creator access to a gateway
   * @param gatewayId The ID of the gateway
   * @param principalId The ID of the principal
   * @param principalType The type of the principal
   * @param withResharing Whether to grant resharing permissions
   * @returns Promise resolving to the created role assignment
   */
  async grantConnectionCreator(
    gatewayId: string, 
    principalId: string, 
    principalType: PrincipalType, 
    withResharing: boolean = false
  ): Promise<GatewayRoleAssignment> {
    const role: GatewayRole = withResharing ? 'ConnectionCreatorWithResharing' : 'ConnectionCreator';
    return this.addGatewayRoleAssignment(gatewayId, {
      principal: { id: principalId, type: principalType },
      role
    });
  }

  /**
   * Create a virtual network gateway with validation
   * @param config Configuration for the virtual network gateway
   * @returns Promise resolving to the created gateway
   */
  async createVirtualNetworkGatewayWithValidation(config: {
    displayName: string;
    capacityId: string;
    subscriptionId: string;
    resourceGroupName: string;
    virtualNetworkName: string;
    subnetName: string;
    inactivityMinutesBeforeSleep?: number;
    numberOfMemberGateways?: number;
  }): Promise<VirtualNetworkGateway> {
    // Validate inactivity minutes
    const validInactivityValues = [30, 60, 90, 120, 150, 240, 360, 480, 720, 1440];
    const inactivityMinutes = config.inactivityMinutesBeforeSleep || 1440;
    
    if (!validInactivityValues.includes(inactivityMinutes)) {
      throw new Error(`Invalid inactivityMinutesBeforeSleep. Must be one of: ${validInactivityValues.join(', ')}`);
    }

    // Validate number of member gateways
    const numberOfMembers = config.numberOfMemberGateways || 1;
    if (numberOfMembers < 1 || numberOfMembers > 7) {
      throw new Error('numberOfMemberGateways must be between 1 and 7');
    }

    // Validate display name length
    if (config.displayName.length > 200) {
      throw new Error('displayName must be 200 characters or less');
    }

    const request: CreateVirtualNetworkGatewayRequest = {
      type: 'VirtualNetwork',
      displayName: config.displayName,
      capacityId: config.capacityId,
      virtualNetworkAzureResource: {
        subscriptionId: config.subscriptionId,
        resourceGroupName: config.resourceGroupName,
        virtualNetworkName: config.virtualNetworkName,
        subnetName: config.subnetName
      },
      inactivityMinutesBeforeSleep: inactivityMinutes,
      numberOfMemberGateways: numberOfMembers
    };

    return this.createVirtualNetworkGateway(request);
  }

  /**
   * Get enabled gateway members only
   * @param gatewayId The ID of the on-premises gateway
   * @returns Promise resolving to enabled gateway members
   */
  async getEnabledGatewayMembers(gatewayId: string): Promise<OnPremisesGatewayMember[]> {
    const response = await this.listGatewayMembers(gatewayId);
    return response.value.filter(member => member.enabled);
  }

  /**
   * Get disabled gateway members only
   * @param gatewayId The ID of the on-premises gateway
   * @returns Promise resolving to disabled gateway members
   */
  async getDisabledGatewayMembers(gatewayId: string): Promise<OnPremisesGatewayMember[]> {
    const response = await this.listGatewayMembers(gatewayId);
    return response.value.filter(member => !member.enabled);
  }
}