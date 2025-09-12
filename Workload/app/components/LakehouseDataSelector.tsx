import React, { useState, useEffect } from "react";
import { 
  Stack, 
  Dropdown, 
  IDropdownOption, 
  PrimaryButton, 
  Text, 
  MessageBar, 
  MessageBarType,
  DetailsList,
  IColumn,
  SelectionMode,
  Spinner,
  SpinnerSize,
  IStackTokens
} from "@fluentui/react";
import { LakehouseDataService, LakehouseTable, LakehouseDataResult } from "../services/LakehouseDataService";
import "./LakehouseDataSelector.css";

interface LakehouseDataSelectorProps {
  onDataSelected: (data: LakehouseDataResult) => void;
  onDataLoading: (isLoading: boolean) => void;
}

const stackTokens: IStackTokens = { childrenGap: 15 };

export function LakehouseDataSelector({ onDataSelected, onDataLoading }: LakehouseDataSelectorProps) {
  const [availableTables, setAvailableTables] = useState<LakehouseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | undefined>();
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [previewData, setPreviewData] = useState<LakehouseDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lakehouseService = LakehouseDataService.getInstance();

  useEffect(() => {
    loadAvailableTables();
  }, []);

  const loadAvailableTables = async () => {
    setIsLoadingTables(true);
    setError(null);
    
    try {
      const tables = await lakehouseService.getTables();
      setAvailableTables(tables);
    } catch (err) {
      setError('Failed to load available tables from lakehouse');
      console.error('Error loading tables:', err);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleTableSelection = async (option?: IDropdownOption) => {
    if (!option) return;
    
    setSelectedTable(option.key as string);
    setError(null);
    
    // Load preview data
    await loadPreviewData(option.key as string);
  };

  const loadPreviewData = async (tableName: string) => {
    setIsLoadingData(true);
    onDataLoading(true);
    
    try {
      const result = await lakehouseService.queryData({
        tableName,
        limit: 10 // Preview with 10 rows
      });
      
      setPreviewData(result);
    } catch (err) {
      setError(`Failed to load preview data for table: ${tableName}`);
      console.error('Error loading preview data:', err);
    } finally {
      setIsLoadingData(false);
      onDataLoading(false);
    }
  };

  const handleLoadFullData = async () => {
    if (!selectedTable) return;
    
    setIsLoadingData(true);
    onDataLoading(true);
    setError(null);
    
    try {
      const result = await lakehouseService.queryData({
        tableName: selectedTable,
        limit: 1000 // Load more data for Excel
      });
      
      onDataSelected(result);
    } catch (err) {
      setError(`Failed to load data for table: ${selectedTable}`);
      console.error('Error loading full data:', err);
    } finally {
      setIsLoadingData(false);
      onDataLoading(false);
    }
  };

  const tableOptions: IDropdownOption[] = availableTables.map(table => ({
    key: table.name,
    text: table.displayName,
    data: table
  }));

  const selectedTableInfo = availableTables.find(t => t.name === selectedTable);

  // Prepare preview data for DetailsList
  const previewColumns: IColumn[] = previewData?.columns.map((col: any, index: number) => ({
    key: col.name,
    name: col.name,
    fieldName: col.name,
    minWidth: 100,
    maxWidth: 200,
    isResizable: true,
    data: col
  })) || [];

  const previewItems = previewData?.data.map((row: any[], rowIndex: number) => {
    const item: any = { key: rowIndex };
    row.forEach((value: any, colIndex: number) => {
      const columnName = previewData.columns[colIndex].name;
      item[columnName] = value;
    });
    return item;
  }) || [];

  return (
    <Stack tokens={stackTokens}>
      <div className="lakehouse-data-card">
        <Stack tokens={{ childrenGap: 12 }}>
          <Text variant="xLarge" className="lakehouse-title">
            📊 Lakehouse Data Explorer
          </Text>
          
          <Text variant="medium">
            Select a table from your Microsoft Fabric Lakehouse to explore and export to Excel for the Web.
          </Text>

          {error && (
            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
              {error}
            </MessageBar>
          )}

          <Stack horizontal tokens={{ childrenGap: 15 }} verticalAlign="end">
            <Stack styles={{ root: { minWidth: 300 } }}>
              <Dropdown
                label="Select Lakehouse Table"
                options={tableOptions}
                selectedKey={selectedTable}
                onChange={(_, option) => handleTableSelection(option)}
                placeholder={isLoadingTables ? "Loading tables..." : "Choose a table"}
                disabled={isLoadingTables}
              />
            </Stack>
            
            {isLoadingTables && (
              <Spinner size={SpinnerSize.small} label="Loading tables..." />
            )}
          </Stack>

          {selectedTableInfo && (
            <div className="table-info-card">
              <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="mediumPlus" className="table-info-title">
                  📋 {selectedTableInfo.displayName}
                </Text>
                
                {selectedTableInfo.description && (
                  <Text variant="small" className="table-description">
                    {selectedTableInfo.description}
                  </Text>
                )}
                
                <Stack horizontal tokens={{ childrenGap: 20 }}>
                  <Text variant="small">
                    <strong>Rows:</strong> {selectedTableInfo.rowCount?.toLocaleString() || 'Unknown'}
                  </Text>
                  <Text variant="small">
                    <strong>Columns:</strong> {selectedTableInfo.schema.length}
                  </Text>
                  {selectedTableInfo.lastModified && (
                    <Text variant="small">
                      <strong>Last Modified:</strong> {selectedTableInfo.lastModified.toLocaleDateString()}
                    </Text>
                  )}
                </Stack>
              </Stack>
            </div>
          )}
        </Stack>
      </div>

      {previewData && (
        <div className="lakehouse-data-card">
          <Stack tokens={{ childrenGap: 12 }}>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
              <Text variant="large" className="preview-title">
                🔍 Data Preview ({previewData.totalRows} rows shown)
              </Text>
              
              <Stack horizontal tokens={{ childrenGap: 10 }}>
                <Text variant="small" className="execution-time">
                  Query executed in {previewData.executionTime}ms
                </Text>
                
                <PrimaryButton
                  text="📈 Open Full Dataset in Excel"
                  onClick={handleLoadFullData}
                  disabled={isLoadingData}
                  iconProps={{ iconName: "ExcelLogo" }}
                  styles={{
                    root: {
                      backgroundColor: '#217346',
                      borderColor: '#217346',
                    }
                  }}
                />
              </Stack>
            </Stack>

            {isLoadingData ? (
              <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
                <Spinner size={SpinnerSize.medium} label="Loading lakehouse data..." />
                <Text variant="medium">Querying {selectedTableInfo?.displayName}...</Text>
              </Stack>
            ) : (
              <div className="data-preview-container">
                <DetailsList
                  items={previewItems}
                  columns={previewColumns}
                  selectionMode={SelectionMode.none}
                  layoutMode={1} // FixedColumns
                  isHeaderVisible={true}
                  styles={{
                    root: {
                      selectors: {
                        '.ms-DetailsHeader': {
                          backgroundColor: '#f3f2f1',
                          borderBottom: '1px solid #e1dfdd'
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
            
            <MessageBar messageBarType={MessageBarType.info}>
              💡 <strong>Tip:</strong> This preview shows the first 10 rows. Click "Open Full Dataset in Excel" to work with up to 1,000 rows in Excel for the Web with full editing capabilities.
            </MessageBar>
          </Stack>
        </div>
      )}
    </Stack>
  );
}