import React from 'react';
import { LogOut } from 'lucide-react';

export default function Header({ user, onLogout, onProfileClick }) {
    if (!user) return null;

    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', dateOptions);

    return (
        <header>
            <div className="header-main">
                <h1>My Day</h1>
                <p id="current-date" className="hidden-mobile">{currentDate}</p>
            </div>
            <div id="auth-container">
                <div id="user-profile" onClick={onProfileClick}>
                    <img id="user-photo" src={user.photoURL} alt={user.displayName} />
                    <button className="icon-btn" onClick={(e) => {
                        e.stopPropagation();
                        onLogout();
                    }} title="Sign Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
