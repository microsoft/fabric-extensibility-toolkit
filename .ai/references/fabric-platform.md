# Microsoft Fabric Platform

## Overview

Microsoft Fabric is a unified analytics platform that consolidates data engineering, real-time analytics, business intelligence, and machine learning into a single environment.

Key characteristics:

- **Unified platform**: All analytics capabilities in one place
- **SaaS foundation**: Simplified management with no infrastructure to maintain
- **Open data format**: Delta Lake for data storage
- **Integrated experience**: Seamless workflow across workloads
- **AI-powered**: Copilot integration across all experiences

## Core Workloads

### Data Factory

Data ingestion, transformation, and orchestration. Supports 200+ data connectors, ETL/ELT pipelines, copy activities, dataflows, and pipeline orchestration.

### OneLake

Unified data lake storage. Provides a single source of truth for organizational data using Delta Lake format, with automatic governance and shortcuts to external sources.

### Data Engineering (Lakehouse)

Big data processing with Apache Spark. Combines data lake and warehouse patterns with notebooks, Spark jobs, and Delta tables for ACID transactions.

### Data Warehouse

Enterprise-scale SQL data warehousing. Supports T-SQL queries, columnar storage, automatic scaling, and Power BI integration.

### Databases

Fully managed SQL databases for transactional workloads. ACID-compliant with automatic backup, recovery, and integration with other Fabric workloads.

### Real-Time Intelligence

Streaming data ingestion, processing, and analysis. Includes Event Streams, KQL (Kusto Query Language) for fast analytics, real-time dashboards, and alerting.

### Eventhouse

High-performance analytics database optimized for time-series and log data. Uses KQL with fast ingestion and integration with streaming sources.

### Power BI

Business intelligence and data visualization. Provides interactive reports, dashboards, self-service analytics, mobile access, and embedded analytics.

### Paginated Reports

Pixel-perfect formatted reports for regulatory compliance, invoices, and operational reporting. Supports automated distribution.

### Data Science

Machine learning model development and deployment. Includes MLflow integration, AutoML, model serving, and popular ML framework support.

## Platform Architecture

### Compute

- **Apache Spark**: Distributed computing for big data
- **SQL engine**: Optimized analytical queries
- **KQL engine**: Fast analytics for streaming and log data

### Storage

- **OneLake**: Unified data lake in Delta Lake format
- **Multi-format support**: Parquet, Delta, CSV, JSON

### Security and Governance

- Unified security model across all workloads
- Data loss prevention (DLP)
- Row-level security (RLS)
- Sensitivity labeling and classification (Microsoft Purview)
- Automatic and manual data classification
- Fine-grained access policies
- Comprehensive audit logging
- End-to-end encryption at rest and in transit

### Compliance and Regulatory

- Industry standards: SOC, ISO, GDPR compliance
- Data residency controls
- Automated backup and point-in-time recovery

### Integration Points

- **Microsoft 365**: SharePoint, Teams, Excel
- **Azure**: Native connectivity to all Azure services
- **Power Platform**: Power Apps, Power Automate
- **Dynamics 365**: Business application integration
- **Third-party**: 200+ pre-built connectors, custom connectors
- **Partner solutions**: ISV workloads and extensions
- **Open standards**: Support for open formats and protocols

## AI Integration (Copilot)

### Platform-Wide AI

- Natural language queries across data
- AI-assisted code and query generation
- Automated insight discovery
- AI-powered report and dashboard creation

### Workload-Specific AI

- **Data Factory**: AI-assisted pipeline creation
- **Power BI**: Natural language report generation
- **Data Science**: AutoML and model recommendations
- **SQL**: AI-powered query optimization and suggestions

## Development and Extensibility

### Fabric REST APIs

- Documented at [Microsoft Fabric REST API Specs](https://github.com/microsoft/fabric-rest-api-specs/)
- OpenAPI/Swagger format
- Complete CRUD operations for all Fabric resources
- Entra ID authentication

Key API categories: Core (workspace, capacity, tenant), Data Factory (pipelines, dataflows), Power BI (reports, datasets), Lakehouse, Warehouse, Real-Time Intelligence.

### Client Libraries

- Official SDKs generated from OpenAPI specs (AutoRest)
- .NET, Python, JavaScript, Java support
- Power BI JavaScript API for embedding
- Power BI .NET SDK for programmatic operations

### Extensibility Toolkit

Enables partners and customers to build custom workloads that integrate with Fabric:

- React-based frontend integration
- RESTful backend service integration
- Full Fabric API access
- Single sign-on with Entra ID
- Workspace and capacity integration

### Application Lifecycle Management

- Native Git integration for all artifacts
- Branching, merging, and multi-developer workflows
- Deployment pipelines (dev, test, production)
- Automated CI/CD with rollback capabilities

## Licensing and Capacity

- **Fabric capacity**: Pay-as-you-go or reserved
- **Power BI Premium**: Per-user and per-capacity options
- **Developer trial**: Free trial for development and testing
- **Elastic scaling**: Automatic scaling based on demand
- **Workload isolation**: Separate compute for different workloads

## Community and Learning Resources

- [Microsoft Fabric documentation](https://learn.microsoft.com/en-us/fabric/)
- [Fabric REST API reference](https://learn.microsoft.com/en-us/rest/api/fabric/)
- [Fabric community](https://community.fabric.microsoft.com/)
- [Fabric Ideas portal](https://ideas.fabric.microsoft.com/)
- [GitHub: Fabric REST API specs](https://github.com/microsoft/fabric-rest-api-specs/)




