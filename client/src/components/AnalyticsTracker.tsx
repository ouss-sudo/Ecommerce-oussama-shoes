import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';

export function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        // Generate or get unique visitor ID
        let visitorId = localStorage.getItem('oussamashoes_visitor_id');
        if (!visitorId) {
            visitorId = 'v-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('oussamashoes_visitor_id', visitorId);
        }

        const pingVisitor = async () => {
            try {
                await api.post('/visitors/ping', {
                    identifier: visitorId,
                    page: location.pathname
                });
            } catch (error) {
                // Silently ignore analytics errors
                console.debug('Analytics ping failed');
            }
        };

        // Ping immediately on page change
        pingVisitor();

        // Ping every 60 seconds to stay marked as "active"
        const interval = setInterval(pingVisitor, 60000);

        return () => clearInterval(interval);
    }, [location.pathname]);

    return null; // This component doesn't render anything
}
