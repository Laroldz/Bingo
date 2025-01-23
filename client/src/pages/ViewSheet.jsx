import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './EditSheet.css'; // or create your own ViewSheet.css

function ViewSheet() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1) Extract the shareToken from the URL if using "?shareToken=xxx"
  const params = new URLSearchParams(location.search);
  const shareToken = params.get('shareToken');

  // Local state for the Bingo sheet's metadata
  const [sheet, setSheet] = useState({
    id: null,
    title: '',
    description: '',
    hasFreeSpace: false,
    share_token: '',
    created_at: null,
    updated_at: null,
    owner_username: '',
  });

  // Local state for 25 Bingo cells (read-only)
  // Each item has { content: string, is_marked: boolean }
  const [items, setItems] = useState(() => {
    const blankItems = [];
    for (let i = 0; i < 25; i++) {
      blankItems.push({ content: '', is_marked: false });
    }
    return blankItems;
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('shareToken:', shareToken, 'sheet:', sheet, 'items:', items);

  //------------------------------------------------------------------
  // On mount, if shareToken exists, fetch the shared sheet
  //------------------------------------------------------------------
  useEffect(() => {
    async function fetchSharedSheet() {
      try {
        if (!shareToken) {
          setError('No share token provided in the URL.');
          setLoading(false);
          return;
        }

        // GET /share/:share_token
        const response = await axios.get(`http://localhost:3000/share/${shareToken}`);

        const { sheet: loadedSheet, items: loadedItems } = response.data;

        // Convert loaded sheet info
        setSheet({
          id: loadedSheet.id,
          title: loadedSheet.title || '',
          description: loadedSheet.description || '',
          hasFreeSpace: Boolean(loadedSheet.has_free_space),
          share_token: loadedSheet.share_token || '',
          created_at: loadedSheet.created_at,
          updated_at: loadedSheet.updated_at,
          owner_username: loadedSheet.owner_username || '',
        });

        // Convert loaded items to { content, is_marked }
        const finalItems = [];
        for (let i = 0; i < loadedItems.length; i++) {
          const dbItem = loadedItems[i];
          finalItems.push({
            content: dbItem.content || '',
            is_marked: Boolean(dbItem.is_marked),
          });
        }
        // If fewer than 25, pad; if more, slice
        while (finalItems.length < 25) {
          finalItems.push({ content: '', is_marked: false });
        }
        setItems(finalItems.slice(0, 25));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching shared sheet:', err);
        setError('Could not load the shared sheet. It may not exist.');
        setLoading(false);
      }
    }

    fetchSharedSheet();
  }, [shareToken]);

  //------------------------------------------------------------------
  // Helper: Format date/time
  //------------------------------------------------------------------
  function formatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleDateString(undefined, options);
  }

  //------------------------------------------------------------------
  // If loading or error
  //------------------------------------------------------------------
  if (loading) {
    return <div className="container">Loading shared sheet...</div>;
  }
  if (error) {
    return (
      <div className="container">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  //------------------------------------------------------------------
  // Return a read-only view of the sheet
  //------------------------------------------------------------------
  return (
    <div className="container">
      <h1>Bingo Sheet Created by {sheet.owner_username}</h1>

      {/* Basic Navbar */}
      <div className="navbar">
        <div className="links">
          <div className="list">
            <a href="/">Home</a>
          </div>
          <div className="list">
            <a href="/about">About</a>
          </div>
          <div className="list">
            <a href="/mysheets">My Sheets</a>
          </div>
        </div>
      </div>

      {/* Sheet Metadata */}
      <div className="info-panel">
        <h2>{sheet.title}</h2>
        <p>{sheet.description}</p>
        <p>Created At: {formatTimestamp(sheet.created_at)}</p>
        <p>Updated At: {formatTimestamp(sheet.updated_at)}</p>
      </div>

      {/* 5×5 Grid (Read-Only) */}
      <div className="grid">
        {items.map((item, index) => {
          let cellClass = 'grid-cell';
          if (item.content.toLowerCase() === 'free space') {
            cellClass += ' free-space';
          }
          // If is_marked = true, add 'marked' class to turn it green
          if (item.is_marked) {
            cellClass += ' marked';
          }

          // In read-only mode, just display the text
          return (
            <div key={index} className={cellClass}>
              <div className="cell-content">{item.content}</div>
            </div>
          );
        })}
      </div>

      {/* Back button */}
      <button onClick={() => navigate('/')} className="back-button">
        Back to Home
      </button>
    </div>
  );
}

export default ViewSheet;
