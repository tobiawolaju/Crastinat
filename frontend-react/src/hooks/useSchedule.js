import { useState, useEffect } from 'react';
import { database } from '../firebase-config';
import { ref, onValue } from 'firebase/database';

export function useSchedule(userId) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setActivities([]);
            setLoading(false);
            return;
        }

        const scheduleRef = ref(database, `users/${userId}/schedule`);
        const unsubscribe = onValue(scheduleRef, (snapshot) => {
            const data = snapshot.val() || {};
            const activitiesArray = Object.keys(data).map(key => ({
                ...data[key],
                id: data[key].id || key
            }));
            setActivities(activitiesArray);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { activities, loading };
}
