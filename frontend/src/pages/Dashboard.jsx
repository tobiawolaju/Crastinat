import React, { useState } from 'react';
import Header from '../components/Header';
import Timeline from '../components/Timeline';
import ChatInput from '../components/ChatInput';
import DetailsSheet from '../components/DetailsSheet';
import { useSchedule } from '../hooks/useSchedule';
import { database } from '../firebase-config';
import { ref, update, remove } from 'firebase/database';
import './Dashboard.css';

export default function Dashboard({ user, onLogout, accessToken, onNavigateToProfile }) {
    const { activities, loading: scheduleLoading } = useSchedule(user?.uid);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Dynamic API URL for local vs production testing
    const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://to-do-iun8.onrender.com';

    const handleSendMessage = async (message) => {
        setIsProcessing(true);
        console.log(`Flow: Sending chat message to ${API_BASE_URL}/api/chat`);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, userId: user.uid, accessToken, timeZone })
            });
            const result = await response.json();
            console.log("Flow: AI Response received:", result);

            if (result.calendarError) {
                console.warn("Flow: Google Calendar sync issues:", result.calendarError);
            }
        } catch (error) {
            console.error("Flow: Chat error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveActivity = async (updatedActivity) => {
        if (!user) return;
        console.log(`Flow: Saving activity update to ${API_BASE_URL}/api/activities/update`);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        try {
            const response = await fetch(`${API_BASE_URL}/api/activities/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: updatedActivity.id,
                    updates: updatedActivity,
                    userId: user.uid,
                    accessToken,
                    timeZone
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to update activity");
            }

            const result = await response.json();
            console.log("Flow: Save result:", result);
            return true;
        } catch (error) {
            console.error("Flow: Save error:", error);
            throw error;
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!user || !window.confirm("Are you sure?")) return;
        console.log(`Flow: Deleting activity via ${API_BASE_URL}/api/activities/delete`);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        try {
            const response = await fetch(`${API_BASE_URL}/api/activities/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: activityId,
                    userId: user.uid,
                    accessToken,
                    timeZone
                })
            });
            const result = await response.json();
            console.log("Flow: Delete result:", result);
        } catch (error) {
            console.error("Flow: Delete error:", error);
        }

        setSelectedActivity(null);
    };

    if (scheduleLoading) return <div className="loading">Loading Schedule...</div>;

    return (
        <div className="app-container">
            <Header user={user} onLogout={onLogout} onProfileClick={onNavigateToProfile} />
            <main className={`main-content ${selectedActivity ? 'has-selection' : ''}`}>
                <Timeline
                    activities={activities}
                    onSelectActivity={setSelectedActivity}
                />
                <DetailsSheet
                    activity={selectedActivity}
                    isOpen={!!selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onSave={handleSaveActivity}
                    onDelete={handleDeleteActivity}
                />
            </main>
            <ChatInput onSendMessage={handleSendMessage} isProcessing={isProcessing} />
        </div>
    );
}
