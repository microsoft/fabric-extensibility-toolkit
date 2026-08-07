# Fabric agent for GitHub Copilot

## Usage

Activate the Fabric AI agent in GitHub Copilot:

```text
@fabric [your question about Microsoft Fabric development]
```

## Examples

### Workload development

```text
@fabric How do I create a new custom item type for document processing?
```

### Authentication

```text
@fabric Show me how to implement OAuth authentication in my workload
```

### Platform integration

```text
@fabric What's the best way to integrate my workload with OneLake for data storage?
```

### Troubleshooting

```text
@fabric My workload authentication is failing, how do I debug this?
```

## Agent capabilities

The Fabric agent provides expert assistance for:

- **Extensibility Toolkit development**: Custom item creation, React/TypeScript patterns, component APIs
- **Platform integration**: OneLake, Power BI, Data Factory integration
- **Security**: Authentication, authorization, and compliance
- **Operations**: Deployment, CI/CD, and troubleshooting
- **Architecture**: Best practices and performance optimization

## Knowledge sources

- Public Microsoft Fabric documentation and APIs
- Platform-agnostic skills in `.ai/skills/` (item development, workload lifecycle)
- Shared references in `.ai/references/` (Fabric platform context, formatting standards)
- Current project structure and conventions
