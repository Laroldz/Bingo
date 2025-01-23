// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EditSheet from './pages/EditSheet';
import Callback from './components/Callback';
import ProtectedLayout from './components/ProtectedRoute';
import MySheets from './pages/MySheets';
import About from './pages/About';
import Logout from './components/Logout';
import ViewSheet from './pages/ViewSheet';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/about" element={<About />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/share" element = {<ViewSheet />} />

        {/* Parent route that is protected */}
        <Route element={<ProtectedLayout />}>
          {/* Child routes that are automatically protected */}
          <Route path ="/mysheets" element={<MySheets />} />
          <Route path="/editsheet" element={<EditSheet />} />
          <Route path="/newsheet" element={<EditSheet />} />
        </Route>

        {/* Add any other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
