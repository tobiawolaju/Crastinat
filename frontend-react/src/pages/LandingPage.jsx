import React from 'react';

export default function LandingPage({ onLogin }) {
    return (
        <div className="landing-page">
            <div className="landing-scroll-container">
                {/* Hero Section */}
                <section className="landing-section">
                    <div className="hero-badge fade-in-up">AI-Powered Planning</div>
                    <h1 className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Your Life,<br />On a Timeline.
                    </h1>
                    <p className="fade-in-up" style={{ animationDelay: '0.2s' }}>
                        A minimalist command center for your day. Powered by AI, designed for clarity.
                    </p>
                    <button
                        className="action-button primary hero-cta fade-in-up"
                        style={{ marginTop: '40px', animationDelay: '0.3s' }}
                        onClick={onLogin}
                    >
                        Get Started
                    </button>

                    <div className="scroll-indicator fade-in-up" style={{ animationDelay: '1s' }}>
                        <span>Scroll</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                        </svg>
                    </div>
                </section>

                {/* Features Section */}
                <section className="landing-section">
                    <div className="hero-badge">Seamless Flow</div>
                    <h2>Design your day.</h2>
                    <p>Natural language interaction meets a visual timeline. Just type what you want to do, and watch your schedule assemble itself.</p>

                    <div className="feature-visual">
                        <div className="preview-track">
                            <div className="preview-block" style={{ left: '20%', width: '30%' }}></div>
                            <div className="preview-block" style={{ left: '55%', width: '15%', opacity: 0.6 }}></div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="landing-section signin-section">
                    <h1>Ready to start?</h1>
                    <button className="action-button primary hero-cta" onClick={onLogin}>
                        Sign in with Google
                    </button>
                </section>
            </div>
        </div>
    );
}
