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
                    <div className = "list">  <a href="https://us-east-2fzo87xm4b.auth.us-east-2.amazoncognito.com/login/continue?client_id=14k24a6kquof4pvr3iph8g7u5q&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcallback&response_type=code&scope=email+openid+phone">Login</a></div>
                )}
                </div>
            </div>
        <div className = "background">
        <div className = "firstparagraph"><div>
            Welcome to my Bingo Creation App! Click "Login" to create a sheet and share it with your friends or click "About" to see more about this project! You can also check out my personal website <a href = "https://lawrencewongg.net" target='_blank'> Here </a></div>
        </div>
        </div>


        </div>

    );
    }
export default Home;