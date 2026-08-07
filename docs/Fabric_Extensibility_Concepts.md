# Microsoft Fabric Extensibility — Conceptual Overview

This document explains the core concepts of the Microsoft Fabric Extensibility Toolkit: what Fabric workloads and items are, how they are structured, how users interact with them, and what the toolkit provides to build them. It is intended as a foundation for teams preparing to build their own Fabric extensions.

---

## Table of Contents

1. [Microsoft Fabric — The Platform](#1-microsoft-fabric--the-platform)
2. [The Extensibility Model](#2-the-extensibility-model)
3. [Workloads](#3-workloads)
4. [Items](#4-items)
5. [How Items Work — The Editor Model](#5-how-items-work--the-editor-model)
6. [The Manifest System](#6-the-manifest-system)
7. [The Client SDK](#7-the-client-sdk)
8. [Working with Fabric Data](#8-working-with-fabric-data)
9. [The Development Workflow](#9-the-development-workflow)
10. [Putting It Together — Path to Your First Workload](#10-putting-it-together--path-to-your-first-workload)

---

## 1. Microsoft Fabric — The Platform

Microsoft Fabric is a unified analytics platform that brings together a wide range of data and analytics capabilities — data engineering, data warehousing, real-time analytics, business intelligence, and more — into a single, integrated environment. Users work within Fabric **workspaces**, and within those workspaces they create and interact with **items**.

Items are the fundamental units of Fabric: a Lakehouse is an item, a Notebook is an item, a Data Pipeline is an item. Everything a user creates and works with in Fabric is an item of some type, belonging to some workload.

The extensibility toolkit exists so that external organizations — not just Microsoft — can define their own item types and deliver them as first-class Fabric experiences alongside the built-in ones.

---

## 2. The Extensibility Model

The Fabric Extensibility Toolkit provides a framework for building **custom workloads** — self-contained packages of functionality that plug into Fabric as if they were native. From a user's perspective, a custom workload item looks and feels like any other Fabric item: it appears in the workspace, can be created from the new item menu, has a full editor experience, and integrates with Fabric's navigation, notifications, and data services.

From a developer's perspective, a custom workload is a **React web application** backed by a **manifest** that tells Fabric what to call it, what item types it supports, where to load the UI from, and how to authenticate. The toolkit provides the scaffolding, components, and SDK to wire all of this together.

The high-level architecture looks like this:

```
Fabric Platform
└── Workspace
    └── Item (your custom item type)
        └── Editor UI  ←  Your React app, loaded in an iframe
                          Communicates with Fabric via the Client SDK
```

Your application runs in an iframe inside Fabric. The Client SDK bridges communication between your app and the Fabric host — providing access to item data, workspace context, navigation, notifications, authentication tokens, and data services.

---

## 3. Workloads

A **workload** is the top-level container for your Fabric extension. It is a named, versioned package that:

- Declares one or more **item types** that users can create
- Specifies where the frontend UI is hosted
- Identifies the Azure Entra (AAD) application used for authentication
- Contains display metadata (name, icons, descriptions, help links) for the Fabric Workload Hub

Think of a workload as the equivalent of an app or product. It is what gets registered with a Fabric tenant, either privately for internal use or published publicly to the Workload Hub for external customers.

A workload may contain a single item type or many. You might group related items into a single workload — for example, an "Analytics Suite" workload containing a "Query Builder" item, a "Report Designer" item, and a "Dashboard" item. All share the same authentication configuration and frontend deployment.

### Workload Identity

Every workload has a globally unique name, typically following a reverse-domain convention like `Org.WorkloadName`. This name appears in manifest files and is how Fabric identifies your workload.

### Hosting

A workload frontend can be hosted in two ways:

- **External (cloud-hosted):** Your React app is deployed to a public URL (e.g., an Azure Static Web App or CDN). Fabric loads it from there.
- **Internal (developer mode):** During development, a local DevGateway proxy connects your local dev server to Fabric, so you can iterate without deploying.

---

## 4. Items

An **item** is a single instance of a custom item type that a user creates inside a Fabric workspace. Items are the things users actually work with day-to-day.

### What an Item Contains

Each item has two parts:

**Metadata** — managed by Fabric:
- A unique ID (`itemObjectId`)
- A workspace ID
- A display name (set by the user at creation)
- The item type name (e.g., `Org.MyWorkload.QueryBuilder`)
- Creation and modification timestamps

**Definition** — managed by your workload:
- Your item's actual data, stored in a file called `payload.json`
- Completely custom — you define the schema
- Examples: a saved query, a report configuration, user settings, connection details
- Loaded when the editor opens, saved when the user clicks Save

The definition is the persistent state of your item. It survives across sessions and is scoped to that specific item instance.

### Item Types

Your workload registers **item types** in its manifest. An item type is the template — what a user selects from the "New item" menu. An item is an instance of that type in a workspace. One workload can define multiple item types.

### Item Lifecycle

An item goes through a predictable lifecycle:

1. **Created** — The user creates an item from the workspace. It starts with no definition data.
2. **Opened** — The editor loads, pulling in any saved definition data.
3. **Edited** — The user modifies the item in the editor.
4. **Saved** — The updated definition is persisted back to Fabric.
5. **Reopened** — On next open, the editor loads the saved definition and restores state.
6. **Deleted** — The item and its definition are removed from the workspace.

From the editor's perspective, the flow is: **load item → display state → user edits → save definition → show confirmation**.

---

## 5. How Items Work — The Editor Model

When a user opens an item, Fabric loads your workload's frontend in an iframe and navigates to a route corresponding to that item type and ID. Everything the user sees and does with the item happens within this iframe.

### The Editor Component

Each item type has an **editor component** — the root React component for that item's experience. The editor is responsible for:

- Loading the item's definition from Fabric on mount
- Managing item state as the user interacts
- Saving the definition back to Fabric
- Rendering the appropriate view based on item state

The toolkit's `ItemEditor` component is the required foundation for all editors. It handles layout, view management, and ribbon integration so you focus on your item's logic rather than boilerplate.

### Views

An item editor is not a single static screen — it is a set of **views** that the user navigates between. Common views include:

**Empty View** — Shown the first time a user opens a brand-new item (no saved definition). This is the onboarding experience: explain what the item does, provide a call-to-action to get started.

**Default View** — The main working interface. Shown when the item has data to display or work with. This is where users spend most of their time.

**Detail Views** — Optional secondary pages for focused tasks or drill-downs (e.g., viewing a specific record, configuring a setting). These automatically get a back button in the ribbon and track navigation history.

Views are registered as named components. Navigation between views is programmatic — you call `setCurrentView('view-name')` and the `ItemEditor` handles the transition. The ribbon receives a `viewContext` object that tells it which view is active, enabling it to show or hide actions as appropriate.

### The Ribbon

The **ribbon** is the toolbar at the top of the editor. It contains the primary actions for the item — Save, Run, Settings, etc. The ribbon is a component you provide, and it receives the current view context automatically.

Because the ribbon knows which view is active, you can tailor its actions per view. For example, a Save button might be hidden in a read-only detail view, and a Back button appears automatically when the user drills into a detail view.

### The Layout System

The `ItemEditor` component provides a multi-panel layout out of the box:

- A **left panel** for navigation, settings, or contextual content — resizable and collapsible by the user
- A **center panel** for the primary editing surface
- Each panel scrolls independently

This covers the most common editor layout pattern. For more specialized layouts, you build your own content within the view components.

### Message Bars

Inline notification banners can be conditionally shown based on which view is active — useful for first-run guidance, warnings, or status messages that don't belong in a notification popup.

---

## 6. The Manifest System

Fabric discovers and configures your workload through a set of **manifest files**. These files describe your workload's identity, where it lives, what items it provides, and how it should appear to users. They do not contain code — they are declarative configuration.

### WorkloadManifest.xml

The primary identity document for your workload. It tells Fabric:

- The workload's unique name
- How the frontend is hosted (external URL or internal dev mode)
- The URL where the frontend is deployed
- The Azure Entra App ID used for authentication

This file is the equivalent of a workload's "registration card" with Fabric.

### Product.json

The user-facing configuration file. It controls what users see in the Fabric UI:

- The workload's display name and description
- Icons and branding images
- Which item types users can create, with titles and descriptions
- Links to documentation, support, and privacy policy
- The item cards shown in the "create new item" experience

### Item Manifest Files

Each item type has its own pair of manifest files (XML + JSON). These register the item type with Fabric, associate it with the workload, and define its category (Data, Analytics, etc.).

### Template Placeholders

Manifest files in source code use placeholder variables like `{{WORKLOAD_NAME}}`, `{{FRONTEND_APPID}}`, and `{{FRONTEND_URL}}`. At build time, these are replaced with actual values from environment-specific configuration files (`.env.dev`, `.env.test`, `.env.prod`). This allows a single set of manifest source files to produce configurations for development, staging, and production without manual editing.

### Manifest Packaging

For deployment, manifests are packaged into a NuGet package (`.nupkg`). This package is what gets submitted to Fabric — either to a specific tenant's admin configuration, or to the Workload Hub for broader distribution.

---

## 7. The Client SDK

The **Client SDK** (`@ms-fabric/workload-client`) is the bridge between your React application and the Fabric platform. Everything your editor needs to do with Fabric — loading item data, saving definitions, navigating, showing notifications, accessing authentication tokens — goes through this SDK.

The SDK is initialized once at application startup via a `bootstrap()` call. This provides a `WorkloadClient` instance that is passed down through your component tree and used wherever you need to interact with Fabric.

### What the SDK Provides

**Item operations** — Load an item's metadata and definition; save an updated definition; handle item lifecycle events (initialization, tab deactivation, deletion).

**Navigation** — Navigate to other Fabric resources (workspaces, other items); register callbacks to confirm before the user navigates away from an unsaved item.

**Notifications** — Show Fabric-native success, error, warning, and info notification toasts.

**Authentication** — Obtain OAuth tokens for calling external backend services, handled transparently by the SDK using the configured Azure Entra app.

**Settings** — Open a settings panel for your item (e.g., an "About" page).

**Data services** — Access OneLake storage, workspace metadata, and other Fabric data services.

### Controllers — The Recommended Abstraction

The toolkit provides a **controller layer** on top of the raw SDK calls. Controllers are pre-built helper functions that wrap common SDK operations with appropriate error handling and typing. Rather than calling SDK methods directly (which require knowing the exact API shape), you call controller functions like:

- `getWorkloadItem(client, itemId)` — Load an item with its definition, typed to your definition interface
- `saveWorkloadItem(client, item)` — Save an item's definition
- `callNotificationOpen(client, title, message, type)` — Show a notification
- `navigateToItem(client, item)` — Navigate to an item

This layer keeps your component code clean and prevents coupling to the raw SDK API shape, which may change across toolkit versions.

---

## 8. Working with Fabric Data

One of the primary reasons to build a Fabric workload is to work with data that lives in the Fabric ecosystem. The toolkit provides access to several data services.

### OneLake

OneLake is Fabric's unified data lake — the underlying storage layer shared across all Fabric workloads. Your items can read from and write to OneLake, enabling your custom items to interoperate with Lakehouses, Warehouses, and other Fabric items that store data there.

The toolkit's `OneLakeView` component provides a ready-made UI for browsing OneLake files and tables, selecting them for use in your item, and responding to user selections. For direct API access, `OneLakeStorageClient` provides file operations.

### Item Definitions vs. Live Data

It is important to distinguish between the **item definition** (your item's persistent configuration, stored in `payload.json`) and **live data** your item works with.

The definition stores things like: which Lakehouse this item is connected to, what query it runs, what settings the user configured. The live data — actual rows, files, results — is fetched at runtime from OneLake or other Fabric services, not stored in the definition.

### Other Data Services

The SDK also provides access to Spark job submission (via Spark Livy), workspace metadata, and gateway connections. These are available through their respective clients and controllers in the toolkit.

---

## 9. The Development Workflow

### Overview

Building a Fabric workload involves three primary artifacts that all need to be in sync:

1. **The frontend application** — Your React app
2. **The manifests** — The configuration files that tell Fabric what your workload provides
3. **The Azure Entra app registration** — The identity used for authentication

### Local Development with DevGateway

During development, you do not need to deploy your frontend to a public URL. The toolkit provides a **DevGateway** — a local proxy that securely connects Fabric to your locally running dev server. You run two processes:

- The webpack dev server (your React app, typically on port 60006)
- The DevGateway (handles Fabric's requests to your app)

With both running, you can open a Fabric workspace, create an item of your custom type, and the editor will load from your local machine. Hot module replacement means UI changes appear without restarting.

### Environment Configuration

The toolkit uses three environment configurations — dev, test, and prod — each with its own `.env` file. These control the workload name, frontend URL, Azure app IDs, and other deployment-specific values. The same source code and manifests build to all three environments; only the configuration differs.

### Creating a New Item Type

The toolkit includes a PowerShell script (`CreateNewItem.ps1`) that scaffolds a new item type: it creates the item's folder structure under `app/items/`, generates the manifest files under `Manifest/items/`, and wires up the basics. You then fill in the item's definition schema, views, and ribbon logic.

### Build and Deploy

For deployment:
1. Build the frontend (Webpack produces optimized static files)
2. Package the manifests (a PowerShell script produces a `.nupkg`)
3. Deploy the frontend to your hosting environment (Azure Web App, CDN, etc.)
4. Submit the NuGet package to your Fabric tenant's admin configuration

The complete release build script orchestrates all of these steps.

---

## 10. Putting It Together — Path to Your First Workload

Here is the conceptual sequence for going from zero to a working custom Fabric workload:

**Step 1 — Design your item types.** Decide what kind of custom items you need. What does a user create? What does the editor show? What data does the item store in its definition? Sketch the views: what does the empty state look like, what does the main editing view look like?

**Step 2 — Set up your environment.** Run the setup scripts to configure the workload name, create the Azure Entra app registration, and generate your `.env` files. This is a one-time step per workload.

**Step 3 — Scaffold your item.** Use `CreateNewItem.ps1` to generate the boilerplate. Study `HelloWorldItem` — the reference implementation — to understand the patterns: how the editor loads the definition, how views are registered, how the ribbon wires up, how saves and notifications work.

**Step 4 — Implement your editor.** Define your item's definition interface (the data it persists). Implement your views as React components. Wire up save logic using the controller layer. Use `ItemEditor`, `ItemEditorDefaultView`, and other toolkit components to build on the established patterns rather than starting from scratch.

**Step 5 — Configure your manifests.** Update `Product.json` with your workload's display name, icon, and item cards. The item manifest files link your item type to the workload. Most manifest values are template placeholders handled at build time.

**Step 6 — Test with DevGateway.** Run the dev server and DevGateway, open Fabric, create your item, and iterate.

**Step 7 — Deploy.** Run the build scripts, deploy the frontend, submit the manifest package to your Fabric tenant.

---

## Key Concepts Summary

| Concept | What It Is |
|---|---|
| **Workload** | A named, versioned package that registers one or more item types with Fabric |
| **Item Type** | A template for a kind of item users can create (e.g., "Query Builder") |
| **Item** | A single instance of an item type in a workspace, with metadata and a definition |
| **Definition** | Your item's persistent data (`payload.json`) — completely custom schema |
| **Editor** | The React component (loaded in an iframe) that renders the item's UI |
| **View** | A named screen within the editor (empty, default, detail, etc.) |
| **Ribbon** | The toolbar area; receives view context so actions can adapt to current state |
| **Manifest** | Configuration files (XML/JSON) that tell Fabric about your workload and items |
| **Client SDK** | The bridge between your app and Fabric — item CRUD, navigation, notifications, auth |
| **Controller** | Toolkit-provided helper functions wrapping SDK calls with typing and error handling |
| **DevGateway** | A local proxy that connects Fabric to your local dev server during development |
| **OneLake** | Fabric's unified data lake — accessible from your items via the SDK |
