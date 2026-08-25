export interface SqlExecutor { execute(sql: string, parameters: readonly unknown[]): Promise<{ rowCount: number; rows?: Array<{ action: 'inserted' | 'updated' }> }> }
