import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { stdout: tablesOutput } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const tables: string[] = [];
    const lines = tablesOutput.split('\n');
    
    for (const line of lines) {
      // Look for lines that contain table information (not header or separator)
      if (line.includes('|') && !line.includes('Schema') && !line.includes('----')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          const tableName = parts[1]; // Table name is in the second column
          if (tableName && tableName !== 'Name' && !tableName.includes('_seq')) {
            tables.push(tableName);
          }
        }
      }
    }
    
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error getting tables:', error);
    return NextResponse.json({ tables: [] });
  }
} 