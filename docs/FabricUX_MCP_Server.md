# Fabric UX System MCP Server Setup

This document describes how to set up and use the Fabric UX System MCP (Model Context Protocol) server to enhance GitHub Copilot with expert Fabric UX knowledge.

## What is the Fabric UX System MCP Server?

The [mcp-fabric-ux-system](https://github.com/Falkicon/mcp-fabric-ux-system) is an MCP server that provides GitHub Copilot with access to comprehensive Fabric UX documentation, including:
- Component documentation and best practices
- Design patterns and guidelines
- Implementation examples
- API references
- Accessibility standards

It uses RAG (Retrieval-Augmented Generation) with semantic search to provide relevant, context-aware answers to your Fabric development questions.

## UX Style Alignment Requirement

**IMPORTANT:** All UX styles in this project must be aligned with the official [Fabric UX System Styleguide](https://react.fluentui.dev/). This includes:

- **Design Tokens:** Use Fabric design tokens (`var(--color*)`, `var(--spacing*)`, `var(--fontSize*)`) instead of hardcoded values
- **Component Patterns:** Follow Fluent UI v9 component API and patterns
- **Accessibility:** Comply with WCAG 2.1 AA standards as defined in Fabric UX guidelines
- **Layout Patterns:** Use Fabric-approved layout structures and spacing systems
- **Typography:** Follow Fabric typography scale and font tokens
- **Color Usage:** Use Fabric semantic color tokens for consistent theming

**The MCP server is your primary tool for ensuring UX alignment.** Before implementing any UI component or styling, query the MCP server to verify you're following the correct Fabric UX patterns and using the appropriate design tokens.

## Prerequisites

- Docker Desktop installed and running
- Node.js v18 or later
- Git

## Setup Instructions

### 1. Clone the MCP Server Repository

```powershell
# Navigate to your preferred location for MCP servers
cd C:\Users\$env:USERNAME\mcp-servers

# Clone the repository
git clone https://github.com/Falkicon/mcp-fabric-ux-system.git
cd mcp-fabric-ux-system
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Configure Environment (Optional)

```powershell
# Copy the example environment file
copy .env.example .env

# Edit .env if you need custom paths (default settings usually work)
```

### 4. Start ChromaDB Server with Docker

```powershell
# Pull the ChromaDB image
docker pull chromadb/chroma

# Create a directory for persistent data
mkdir C:\Users\$env:USERNAME\chroma-data

# Run ChromaDB container
docker run -d -p 8000:8000 -v C:\Users\$env:USERNAME\chroma-data:/chroma/chroma --name chroma_server chromadb/chroma

# Verify it's running
docker ps
```

> **Note:** To stop the container later: `docker stop chroma_server`  
> To restart it: `docker start chroma_server`

### 5. Index the Documentation

This step processes all Fabric UX documentation and creates a searchable vector database:

```powershell
npm run index-docs
```

This will:
- Download the embedding model (first time only)
- Process all documentation files
- Generate embeddings
- Store them in ChromaDB

**This may take several minutes on first run.**

### 6. Build the Server

```powershell
npm run build
```

### 7. Configure in Cursor/GitHub Copilot

Add the following to your MCP configuration file:

**For Cursor:** `C:\Users\<username>\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "mcp_fabricux": {
      "displayName": "Fabric UX System",
      "command": "npm",
      "args": [
        "run",
        "start:stdio",
        "--prefix",
        "C:\\Users\\YOUR_USERNAME\\mcp-servers\\mcp-fabric-ux-system"
      ],
      "cwd": "C:\\Users\\YOUR_USERNAME\\mcp-servers\\mcp-fabric-ux-system",
      "env": {
        "NODE_ENV": "production"
      },
      "enabled": true
    }
  }
}
```

**Important:** Replace `YOUR_USERNAME` with your actual Windows username. Use double backslashes (`\\`) in paths.

### 8. Restart Your Editor

Restart Cursor or VS Code to activate the MCP server.

## Using the MCP Server

Once configured, you can ask GitHub Copilot questions about Fabric UX, and it will automatically use the `askFabricDocs` tool to retrieve relevant documentation:

### Example Queries for UX Alignment

**Before implementing any UI component or styling:**

- "What design tokens should I use for spacing in Fabric UX?"
- "How do I properly implement a Button component with Fabric UX v9?"
- "What are the correct color tokens for backgrounds in Fabric UX?"
- "Show me the accessibility requirements for Toolbar components"
- "What is the proper way to implement a form field in Fabric UX?"
- "How do I apply responsive design patterns in Fabric UX?"
- "What typography tokens are available in Fabric UX?"
- "How should I implement hover and focus states following Fabric guidelines?"

**General Fabric UX queries:**

- "How do I use the Button component in Fabric UX?"
- "What are the accessibility requirements for Fabric components?"
- "Show me an example of implementing a Toolbar in Fabric UX"
- "What design tokens are available for spacing?"
- "How do I apply theming to Fabric components?"

### Available MCP Tool

- **`askFabricDocs`**
  - **Description:** Queries the indexed Fabric UX documentation using semantic search
  - **Arguments:**
    - `query` (string, required): Your natural language question
    - `resultCount` (number, optional, default: 8): Number of relevant chunks to return

## Maintenance

### Updating Documentation

If the Fabric UX documentation is updated:

1. Ensure ChromaDB is running
2. Pull latest changes: `git pull`
3. Re-index: `npm run index-docs`
4. Restart the MCP server (restart your editor)

### Managing ChromaDB Container

```powershell
# Check if running
docker ps

# Stop the container
docker stop chroma_server

# Start the container
docker start chroma_server

# View logs
docker logs chroma_server

# Remove container (data persists in volume)
docker rm chroma_server
```

## Troubleshooting

### MCP Server Not Appearing in Copilot

1. Verify ChromaDB is running: `docker ps`
2. Check the MCP configuration file path
3. Ensure paths use double backslashes on Windows
4. Restart your editor
5. Check the Output panel in VS Code for MCP errors

### Indexing Fails

1. Ensure ChromaDB container is running
2. Verify port 8000 is not blocked
3. Check Docker Desktop is running
4. Try restarting the ChromaDB container

### Slow Responses

- The first query may be slower as models load
- Reduce `resultCount` for faster responses
- Ensure your machine has adequate resources

## Development Mode

For testing or development:

```powershell
# Start in development mode (requires ChromaDB running)
npm run dev
```

## Additional Resources

- [MCP Server Repository](https://github.com/Falkicon/mcp-fabric-ux-system)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [ChromaDB Documentation](https://docs.trychroma.com/)

## Benefits for This Project

Using this MCP server enhances your Fabric Extensibility Toolkit development:

✅ **UX Style Alignment:** Ensures all styles follow official Fabric UX System guidelines  
✅ **Design Token Validation:** Verify you're using correct Fabric design tokens (`var(--color*)`, `var(--spacing*)`, etc.)  
✅ **Component Pattern Compliance:** Get accurate Fluent UI v9 component API and usage patterns  
✅ **Instant access** to Fabric UX best practices  
✅ **Consistent component usage** across your workload  
✅ **Faster development** with context-aware suggestions  
✅ **Accessibility compliance** guidance (WCAG 2.1 AA)  
✅ **Design system alignment** with official Fabric UX patterns  

## Development Workflow with MCP Server

When developing UI components or styling:

1. **Before coding:** Query the MCP server for Fabric UX patterns and design tokens
2. **During implementation:** Use the MCP server to validate component usage and styling approaches
3. **Code review:** Verify all styles use Fabric design tokens and follow guidelines
4. **Testing:** Ensure accessibility compliance using MCP-provided standards

**Example Workflow:**
```
Developer: "What design tokens should I use for padding in a card component?"
MCP Response: [Provides var(--spacingVerticalM), var(--spacingHorizontalL), etc.]

Developer: [Implements with correct tokens]

Developer: "How do I make this component accessible?"
MCP Response: [Provides ARIA attributes, keyboard navigation, focus management]
```

This ensures every UI element in the Fabric Extensibility Toolkit is aligned with the official Fabric UX System styleguide.  
