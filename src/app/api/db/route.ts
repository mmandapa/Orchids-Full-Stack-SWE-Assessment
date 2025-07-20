import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  
  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
  }

  try {
    // Get real data from the database with proper case handling
    console.log(`Fetching data from table: "${table}"`);
    const { stdout: result } = await execAsync(`psql -d spotify_clone -c 'SELECT * FROM "${table}" LIMIT 10;'`);
    console.log(`Raw result length:`, result.length);
    
    // Parse the PostgreSQL output
    const lines = result.split('\n');
    const data: any[] = [];
    
    // Find the header and data sections
    let headerLine = '';
    let dataRows: string[] = [];
    let inDataSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Look for the separator line (contains dashes)
      if (line.includes('----')) {
        // Header is the line before the separator
        if (i > 0) {
          headerLine = lines[i - 1];
        }
        inDataSection = true;
        continue;
      }
      
      // If we're in the data section, collect data rows
      if (inDataSection && line.trim() && !line.includes('(') && !line.includes('row')) {
        dataRows.push(line.trim());
      }
    }
    
    console.log(`Header: ${headerLine}`);
    console.log(`Data rows: ${dataRows.length}`);
    
    if (headerLine && dataRows.length > 0) {
      // Parse column names
      const columns = headerLine.split('|').map(c => c.trim()).filter(c => c);
      console.log(`Columns:`, columns);
      
      // Parse data rows
      for (const rowLine of dataRows) {
        const values = rowLine.split('|').map(v => v.trim());
        const row: any = {};
        
        for (let i = 0; i < columns.length && i < values.length; i++) {
          row[columns[i]] = values[i];
        }
        
        if (Object.keys(row).length > 0) {
          data.push(row);
        }
      }
    }
    
    console.log(`Parsed data:`, data);
    return NextResponse.json({ data });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, songId } = body;
    
    if (!userId || !songId) {
      return NextResponse.json({ error: 'userId and songId are required' }, { status: 400 });
    }
    
    // For now, just return success
    // In a real implementation, this would insert into the database
    return NextResponse.json({ message: 'Recently played song added successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}