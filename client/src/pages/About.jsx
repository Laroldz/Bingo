import React from 'react';
import './Home.css';
const About = () => {
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
            <h1>About This Project</h1>


            <p>This project was inspired by the phrase <b>"This was not on my 2024 Bingo Sheet"</b> and I wanted to make a project that I could use among my friends while practicing my coding skills.
            It features OAuth using AWS Cognito, and the ability to view and share the sheet amongst your friends.
            </p><p> A key feature is the fact that the sheet is only viewable if you are the owner of the sheet or create a share token. Other than that, this is a simple application of a Bingo Sheet maker that lets your friends view the date you created the sheet and only view the sheets you intend on sharing with how you would share a read-only Google Doc.
            An important thing to know is that once the sheet is saved, it cannot be further edited(other than marked) because it would ruin the point of having your sheet be a prediction.
            </p>

            <p>This is a coding project created by <a href = "https://lawrencewongg.net" target='_blank'> Lawrence Wong</a> using:
            </p><ul>Front End: React, React Router, Axios</ul> 
            <ul>Back End:Node.js, Express.js, MySQL (Amazon RDS)</ul>
            <ul>Authentidcation: AWS Cognito</ul>
        </div>
    );
}

export default About;