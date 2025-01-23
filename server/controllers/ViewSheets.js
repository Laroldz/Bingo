  // controllers/ViewSheets.js
  import mysql from 'mysql2/promise';
  import dotenv from 'dotenv';

  dotenv.config();

  // Create a connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  /**
   * GET /mysheets/:owner_id
   * Retrieves all sheets for a specific user.
   */
  export async function ViewSheets(req, res) {
    const owner_id = req.params.owner_id;

    try {
      const [rows] = await pool.query(
        'SELECT * FROM BingoSheets WHERE owner_id = ? ORDER BY id DESC',
        [owner_id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * GET /sheets/:id
   * Retrieves a specific sheet + items (including is_marked).
   */
  export async function LoadSheet(req, res) {
    const id = req.params.id;

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1) Fetch the sheet
        const [sheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [id]
        );

        if (sheetRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: 'Sheet not found' });
        }

        const sheet = sheetRows[0];

        // 2) Fetch the associated items
        const [itemsRows] = await connection.query(
          'SELECT * FROM BingoItems WHERE sheet_id = ? ORDER BY position ASC',
          [id]
        );

        await connection.commit();
        connection.release();

        // Return the sheet and items
        res.json({ sheet, items: itemsRows });
      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error loading sheet:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * Helper function to ensure we have a valid items array of length 25,
   * each item including { content, is_marked }.
   */
  function buildSafeItems(inputItems) {
    let safeItems = [];
    if (Array.isArray(inputItems)) {
      safeItems = inputItems;
    } else {
      // If items wasn't an array, create a blank array of 25
      for (let i = 0; i < 25; i++) {
        safeItems.push({ content: '', is_marked: false });
      }
      return safeItems;
    }

    // If it's shorter than 25, fill it up; if longer, slice down
    while (safeItems.length < 25) {
      safeItems.push({ content: '', is_marked: false });
    }
    safeItems = safeItems.slice(0, 25);

    return safeItems;
  }

  /**
   * POST /sheets
   * Creates a new Bingo sheet + items (including is_marked).
   */
  export async function CreateSheet(req, res) {
    console.log('CreateSheet controller invoked with data:', req.body);
    const owner_id = req.body.owner_id;
    const owner_username = req.body.owner_username;
    const title = req.body.title;
    const description = req.body.description;
    const hasFreeSpace = req.body.hasFreeSpace;
    const items = req.body.items;

    // Make sure we have 25 items with is_marked
    const safeItems = buildSafeItems(items);

    // If hasFreeSpace is true, force index 12 to be "FREE SPACE"
    if (hasFreeSpace === true && safeItems.length >= 13) {
      safeItems[12].content = 'FREE SPACE';
      // Optionally set is_marked = false
      safeItems[12].is_marked = false;
    }

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1) Insert into BingoSheets
        const insertSheetSql = `
          INSERT INTO BingoSheets
            (owner_id, owner_username, title, description, has_free_space)
          VALUES (?, ?, ?, ?, ?)
        `;
        const hasFreeSpaceValue = hasFreeSpace === true ? 1 : 0;
        const [sheetResult] = await connection.query(insertSheetSql, [
          owner_id || '',
          owner_username || '',
          title || '',
          description || '',
          hasFreeSpaceValue,
        ]);

        const sheetId = sheetResult.insertId;
        console.log('Inserted into BingoSheets with ID:', sheetId);

        // 2) Insert BingoItems (each includes is_marked)
        const insertItemsSql = `
          INSERT INTO BingoItems (sheet_id, content, position, is_marked)
          VALUES ?
        `;
        const bingoItemsData = [];
        for (let i = 0; i < safeItems.length; i++) {
          const item = safeItems[i];

          let itemContent = '';
          if (item.content) {
            itemContent = item.content;
          }

          let itemMarked = 0;
          if (item.is_marked === true) {
            itemMarked = 1;
          }

          // Position is 1-based in the DB
          bingoItemsData.push([sheetId, itemContent, i + 1, itemMarked]);
        }

        await connection.query(insertItemsSql, [bingoItemsData]);

        // 3) Fetch the newly created sheet + items
        const [newSheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [sheetId]
        );
        const newSheet = newSheetRows[0];

        const [newItemsRows] = await connection.query(
          'SELECT * FROM BingoItems WHERE sheet_id = ? ORDER BY position ASC',
          [sheetId]
        );

        await connection.commit();
        connection.release();

        console.log('Sheet created successfully with ID:', sheetId);
        return res.status(201).json({
          message: 'Sheet created successfully',
          sheet: newSheet,
          items: newItemsRows,
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error creating sheet:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * PUT /sheets/:id
   * Updates an existing Bingo sheet + items (including is_marked).
   */
  export async function UpdateSheet(req, res) {
    const id = req.params.id;
    const title = req.body.title;
    const description = req.body.description;
    const hasFreeSpace = req.body.hasFreeSpace;
    const items = req.body.items;

    // Make sure we have 25 items with is_marked
    const safeItems = buildSafeItems(items);

    // If hasFreeSpace is true, force index 12 to be "FREE SPACE"
    if (hasFreeSpace === true && safeItems.length >= 13) {
      safeItems[12].content = 'FREE SPACE';
      safeItems[12].is_marked = false;
    } else if (
      safeItems.length >= 13 &&
      typeof safeItems[12].content === 'string' &&
      safeItems[12].content.toLowerCase() === 'free space'
    ) {
      // If hasFreeSpace is false but index 12 is "free space", remove it
      safeItems[12].content = '';
    }

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1) Ensure the sheet exists
        const [sheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [id]
        );
        if (sheetRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: 'Sheet not found' });
        }

        // 2) Update BingoSheets
        const updateSheetSql = `
          UPDATE BingoSheets
          SET title = ?, description = ?, has_free_space = ?
          WHERE id = ?
        `;
        let hasFreeSpaceValue = 0;
        if (hasFreeSpace === true) {
          hasFreeSpaceValue = 1;
        }

        await connection.query(updateSheetSql, [
          title || '',
          description || '',
          hasFreeSpaceValue,
          id,
        ]);

        // 3) Delete existing BingoItems for this sheet
        await connection.query('DELETE FROM BingoItems WHERE sheet_id = ?', [id]);

        // 4) Re-insert BingoItems (with is_marked)
        const insertItemsSql = `
          INSERT INTO BingoItems (sheet_id, content, position, is_marked)
          VALUES ?
        `;
        const bingoItemsData = [];

        for (let i = 0; i < safeItems.length; i++) {
          const item = safeItems[i];

          let itemContent = '';
          if (item.content) {
            itemContent = item.content;
          }

          let itemMarked = 0;
          if (item.is_marked === true) {
            itemMarked = 1;
          }

          // position is 1-based
          bingoItemsData.push([id, itemContent, i + 1, itemMarked]);
        }

        await connection.query(insertItemsSql, [bingoItemsData]);

        // 5) Fetch updated sheet & items
        const [updatedSheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [id]
        );
        const updatedSheet = updatedSheetRows[0];

        const [updatedItemsRows] = await connection.query(
          'SELECT * FROM BingoItems WHERE sheet_id = ? ORDER BY position ASC',
          [id]
        );

        await connection.commit();
        connection.release();

        return res.json({
          message: 'Sheet updated successfully',
          sheet: updatedSheet,
          items: updatedItemsRows,
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error updating sheet:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * DELETE /sheets/:id
   * Deletes a sheet and its associated BingoItems.
   */
  export async function DeleteSheet(req, res) {
    const id = req.params.id;
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        // 1) Ensure the sheet exists
        const [sheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [id]
        );
        if (sheetRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: 'Sheet not found' });
        }

        // 2) Delete BingoItems for this sheet
        await connection.query('DELETE FROM BingoItems WHERE sheet_id = ?', [id]);

        // 3) Delete the BingoSheet itself
        await connection.query('DELETE FROM BingoSheets WHERE id = ?', [id]);

        await connection.commit();
        connection.release();

        return res.json({ message: 'Sheet deleted successfully' });
      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error deleting sheet:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * POST /sheets/:id/share
   * Updates an existing Bingo sheet with a given shareToken
   */
  export async function ShareSheet(req, res) {
    const id = req.params.id;
    const shareToken = req.body.shareToken; 
    // This could be a random string your client generates, 
    // or your server can generate it.

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        // 1) Ensure the sheet exists
        const [sheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [id]
        );
        if (sheetRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: 'Sheet not found' });
        }

        // 2) Update the BingoSheet with the share token
        await connection.query(
          'UPDATE BingoSheets SET share_token = ? WHERE id = ?',
          [shareToken, id]
        );

        // 3) Optionally retrieve the updated row to return
        const [updatedSheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE id = ?',
          [id]
        );
        const updatedSheet = updatedSheetRows[0];

        await connection.commit();
        connection.release();

        return res.json({
          message: 'Sheet shared successfully',
          sheet: updatedSheet,
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error sharing sheet:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * GET /share/:share_token
   * Loads a sheet + items by share_token (instead of ID).
   */
  export async function LoadFromShare(req, res) {
    const shareToken = req.params.share_token;
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1) Load the sheet by share_token
        const [sheetRows] = await connection.query(
          'SELECT * FROM BingoSheets WHERE share_token = ?',
          [shareToken]
        );
        if (sheetRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: 'Sheet not found' });
        }
        const sheet = sheetRows[0];

        // 2) Fetch associated items
        const [itemsRows] = await connection.query(
          'SELECT * FROM BingoItems WHERE sheet_id = ? ORDER BY position ASC',
          [sheet.id]
        );

        await connection.commit();
        connection.release();

        // Return the sheet and items
        return res.json({ sheet, items: itemsRows });
      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error loading shared sheet:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }