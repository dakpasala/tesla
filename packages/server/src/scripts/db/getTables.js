import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('\n==============================');
    console.log('DATABASE TABLE CONTENTS');
    console.log('==============================\n');

    const tablesResult = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME;
    `);

    const tables = tablesResult.recordset;

    for (const { TABLE_SCHEMA, TABLE_NAME } of tables) {
      console.log(`\n===== ${TABLE_SCHEMA}.${TABLE_NAME} =====`);

      const result = await pool.request().query(`
        SELECT * FROM ${TABLE_SCHEMA}.${TABLE_NAME};
      `);

      if (result.recordset.length === 0) {
        console.log('(empty)');
      } else {
        console.table(result.recordset);
      }
    }

    console.log('\n==============================');
    console.log('TABLE RELATIONSHIPS');
    console.log('==============================\n');

    const relationshipsResult = await pool.request().query(`
      SELECT
        fk.name AS foreign_key,
        parent.name AS parent_table,
        parent_col.name AS parent_column,
        referenced.name AS referenced_table,
        referenced_col.name AS referenced_column
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc
        ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables parent
        ON fkc.parent_object_id = parent.object_id
      JOIN sys.columns parent_col
        ON parent.object_id = parent_col.object_id
        AND fkc.parent_column_id = parent_col.column_id
      JOIN sys.tables referenced
        ON fkc.referenced_object_id = referenced.object_id
      JOIN sys.columns referenced_col
        ON referenced.object_id = referenced_col.object_id
        AND fkc.referenced_column_id = referenced_col.column_id
      ORDER BY parent.name;
    `);

    if (relationshipsResult.recordset.length === 0) {
      console.log('No foreign key relationships found.');
    } else {
      relationshipsResult.recordset.forEach(rel => {
        console.log(
          `${rel.parent_table}.${rel.parent_column} → ${rel.referenced_table}.${rel.referenced_column}`
        );
      });
    }

    await sql.close();
  } catch (err) {
    console.error('Error printing DB snapshot:', err);
    await sql.close();
  }
}

run();
