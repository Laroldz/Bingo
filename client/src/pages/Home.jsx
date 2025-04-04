// Home.css


import React from 'react';
import './Home.css';
const Home = () => {
    const ownerId = sessionStorage.getItem('userId');
    const username = sessionStorage.getItem('username');
  
    return (
        <div>

            <div className = "navbar">
                <div className = "links">

                <div className = "list"><a href = "/">Home</a></div>
                <div className = "list"> <a href = "/about">About</a></div>
                <div className = "list"> <a href = "/mysheets">My Sheets</a></div>
                {ownerId ? (
                            <div className = "list">  <a href = "/logout">Logout</a></div>
                ) : (
                    <div className = "list">  <a href="https://us-east-24ih5nmtxg.auth.us-east-2.amazoncognito.com/">Login</a></div>
                )}
                </div>
            </div>
        <div className = "background">
        <div className = "firstparagraph"><div>
            Welcome to my Bingo Creation App! Click "Login" to create a sheet and share it with your friends or click "About" to see more about this project! Please wait a moment for render to start up, but you can also check out my personal website <a href = "https://lawrencewongg.net" target='_blank'> Here </a></div>
        </div>
        </div>


        </div>

    );
    }
export default Home;
