
# Microsoft Fabric Extensibility Toolkit

Welcome to the Microsoft Fabric Extensibility Toolkit. This repository contains everything you need to start creating a new Extension for Fabric. Beside the source code itself with a HelloWorld Sample it also contains a comprehensive guide that covers everything you need to know to create custom Fabric items for your organization. We're here to assist you every step of the way, so please don't hesitate to reach out with any questions, via "Issues" tab in this Github repository. Happy developing!

[!NOTE]
The Microsoft Fabric Extensibility Toolkit is an evoltuion of the Workload Development Kit. If you are starting from scratch we encourage customers and partners to start building using the new Extensibility Toolkit which is focusing on easy fast development and enables Fabric Fundamentals out of the box.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

## Table of contents

- [Microsoft Fabric Extensibility Toolkit](#microsoft-fabric-extensibility-toolkit)
  - [Trademarks](#trademarks)
  - [Table of contents](#table-of-contents)
- [Introduction](#introduction)
  - [What is Fabric](#what-is-fabric)
  - [What is a Fabric Workloads](#what-is-a-fabric-workload)
  - [What is a Fabric Items](#what-is-a-fabric-item)
  - [What is the Fabric Extensibility Toolkit](#what-is-the-fabric-extensibility-toolkit)
- [Build Your Own Workload](#build-your-own-workload)
  - [Get Started](#get-started)
    - [Prerequisites](#prerequisites)
    - [Setting things up](#setting-things-up)
  - [Implement your custom workload](#start-coding)
  - [Publish your workload](#publish-your-workload)
- [Resources](#resources)

## Introduction

### What is Fabric

Microsoft Fabric is a comprehensive analytics solution designed for enterprise-level applications. This platform encompasses a wide range of services, including data engineering, real-time analytics, and business intelligence, all consolidated within a single, unified framework.

The key advantage of Microsoft Fabric is its integrated approach, that eliminates the need for distinct services from multiple vendors. Users can leverage this platform to streamline their analytics processes, with all services accessible from a single source of truth.

Microsoft Fabric provides integration and simplicity, as well as a transparent and flexible cost management experience. This cost management experience allows users to control expenses effectively by ensuring they only pay for the resources they require.

The Fabric platform is not just a tool, but a strategic asset that simplifies and enhances the analytics capabilities of any enterprise.
More information about Fabric can be found in the [documentation](https://learn.microsoft.com/en-us/fabric/get-started/microsoft-fabric-overview).

### What is a Fabric Workload

In Microsoft Fabric, workloads are a package of different components that are integrated into the Fabric framework. Workloads enhance the usability of your service within the familiar Fabric workspace, eliminating the need to leave the Fabric environment for different services. [Data Factory](https://learn.microsoft.com/en-us/fabric/data-factory/data-factory-overview), [Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/data-warehousing), [Power BI](https://learn.microsoft.com/en-us/power-bi/enterprise/service-premium-what-is) and [Fabric Activator](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/data-activator/activator-introduction) are some of the built-in Fabric workloads.

### What is a Fabric Item

Items in Fabric represent the core functional building blocks that users interact with inside the Fabric platform. Each item encapsulates a specific capability or resource, such as data storage, analytics, or collaboration. Different workloads introduce different types of items, each tailored to a particular use case or service.

Examples in Fabric include:

- **Lakehouse**: Combines the benefits of data lakes and data warehouses, enabling users to store, manage, and analyze large volumes of structured and unstructured data in a single, unified environment.
- **Notebook**: Provides an interactive workspace for data exploration, analysis, and visualization using languages like Python, SQL, or R. Notebooks are ideal for data scientists and analysts to document and execute code alongside rich text and visualizations.
- **Data Warehouse**: Offers scalable, high-performance analytics on large datasets, supporting complex queries and business intelligence workloads.
- **Pipeline**: Automates data movement and transformation across various sources and destinations within Fabric.

These are just a few examples—Fabric supports a wide range of item types, and new custom items can be created using the Extensibility Toolkit to address unique business needs.

### What is the Fabric Extensibility Toolkit

With the Fabric Extensibility Toolkit, you can create your own items and provide them as a workload in Fabric. Customers can create a workload for their own tenant to integrate their Data applications into the platform. Partners can build workloads and publish them into the Fabric Workload Hub which makes them avaialble to all Fabric customers. The Microsoft Fabric Extensibility Toolkit provides you with all the necessary tools and interfaces to embed your data application into Microsoft Fabric.

For more information on what workloads can offer Microsoft partners, and for useful examples, head to our official [Microsoft Fabric Extensibility Toolkit documentation](https://learn.microsoft.com/fabric/extensibilty-toolkit).

You can also learn more about the [Fabric Extensibility Toollkit architecture](./docs/Introduction.md).

## Build Your Own Workload

### Get Started

#### Prerequisites

To run the development enviroment locally you need the following components:

- [Node.js](https://nodejs.org/en/download/)
- [Powershell 7](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell)
- [Dotnet](https://dotnet.microsoft.com/en-us/download) for MacOS please make sure to install the x64 version
- [VSCode](https://code.visualstudio.com/download) or simmilar development enviroment
- [Fabric Tenant](https://app.fabric.microsoft.com/) that you use for development and publishing the Workload later on
- [Fabric Workspace](https://learn.microsoft.com/en-us/fabric/fundamentals/workspaces) that you can use to build your workload
- [Fabric Capacity](https://learn.microsoft.com/en-us/fabric/enterprise/licenses) that is assigned to the workspace you are planning to use
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) (only used for Entra App creation)
- [Entra App](https://entra.microsoft.com/) You either need an existing Entra App you can use that is [configured](./docs/How-To.md) corectly or you need permission to create a new Entra App.

If you don't want to install all dependencies you can also create a devcontainer with the configuration provided in this repository, or create a [Codespace](https://github.com/features/codespaces) in GitHub directly. If you use a codespace please make sure that you select at least an 8 core machine and open the Codspace in VSCode locally. This way everything will work out of the box if you follow the [Setup Guide](./docs/SetupGuide.md).

#### Project structure

Use the [Project structure](./PROJECT_STRUCTURE.md) to get a better understanding about Extensibility projects are structured and wher you can find and change it to your needs.

#### Setting things up

To set things up follow the [Setup Guide](./PROJECT_SETUP.md).

### Start coding

After you have completed the setup steps you are all set to start adopting this workload sample to your needs.

Be sure to look at [Introduction](./docs/Introduction.md) and use our [how to guide](./docs/How-To.md) for the Extensibility Toolkit.

### Publish your workload

After your workload is finished you can publish it to your own thenant in the Fabric Admin portal. Such organizational Workloads are not validated by Microsoft, but you might still want to follow our best practices and desing guidelines.  

Partners that are interesed to publish the workload to all Fabric customers can do this over the Fabric Admin portal as well. For such workloads Microsoft has defined [validation requirements](https://learn.microsoft.com/fabric/extensibility-toolkit/publish-workload-requirements).

## Resources

Here are some of the resources included and referenced in this reposotory. These documents provide additional information and can serve as a reference:

- [Quickstart Guide](/docs/Setup.md)
- [OneLake](https://learn.microsoft.com/fabric/onelake/onelake-overview)
- [One Lake APIs](https://learn.microsoft.com/fabric/onelake/onelake-access-api)