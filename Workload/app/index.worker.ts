import {
    createWorkloadClient,
    InitParams,
    ItemLikeV2,
    ItemSettingContext,
    NotificationToastDuration,
    NotificationType
} from '@ms-fabric/workload-client';
import { callPageOpen } from './controller/PageController';
import { callNotificationOpen } from './controller/NotificationController';
import { t } from 'i18next';

/*
* Represents a fabric item with additional metadata and a payload.
* This interface extends WorkloadItem and includes a payload property.
*/
interface ItemCreationFailureData {
    errorCode?: string;
    resultCode?: string;
}

/**
* Represents a fabric item with additional metadata and a payload.
* This interface extends WorkloadItem and includes a payload property.
*/
interface ItemCreationSuccessData {
    item: ItemLikeV2;
}


export async function initialize(params: InitParams) {
    console.log('🚀 Worker initialization started with params:', params);

    const workloadClient = createWorkloadClient();
    console.log('✅ WorkloadClient created successfully');

    const sampleWorkloadName = process.env.WORKLOAD_NAME;

    workloadClient.action.onAction(async function ({ action, data }) {
        console.log(`🧭 Started action ${action} with data:`, data);
        switch (action) {
            case 'item.onCreationSuccess':
                const { item: createdItem } = data as ItemCreationSuccessData;
                var path = "/item-editor";
                const itemTypeName = createdItem.itemType.substring(createdItem.itemType.lastIndexOf('.') + 1);
                path = `/${itemTypeName}Item-editor`;
                console.log(`Item created successfully, redirecting to ${path}/${createdItem.objectId}`);
                await callPageOpen(workloadClient, sampleWorkloadName, `${path}/${createdItem.objectId}`);
                return Promise.resolve({ succeeded: true });

            case 'item.onCreationFailure': {
                const failureData = data as ItemCreationFailureData;
                await workloadClient.notification.open(
                    {
                        title: 'Error creating item',
                        notificationType: NotificationType.Error,
                        message: `Failed to create item, error code: ${failureData.errorCode}, result code: ${failureData.resultCode}`
                    });
                return;
            }
            case 'getItemSettings': {
                const { item: createdItem } = data as ItemSettingContext;
                const itemTypeName = createdItem.itemType.substring(createdItem.itemType.lastIndexOf('.') + 1);

                return [
                    //Route to about page
                    {
                        name: 'about',
                        displayName: t('Item_About_Label'),
                        workloadSettingLocation: {
                            workloadName: sampleWorkloadName,
                            route: `/${itemTypeName}Item-about/${createdItem.objectId}`,
                        }
                    },
                    //Route to custom settings page
                    {
                        name: 'customItemSettings',
                        displayName: t('Item_Settings_Label'),
                        icon: {
                            name: 'apps_20_regular',
                        },
                        workloadSettingLocation: {
                            workloadName: sampleWorkloadName,
                            route: `/${itemTypeName}Item-settings/${createdItem.objectId}`,
                        }
                    }
                ];
            }
            case 'playground.sampleAction': {
                return callNotificationOpen(
                    workloadClient,
                    'Action executed',
                    'Action executed via API',
                    NotificationType.Success,
                    NotificationToastDuration.Medium);
            }
            default:
                throw new Error('Unknown action received');
        }
    });
}
