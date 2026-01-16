// Extracted sessions list for better code organization
import CollaborationSessionCard from './CollaborationSessionCard';
import EmptySessionsState from './EmptySessionsState';

export default function SessionsList({ sessions, onSelectSession, onCreateSession }) {
    // Early return for empty state
    if (sessions.length === 0) {
        return <EmptySessionsState onCreateSession={onCreateSession} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
                <CollaborationSessionCard
                    key={session.id}
                    session={session}
                    onClick={() => onSelectSession(session)}
                />
            ))}
        </div>
    );
}