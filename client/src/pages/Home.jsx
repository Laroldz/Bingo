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
                    <div className = "list">  <a href="htfasdfastps://us-east-2fzo87xm4b.auth.us-east-2.amazoncognito.com/login?client_id=14k24a6kquof4pvr3iph8g7u5q&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fbackend-service-kimj.onrender.com%2Fcallback">Login</a></div>
                )}
                </div>
            </div>
        <div className = "background">
        <div className = "firstparagraph"><div>
            Welcome to my Bingo Creation App! Click "Logins" to create a sheet and share it with your friends or click "About" to see more about this project! You can also check out my personal website <a href = "https://lawrencewongg.net" target='_blank'> Here </a></div>
        </div>
        </div>


        </div>

    );
    }
export default Home;