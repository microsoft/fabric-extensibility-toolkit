/**
 * Lakehouse Data Service
 * Handles data retrieval from Microsoft Fabric Lakehouse
 */

export interface LakehouseTable {
  name: string;
  displayName: string;
  description?: string;
  schema: LakehouseColumn[];
  rowCount?: number;
  lastModified?: Date;
}

export interface LakehouseColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  description?: string;
}

export interface LakehouseDataQuery {
  tableName: string;
  columns?: string[];
  filter?: string;
  limit?: number;
  orderBy?: string;
}

export interface LakehouseDataResult {
  columns: LakehouseColumn[];
  data: any[][];
  totalRows: number;
  executionTime: number;
  query: LakehouseDataQuery;
}

export class LakehouseDataService {
  private static instance: LakehouseDataService;
  // private workloadClient: any; // Will be injected from Fabric client when implementing real API calls

  public static getInstance(): LakehouseDataService {
    if (!LakehouseDataService.instance) {
      LakehouseDataService.instance = new LakehouseDataService();
    }
    return LakehouseDataService.instance;
  }

  /**
   * Initialize the service with Fabric workload client
   * Currently disabled for demo - will be enabled when implementing real API calls
   */
  // public initialize(workloadClient: any): void {
  //   this.workloadClient = workloadClient;
  // }

  /**
   * Get available tables from the current lakehouse
   */
  public async getTables(): Promise<LakehouseTable[]> {
    try {
      // In a real implementation, this would call the Fabric Lakehouse API
      // For demo purposes, we'll return sample table metadata
      
      const sampleTables: LakehouseTable[] = [
        {
          name: "sales_data",
          displayName: "Sales Data",
          description: "Monthly sales performance data across regions",
          rowCount: 15420,
          lastModified: new Date('2024-10-25'),
          schema: [
            { name: "SaleID", dataType: "string", nullable: false, description: "Unique sale identifier" },
            { name: "Date", dataType: "datetime", nullable: false, description: "Sale date" },
            { name: "Region", dataType: "string", nullable: false, description: "Sales region" },
            { name: "Product", dataType: "string", nullable: false, description: "Product name" },
            { name: "Revenue", dataType: "decimal", nullable: false, description: "Sale amount in USD" },
            { name: "Units", dataType: "int", nullable: false, description: "Number of units sold" },
            { name: "Customer", dataType: "string", nullable: true, description: "Customer name" },
            { name: "SalesRep", dataType: "string", nullable: true, description: "Sales representative" }
          ]
        },
        {
          name: "customer_analytics",
          displayName: "Customer Analytics",
          description: "Customer behavior and demographic analysis",
          rowCount: 8930,
          lastModified: new Date('2024-10-24'),
          schema: [
            { name: "CustomerID", dataType: "string", nullable: false, description: "Unique customer ID" },
            { name: "Age", dataType: "int", nullable: true, description: "Customer age" },
            { name: "Location", dataType: "string", nullable: false, description: "Customer location" },
            { name: "Segment", dataType: "string", nullable: false, description: "Customer segment" },
            { name: "LifetimeValue", dataType: "decimal", nullable: false, description: "Customer lifetime value" },
            { name: "LastPurchase", dataType: "datetime", nullable: true, description: "Last purchase date" },
            { name: "PreferredChannel", dataType: "string", nullable: true, description: "Preferred shopping channel" }
          ]
        },
        {
          name: "inventory_tracking",
          displayName: "Inventory Tracking",
          description: "Real-time inventory levels and movement",
          rowCount: 5670,
          lastModified: new Date('2024-10-26'),
          schema: [
            { name: "ProductID", dataType: "string", nullable: false, description: "Product identifier" },
            { name: "ProductName", dataType: "string", nullable: false, description: "Product name" },
            { name: "Category", dataType: "string", nullable: false, description: "Product category" },
            { name: "CurrentStock", dataType: "int", nullable: false, description: "Current stock level" },
            { name: "ReorderPoint", dataType: "int", nullable: false, description: "Reorder threshold" },
            { name: "LastRestocked", dataType: "datetime", nullable: true, description: "Last restock date" },
            { name: "Warehouse", dataType: "string", nullable: false, description: "Warehouse location" },
            { name: "UnitCost", dataType: "decimal", nullable: false, description: "Unit cost" }
          ]
        }
      ];

      return sampleTables;
    } catch (error) {
      console.error('Failed to fetch tables from lakehouse:', error);
      throw new Error('Unable to retrieve lakehouse tables');
    }
  }

  /**
   * Execute a query against the lakehouse and return data
   */
  public async queryData(query: LakehouseDataQuery): Promise<LakehouseDataResult> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would execute SQL/KQL against the lakehouse
      // For demo purposes, we'll generate realistic sample data based on the table
      
      const sampleData = await this.generateSampleData(query);
      const executionTime = Date.now() - startTime;

      return {
        columns: sampleData.columns,
        data: sampleData.rows,
        totalRows: sampleData.rows.length,
        executionTime,
        query
      };
    } catch (error) {
      console.error('Failed to query lakehouse data:', error);
      throw new Error('Data query execution failed');
    }
  }

  /**
   * Generate realistic sample data based on table schema
   */
  private async generateSampleData(query: LakehouseDataQuery): Promise<{ columns: LakehouseColumn[], rows: any[][] }> {
    const tables = await this.getTables();
    const table = tables.find(t => t.name === query.tableName);
    
    if (!table) {
      throw new Error(`Table ${query.tableName} not found`);
    }

    const limit = query.limit || 50;
    const columns = query.columns ? 
      table.schema.filter(col => query.columns!.includes(col.name)) : 
      table.schema;

    // Generate realistic sample data based on table type
    const rows: any[][] = [];
    
    for (let i = 0; i < limit; i++) {
      const row: any[] = [];
      
      for (const column of columns) {
        row.push(this.generateColumnValue(column, i, query.tableName));
      }
      
      rows.push(row);
    }

    return { columns, rows };
  }

  /**
   * Generate realistic values for different column types
   */
  private generateColumnValue(column: LakehouseColumn, rowIndex: number, tableName: string): any {
    const { name, dataType } = column;

    // Generate values based on table and column context
    if (tableName === 'sales_data') {
      switch (name) {
        case 'SaleID': return `SALE-${String(rowIndex + 1).padStart(6, '0')}`;
        case 'Date': return new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
        case 'Region': return ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'][Math.floor(Math.random() * 5)];
        case 'Product': return ['Surface Laptop', 'Office 365', 'Azure Services', 'Teams Premium', 'Power BI Pro'][Math.floor(Math.random() * 5)];
        case 'Revenue': return (Math.random() * 5000 + 100).toFixed(2);
        case 'Units': return Math.floor(Math.random() * 20) + 1;
        case 'Customer': return ['Contoso Corp', 'Fabrikam Inc', 'Adventure Works', 'Northwind Traders', 'Tailspin Toys'][Math.floor(Math.random() * 5)];
        case 'SalesRep': return ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez', 'David Kim'][Math.floor(Math.random() * 5)];
      }
    } else if (tableName === 'customer_analytics') {
      switch (name) {
        case 'CustomerID': return `CUST-${String(rowIndex + 1).padStart(5, '0')}`;
        case 'Age': return Math.floor(Math.random() * 50) + 25;
        case 'Location': return ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto'][Math.floor(Math.random() * 5)];
        case 'Segment': return ['Enterprise', 'SMB', 'Consumer', 'Education', 'Government'][Math.floor(Math.random() * 5)];
        case 'LifetimeValue': return (Math.random() * 50000 + 1000).toFixed(2);
        case 'LastPurchase': return new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
        case 'PreferredChannel': return ['Online', 'Retail', 'Partner', 'Direct Sales'][Math.floor(Math.random() * 4)];
      }
    } else if (tableName === 'inventory_tracking') {
      switch (name) {
        case 'ProductID': return `PRD-${String(rowIndex + 1).padStart(4, '0')}`;
        case 'ProductName': return ['Wireless Mouse', 'Bluetooth Keyboard', 'USB Drive', 'Monitor Stand', 'Webcam'][Math.floor(Math.random() * 5)];
        case 'Category': return ['Electronics', 'Accessories', 'Storage', 'Peripherals'][Math.floor(Math.random() * 4)];
        case 'CurrentStock': return Math.floor(Math.random() * 1000) + 50;
        case 'ReorderPoint': return Math.floor(Math.random() * 100) + 25;
        case 'LastRestocked': return new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
        case 'Warehouse': return ['Seattle', 'Dallas', 'Atlanta', 'Phoenix'][Math.floor(Math.random() * 4)];
        case 'UnitCost': return (Math.random() * 200 + 10).toFixed(2);
      }
    }

    // Default value generation based on data type
    switch (dataType) {
      case 'string': return `Value_${rowIndex + 1}`;
      case 'int': return Math.floor(Math.random() * 1000);
      case 'decimal': return (Math.random() * 1000).toFixed(2);
      case 'datetime': return new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
      default: return `Data_${rowIndex + 1}`;
    }
  }

  /**
   * Format data for Excel consumption
   */
  public formatForExcel(result: LakehouseDataResult): { config: any, data: any[][] } {
    // Create header row
    const headers = result.columns.map(col => col.name);
    
    // Combine headers with data
    const excelData = [headers, ...result.data];

    return {
      config: {
        promoteHeaders: true,
        adjustColumnNames: true,
        tableStyle: 'TableStyleMedium9', // Professional blue style
        autoFitColumns: true
      },
      data: excelData
    };
  }
}