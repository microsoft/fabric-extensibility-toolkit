
# Getting Started with the Extensibility Toolkit

In this section we will present all of the necessary steps to get started with the Fabric Extensibility Toolkit.

Getting started involves 5 Steps that are all outlined in this document below.

1. Clone this repository to your local machine
2. [Setup the development environment](#setup-the-development-environment)
3. [Start the development environment](#start-the-development-environment)
4. [Test the workload](#test-the-workload)
5. [Start coding](#start-coding)

## Setup the development environment

To make it easy as possible we have created a [Setup.ps1](../scripts/Setup/Setup.ps1) script that will automate all the work for you.  The setup script can be started without any parameters. All necessary information will be asked in the commandline. If you want to automate the process you can also parse the values as parameters to the script. An example to parse the WorkloadName (unique identifier of the workload in Fabric) is shown below.

```powershell
# Navigate to the setup scripts directory
cd scripts\Setup

# Run the setup script
.\Setup.ps1 -WorkloadName "Org.MyWorkload"
```

* Make sure you have Powershell 7 installed and configured in the environment you run the script.
* Make sure that the Powershell execution policy is set to Unrestricted and the files are unblocked if you are getting asked if the ps files should be started.
* If you want to use an existing Entra application, make sure to configure the SPA redirect URIs in the application's manifest as described in the [documentation](https://learn.microsoft.com/fabric/extensibility-toolkit/setup-manual).
* Follow the guidance the Script provides to get everything setup
* The WorkloadName needs to follow a specific pattern [Organization].[WorkloadName]. For Development and Organizational workloads  use Org.[YourWorkloadName]. You can find more information on how Workload names work for publishing in the [public documentation](https://learn.microsoft.com/fabric/extensibility-toolkit/publishing-overview).

For Mac and Linux use pwsh to start the powershell Scripts:

```bash
# Navigate to setup scripts directory
cd scripts/Setup

# Run the setup script
pwsh ./Setup.ps1 -WorkloadName "Org.MyWorkload" 
```

After the script finished successfully your environment is configured and ready to go. The Script will provide you with additional information on the next steps to see your Workload light up in Fabric.

The Setup script can be run several times. If values are already present you will be asked if they should be overwritten. If you want to overwrite everything please use the Force parameter.

## Start the development environment

After you have completed all of the above steps, you are ready to test the workload.
Start the workload in development mode:

1. Navigate to the [Run](../scripts/Run) scripts directory 
2. Run [StartDevServer.ps1](../scripts/Run/StartDevServer.ps1) to start the local Development environment which includes the Frontend and APIs
3. Run [StartDevGateway.ps1](../scripts/Run/StartDevGateway.ps1) to register your local development instance with Fabric Backend
4. Navigate to the Fabric portal. Head to the Admin Portal settings and enable the following tenant settings
5. Navigate to the Fabric Developer Settings and enable the Fabric Developer Mode

You are ready to create your first Hello World Item in Fabric.

## Test the workload

To access your workload follow the steps below:

1. Navigate to `https://app.fabric.microsoft.com/workloadhub/detail/<WORKLOAD_NAME>.Product?experience=fabric-developer`. The workload is called "Hello Fabric!" if you have not changed it.
2. Click the Hello World item type on the left
3. Select the development Workspace you have configured before in the dialog to create the item
4. The editor opens and the item is ready for use

Congratulations! You have created your first item from your development environment

## Start coding

Now that you are all set you can start following your own item ideas. For this you can either change the [HelloWorldItemEditor.tsx](../Workload/app/items/HelloWorldItem/HelloWorldItemEditor.tsx) or you can use the [CreateNewItem.ps1](../scripts/Setup/CreateNewItem.ps1) to create a new item.

Happy coding! 🚀
