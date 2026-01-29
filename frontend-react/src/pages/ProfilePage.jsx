import React from 'react';
import Header from '../components/Header';
import { useSchedule } from '../hooks/useSchedule';
import { ArrowLeft, Award, Calendar, CheckCircle2 } from 'lucide-react';

export default function ProfilePage({ user, onLogout, onBack }) {
    const { activities, loading } = useSchedule(user?.uid);

    // Calculate stats
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'Completed').length;
    const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

    // Heatmap Logic: Simplified for demonstration
    // In a real app, we'd group activities by date. For this one, we'll simulate based on recent data.
    const weeks = 52;
    const daysPerWeek = 7;

    // Simple helper to get a random heat level for visual consistency with OpenAI theme
    const getHeatLevel = (i) => {
        const levels = [0, 0, 1, 0, 2, 0, 1, 3, 0, 0, 4, 1, 0];
        return levels[i % levels.length];
    };

    return (
        <div className="dashboard-page">
            <header>
                <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="icon-btn" onClick={onBack} aria-label="Go back">
                        <ArrowLeft size={20} />
                    </button>
                    <h1>{user.displayName || 'Tobi Awolaju'}</h1>
                </div>
                <div id="auth-container">
                    <div id="user-profile">
                        <img id="user-photo" src={user.photoURL} alt="User" />
                        <button className="icon-btn" onClick={onLogout} aria-label="Sign out">
                            <ArrowLeft style={{ transform: 'rotate(180deg)' }} size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-container">
                <section className="profile-stats">
                    <div className="title-group">
                        <h1>Activity Overview</h1>
                        <p>Your consistency over the past year.</p>
                    </div>

                    <div className="detail-grid" style={{ marginTop: '24px' }}>
                        <div className="detail-section">
                            <h3>Total Captured</h3>
                            <div className="detail-value">
                                <Calendar size={18} className="text-secondary" />
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalActivities}</span>
                            </div>
                        </div>
                        <div className="detail-section">
                            <h3>Completed</h3>
                            <div className="detail-value">
                                <CheckCircle2 size={18} style={{ color: '#4CAF50' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{completedActivities}</span>
                            </div>
                        </div>
                        <div className="detail-section">
                            <h3>Milestones</h3>
                            <div className="detail-value">
                                <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{completionRate}%</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="activity-heatmap">
                    <div className="detail-section">
                        <h3>Activity Heatmap</h3>
                        <div className="heatmap-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${weeks}, 1fr)`,
                            gap: '4px',
                            padding: '12px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-m)',
                            border: '1px solid var(--border-subtle)',
                            overflowX: 'auto'
                        }}>
                            {Array.from({ length: weeks * daysPerWeek }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`heat-cell level-${getHeatLevel(i)}`}
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '2px',
                                        transition: 'all 0.2s'
                                    }}
                                    title={`Activity level: ${getHeatLevel(i)}`}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
