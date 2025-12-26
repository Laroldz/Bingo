import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MySheets.css'; // <-- Import the new CSS file

function MySheets() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const ownerId = sessionStorage.getItem('userId');
  const username = sessionStorage.getItem('username');

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        // Use a *relative path* since the backend is served on the same domain
        // "/mysheets" automatically resolves to https://<your-deployed-domain>/mysheets
        const response = await axios.get(`/mysheets/${ownerId}`);
        setSheets(response.data);
      } catch (error) {
        console.error('Error fetching sheets:', error);
      }
    };

    if (ownerId) {
      fetchSheets();
    }
  }, [ownerId]);

  const handleEdit = (sheetId) => {
    sessionStorage.setItem('sheetId', sheetId);
    navigate('/editsheet');
  };

  const CreateNewSheet = () => {
    sessionStorage.removeItem('sheetId');
    navigate('/newsheet');
  };

  async function handleDelete(sheetId) {
    try {
      if (sheetId === null) {
        alert('Sheet not saved yet, nothing to delete.');
        return;
      }

      const confirmDel = window.confirm(
        'Are you sure you want to DELETE this sheet?'
      );
      if (!confirmDel) {
        return;
      }

      // Again, use a *relative path* for the delete request
      await axios.delete(`/sheets/${sheetId}`);

      alert('Sheet deleted successfully!');
      sessionStorage.removeItem('sheetId');
      setSheets((prev) => prev.filter((sheet) => sheet.id !== sheetId));
    } catch (error) {
      console.error('Error deleting sheet:', error);
      alert('Error deleting sheet. Check console for details.');
    }
  }

  return (
    <div className="mysheets-container">
      {/* Navbar */}
      <div className="navbar">
        <div className="links">
          <div className="list"><a href="/">Home</a></div>
          <div className="list"><a href="/about">About</a></div>
          <div className="list"><a href="/mysheets">My Sheets</a></div>
          {ownerId ? (
            <div className="list"><a href="/logout">Logout</a></div>
          ) : (
            <div className="list">
              {/* TODO: Update your Cognito login URL for production */}
              <a href="https://us-east-21winqvkkq.auth.us-east-2.amazoncognito.com/login?client_id=5a0k6f5kn0l6hvo04hm7sjec66&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fnotonmybingosheet.onrender.com%2Fcallback">
                Login
              </a>
            </div>
          )}
        </div>
      </div>

      <h1 className="mysheets-title">My Sheets</h1>

      {sheets.length === 0 ? (
        <p className="no-sheets">No sheets found for owner <strong>{username}</strong></p>
      ) : (
        <ul className="sheets-list">
          {sheets.map((sheet) => (
            <li key={sheet.id} className="sheet-card">
              <h3 className="sheet-card-title">{sheet.title}</h3>
              <p className="sheet-card-description">{sheet.description}</p>
              <div className="sheet-card-actions">
                <button onClick={() => handleEdit(sheet.id)} className="edit-button">Edit</button>
                <button onClick={() => handleDelete(sheet.id)} className="delete-button">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button onClick={CreateNewSheet} className="new-sheet-button">
        Create New Sheet
      </button>
    </div>
  );
}

export default MySheets;
