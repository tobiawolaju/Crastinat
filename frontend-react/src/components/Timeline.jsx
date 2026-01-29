import React from 'react';
import ActivityBlock from './ActivityBlock';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Timeline({ activities, onSelectActivity }) {
    const containerRef = React.useRef(null);
    const [zoom, setZoom] = React.useState(1.0);
    const [currentTimeInMinutes, setCurrentTimeInMinutes] = React.useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    // --- RECURSIVE UPDATE FOR INDICATOR ---
    React.useEffect(() => {
        let frameId;
        const update = () => {
            const now = new Date();
            setCurrentTimeInMinutes(now.getHours() * 60 + now.getMinutes());
            frameId = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(frameId);
    }, []);

    // --- INITIAL SCROLL ---
    React.useLayoutEffect(() => {
        if (containerRef.current) {
            const pixelsPerMinute = (200 * zoom) / 60;
            const targetX = currentTimeInMinutes * pixelsPerMinute - (window.innerWidth / 2);
            containerRef.current.scrollLeft = Math.max(0, targetX);
        }
    }, []); // Only on mount

    const zoomRef = React.useRef(zoom);
    const lastTouchDistanceRef = React.useRef(0);

    // Sync ref with state
    React.useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    // --- ZOOM LOGIC ---
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const applyZoom = (newZoom, centerX) => {
            const minZoom = 0.1;
            const maxZoom = 5.0;
            const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));

            if (clamped === zoomRef.current) return;

            const rect = el.getBoundingClientRect();
            const relativeX = centerX - rect.left + el.scrollLeft;
            const ratio = clamped / zoomRef.current;

            setZoom(clamped);
            document.documentElement.style.setProperty('--zoom-level', clamped);

            // Sync scroll
            requestAnimationFrame(() => {
                el.scrollLeft = relativeX * ratio - (centerX - rect.left);
            });
        };

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = -e.deltaY;
                const factor = delta > 0 ? 1.1 : 0.9;
                applyZoom(zoomRef.current * factor, e.clientX);
            }
        };

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                lastTouchDistanceRef.current = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;

                if (lastTouchDistanceRef.current > 0) {
                    const factor = distance / lastTouchDistanceRef.current;
                    applyZoom(zoomRef.current * factor, centerX);
                }
                lastTouchDistanceRef.current = distance;
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('touchstart', handleTouchStart);
        el.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
        };
    }, []); // Empty dependency array means listeners are stable

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const filteredActivities = activities.filter(activity => {
        if (!activity.days || activity.days.length === 0) return true;
        return activity.days.some(day => day.toString().toLowerCase() === currentDay);
    });

    // track assignment
    const sorted = [...filteredActivities].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    const tracks = [];
    sorted.forEach(activity => {
        const start = parseTime(activity.startTime);
        let placed = false;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const lastActivityInTrack = track[track.length - 1];
            if (start >= parseTime(lastActivityInTrack.endTime)) {
                track.push(activity);
                activity.trackIndex = i;
                placed = true;
                break;
            }
        }
        if (!placed) {
            tracks.push([activity]);
            activity.trackIndex = tracks.length - 1;
        }
    });

    function parseTime(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const [hours, minutes] = timeStr.trim().split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
    }

    return (
        <div className="timeline-container" ref={containerRef}>
            <div className="time-ruler" id="time-ruler">
                {HOURS.map(hour => (
                    <div key={hour} className="time-marker">
                        {String(hour).padStart(2, '0')}:00
                    </div>
                ))}
            </div>
            <div className="tracks-container" style={{ height: `calc(${tracks.length} * var(--grid-track-total))` }}>
                <div
                    className="current-time-indicator"
                    id="current-time-indicator"
                    style={{ left: `calc(${currentTimeInMinutes} * var(--pixels-per-minute))` }}
                ></div>
                {sorted.map(activity => (
                    <ActivityBlock
                        key={activity.id}
                        activity={activity}
                        onClick={() => onSelectActivity(activity)}
                    />
                ))}
            </div>
        </div>
    );
}
