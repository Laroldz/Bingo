import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EditSheet.css';

function EditSheet() {
  const navigate = useNavigate();

  // Retrieve user info from session storage
  let ownerId = sessionStorage.getItem('userId');
  let username = sessionStorage.getItem('username');
  let existingSheetId = sessionStorage.getItem('sheetId');

  if (!existingSheetId) {
    existingSheetId = null;
  }

  // Local state for the Bingo sheet's metadata
  const [sheet, setSheet] = useState({
    id: existingSheetId,
    title: '',
    description: '',
    hasFreeSpace: false,
    share_token: '',
    created_at: null,
    updated_at: null,
  });

  // Local state for 25 Bingo cells
  // Each item is { content: string, is_marked: boolean }
  const [items, setItems] = useState(() => {
    const blankItems = [];
    for (let i = 0; i < 25; i++) {
      blankItems.push({ content: '', is_marked: false });
    }
    return blankItems;
  });

  // State for the Debug Modal
  const [showDebug, setShowDebug] = useState(false);

  // State to show/hide our "Share" modal
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // We'll store whichever token we want to display in the modal here
  const [activeShareToken, setActiveShareToken] = useState('');

  function toggleDebug() {
    setShowDebug(!showDebug);
  }

  console.log(
    'ownerId:', ownerId,
    'username:', username,
    'existingSheetId:', existingSheetId,
    'sheet:', sheet,
    'items:', items
  );

  //------------------------------------------------------------------
  // 1) On initial load, if we have existingSheetId, load that sheet
  //------------------------------------------------------------------
  useEffect(() => {
    async function fetchSheet() {
      try {
        if (existingSheetId) {
          // Use a relative path, e.g. /sheets/:id
          const response = await axios.get(`/sheets/${existingSheetId}`);
          const { sheet: loadedSheet, items: loadedItems } = response.data;

          // Update local sheet state
          setSheet({
            id: loadedSheet.id.toString(),
            title: loadedSheet.title || '',
            description: loadedSheet.description || '',
            hasFreeSpace: Boolean(loadedSheet.has_free_space),
            share_token: loadedSheet.share_token || '',
            created_at: loadedSheet.created_at,
            updated_at: loadedSheet.updated_at,
          });

          // Convert DB items to { content, is_marked }
          const finalItems = [];
          for (let i = 0; i < loadedItems.length; i++) {
            const dbItem = loadedItems[i];
            finalItems.push({
              content: dbItem.content || '',
              is_marked: Boolean(dbItem.is_marked),
            });
          }

          // If not exactly 25, fill or slice to 25
          while (finalItems.length < 25) {
            finalItems.push({ content: '', is_marked: false });
          }
          setItems(finalItems.slice(0, 25));
        }
      } catch (error) {
        console.error('Error fetching existing sheet:', error);
      }
    }

    fetchSheet();
  }, [existingSheetId]);

  //------------------------------------------------------------------
  // hasFreeSpace toggling logic (transformBingoItems)
  //------------------------------------------------------------------
  function transformBingoItems(rawItems, hasFreeSpace = false) {
    // 1) Remove any "FREE SPACE"
    let cleanedItems = rawItems.filter((item) => {
      if (!item.content) return true;
      return item.content.toLowerCase() !== 'free space';
    });

    if (hasFreeSpace) {
      // Keep only 24 normal items
      cleanedItems = cleanedItems.slice(0, 24);
      while (cleanedItems.length < 24) {
        cleanedItems.push({ content: '', is_marked: false });
      }

      // Insert "FREE SPACE" in the middle (index 12)
      const finalItems = [];
      for (let i = 0; i < 12; i++) {
        finalItems.push(cleanedItems[i]);
      }
      finalItems.push({ content: 'FREE SPACE', is_marked: false });
      for (let i = 12; i < 24; i++) {
        finalItems.push(cleanedItems[i]);
      }
      setItems(finalItems);
    } else {
      // Exactly 25 items
      cleanedItems = cleanedItems.slice(0, 25);
      while (cleanedItems.length < 25) {
        cleanedItems.push({ content: '', is_marked: false });
      }
      setItems(cleanedItems);
    }
  }

  function handleFreeSpaceToggle() {
    const newHasFreeSpace = !sheet.hasFreeSpace;
    setSheet((prev) => {
      return { ...prev, hasFreeSpace: newHasFreeSpace };
    });
    transformBingoItems(items, newHasFreeSpace);
  }

  //------------------------------------------------------------------
  // handleSheetChange, handleItemChange, handleToggleMark
  //------------------------------------------------------------------
  function handleSheetChange(field, value) {
    setSheet((prevSheet) => {
      return { ...prevSheet, [field]: value };
    });
  }

  function handleItemChange(e, index) {
    const value = e.target.value;
    setItems((prevItems) => {
      return prevItems.map((item, i) => {
        if (i === index) {
          return { ...item, content: value };
        }
        return item;
      });
    });
  }

  // Toggle "marked" for a specific item
  function handleToggleMark(index) {
    setItems((prevItems) => {
      return prevItems.map((item, i) => {
        if (i === index) {
          return { ...item, is_marked: !item.is_marked };
        }
        return item;
      });
    });
  }

  //------------------------------------------------------------------
  // Shuffling items (except FREE SPACE if hasFreeSpace)
  //------------------------------------------------------------------
  function shuffleNonFreeSpaceItems() {
    setItems((prevItems) => {
      const itemsCopy = [...prevItems];

      if (!sheet.hasFreeSpace) {
        // Shuffle all 25
        return shuffleArray(itemsCopy);
      } else {
        // If we have FREE SPACE, remove it first, shuffle the rest, then re-insert
        const freeSpaceItem = itemsCopy[12];
        itemsCopy.splice(12, 1);

        const shuffled = shuffleArray(itemsCopy);
        shuffled.splice(12, 0, freeSpaceItem);
        return shuffled;
      }
    });
  }

  function shuffleArray(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // Swap
      const temp = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temp;
    }
    return array;
  }

  //------------------------------------------------------------------
  // CREATE or UPDATE the sheet (handleSave)
  //------------------------------------------------------------------
  async function handleSave() {
    try {
      // If there's no existing sheet.id, we create a new one
      if (!sheet.id) {
        console.log('Creating new sheet:', sheet);

        // POST to /sheets
        const response = await axios.post('/sheets', {
          owner_id: ownerId,
          owner_username: username,
          title: sheet.title,
          description: sheet.description,
          hasFreeSpace: sheet.hasFreeSpace,
          items,
        });

        const { sheet: newSheet, items: newItems } = response.data;
        console.log('Created sheet response:', newSheet);

        setSheet((prev) => ({
          ...prev,
          id: newSheet.id,
          created_at: newSheet.created_at,
          updated_at: newSheet.updated_at,
          share_token: newSheet.share_token || '',
        }));
        setItems(newItems);

        sessionStorage.setItem('sheetId', newSheet.id);
      } else {
        console.log('Updating sheet id:', sheet.id);

        // PUT /sheets/:id
        // Even if isLocked is true for the *words*, we might still want to update the "is_marked" states.
        // So this PUT is still relevant if you want to save marking changes.
        const updateResponse = await axios.put(`/sheets/${sheet.id}`, {
          title: sheet.title,
          description: sheet.description,
          hasFreeSpace: sheet.hasFreeSpace,
          items,
        });

        const { sheet: updatedSheet, items: updatedItems } = updateResponse.data;
        console.log('Updated sheet:', updatedSheet);

        setSheet((prev) => ({
          ...prev,
          title: updatedSheet.title,
          description: updatedSheet.description,
          hasFreeSpace: Boolean(updatedSheet.has_free_space),
          updated_at: updatedSheet.updated_at,
          share_token: updatedSheet.share_token || prev.share_token,
        }));
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error saving sheet:', error);
    }
  }

  //------------------------------------------------------------------
  // SHARE the sheet
  //------------------------------------------------------------------
  async function handleShare() {
    try {
      if (!sheet.id) {
        alert('Please save the sheet first before sharing.');
        return;
      }

      // If the sheet already has a share_token, just show it
      if (sheet.share_token) {
        setActiveShareToken(sheet.share_token);
        setShareModalVisible(true);
        return;
      }

      // Otherwise, generate a random share token
      const token = Math.random().toString(36).substring(2, 10);

      // POST /sheets/:id/share
      const response = await axios.post(`/sheets/${sheet.id}/share`, {
        shareToken: token,
      });

      const { sheet: updatedSheet } = response.data;

      // Update local state: store new share token
      setSheet((prev) => ({
        ...prev,
        share_token: updatedSheet.share_token || token,
      }));

      // Show the share modal with the new token
      setActiveShareToken(updatedSheet.share_token || token);
      setShareModalVisible(true);
    } catch (error) {
      console.error('Error sharing sheet:', error);
      alert('Error sharing sheet. Check console for details.');
    }
  }

  //------------------------------------------------------------------
  // DELETE the sheet
  //------------------------------------------------------------------
  async function handleDelete() {
    try {
      if (!sheet.id) {
        alert('Sheet not saved yet, nothing to delete.');
        return;
      }

      const confirmDel = window.confirm(
        'Are you sure you want to DELETE this sheet?'
      );
      if (!confirmDel) {
        return;
      }

      await axios.delete(`/sheets/${sheet.id}`);

      alert('Sheet deleted successfully!');

      // Clear local state + remove sheetId from session
      sessionStorage.removeItem('sheetId');
      setSheet({
        id: null,
        title: '',
        description: '',
        hasFreeSpace: false,
        share_token: '',
        created_at: null,
        updated_at: null,
      });
      setItems(Array.from({ length: 25 }, () => ({ content: '', is_marked: false })));

      // Redirect to My Sheets
      navigate('/mysheets');
    } catch (error) {
      console.error('Error deleting sheet:', error);
      alert('Error deleting sheet. Check console for details.');
    }
  }

  //------------------------------------------------------------------
  // Debug Info
  //------------------------------------------------------------------
  const debugInfo = {
    ownerId,
    username,
    sheet,
    items,
    sheetId: sessionStorage.getItem('sheetId'),
  };

  //------------------------------------------------------------------
  // Build some UI variables for simpler JSX
  //------------------------------------------------------------------
  // If sheet.id is truthy, treat as locked for word changes
  const isLocked = Boolean(sheet.id);

  let freeSpaceButtonLabel = 'Include FREE SPACE';
  let freeSpaceButtonClassName = 'action-button';
  if (sheet.hasFreeSpace) {
    freeSpaceButtonLabel = 'Remove FREE SPACE';
    freeSpaceButtonClassName = 'action-button active';
  }

  // Navbar login/logout link
  let navLink;
  if (ownerId) {
    navLink = (
      <div className="list">
        <a href="/logout">Logout</a>
      </div>
    );
  } else {
    navLink = (
      <div className="list">
        <a
          href="https://us-east-2fzo87xm4b.auth.us-east-2.amazoncognito.com/login?client_id=14k24a6kquof4pvr3iph8g7u5q&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fnotonmybingosheet.onrender.com%2Fcallback"
        >
          Login
        </a>
      </div>
    );
  }

  // If this sheet already exists (has an ID), show share & delete options
  const isExistingSheet = Boolean(sheet.id);

  // Simple date/time formatter
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
  // SHARE MODAL: show if shareModalVisible is true
  //------------------------------------------------------------------
  function closeShareModal() {
    setShareModalVisible(false);
  }

  // Use the current domain for the share link
  const shareLink = `${window.location.origin}/share?shareToken=${activeShareToken}`;

  let shareModal = null;
  if (shareModalVisible) {
    shareModal = (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Your Share Token</h2>
          <p>Use the link below to share this sheet:</p>
          <div className="share-link">
            <a href={shareLink} target="_blank" rel="noreferrer">
              {shareLink}
            </a>
          </div>
          <button onClick={closeShareModal} className="close-button">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Bingo Sheet Editor</h1>

      {/* Navbar */}
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
          {navLink}
        </div>
      </div>

      {/* Created At Display */}
      <div className="createdAt">
        Created At: {formatTimestamp(sheet.created_at)} by user {username}
      </div>

      <div className="editor-container">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="field">
            <label>Title:</label>
            <input
              type="text"
              value={sheet.title}
              onChange={(e) => handleSheetChange('title', e.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="field">
            <label>Description:</label>
            <textarea
              value={sheet.description}
              onChange={(e) => handleSheetChange('description', e.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="action-buttons">
            <button
              className={freeSpaceButtonClassName}
              onClick={handleFreeSpaceToggle}
              disabled={isLocked}
            >
              {freeSpaceButtonLabel}
            </button>

            <button
              className="action-button"
              onClick={shuffleNonFreeSpaceItems}
              disabled={isLocked}
            >
              Randomize Squares
            </button>
          </div>

          <div className="button-group">
            {/* We do NOT disable "Save Changes" because we might want to save new markings */}
            <button onClick={handleSave} className="save-button">
              Save Changes
            </button>
            <button onClick={() => navigate('/mysheets')} className="back-button">
              Back to My Sheets
            </button>
          </div>

          {isExistingSheet && (
            <div className="button-group">
              <button onClick={handleShare} className="share-button">
                Share Sheet
              </button>
              <button onClick={handleDelete} className="share-button">
                Delete Sheet
              </button>
            </div>
          )}

          {/* Share Modal (conditionally rendered) */}
          {shareModal}
        </div>

        {/* RIGHT PANEL: 5×5 Bingo Grid */}
        <div className="right-panel">
          <h3>Bingo Items</h3>
          <div className="grid">
            {items.map((item, index) => {
              let cellClassName = 'grid-cell';
              const lowerContent = item.content.toLowerCase();
              const isFreeSpace = (lowerContent === 'free space');

              if (isFreeSpace) {
                cellClassName += ' free-space';
              }
              if (item.is_marked) {
                cellClassName += ' marked';
              }

              return (
                <div key={index} className={cellClassName}>
                  {/* Disable editing the text if locked or if it's the FREE SPACE */}
                  <textarea
                    value={item.content}
                    onChange={(e) => handleItemChange(e, index)}
                    disabled={isFreeSpace || isLocked}
                  />
                  <div className="mark-toggle">
                    <label>
                      {/* Allow marking even if locked (only FREE SPACE remains disabled) */}
                      <input
                        type="checkbox"
                        checked={item.is_marked}
                        onChange={() => handleToggleMark(index)}
                        disabled={isFreeSpace}
                      />
                      Mark
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Debug Button (if needed) */}
      {/* <button onClick={toggleDebug}>Toggle Debug</button> */}

      {/* Debug Modal */}
      {showDebug && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Debug Information</h2>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            <button onClick={toggleDebug} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditSheet;
