const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
export class SessionManagerService {
    activeRooms = new Map();
    getOrCreateRoom(sessionId) {
        if (!this.activeRooms.has(sessionId)) {
            this.activeRooms.set(sessionId, {
                participants: new Map(),
                typing: new Set(),
                handRaised: new Set(),
                screenSharing: new Set(),
            });
        }
        return this.activeRooms.get(sessionId);
    }
    broadcast(sessionId, data, excludeUserId) {
        const room = this.activeRooms.get(sessionId);
        if (!room)
            return;
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        for (const [userId, participant] of room.participants) {
            if (userId === excludeUserId)
                continue;
            for (const res of participant.sseRes) {
                try {
                    res.write(payload);
                }
                catch {
                    // Dead connection, will be handled by the close event
                }
            }
        }
    }
    getParticipantColor(sessionId, userId) {
        const room = this.activeRooms.get(sessionId);
        if (room && userId) {
            const p = room.participants.get(userId);
            if (p)
                return p.color;
        }
        const usedColors = room ? Array.from(room.participants.values()).map((p) => p.color) : [];
        for (const c of COLORS) {
            if (!usedColors.includes(c))
                return c;
        }
        return COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    removeParticipant(sessionId, userId, res) {
        const room = this.activeRooms.get(sessionId);
        if (room) {
            const p = room.participants.get(userId);
            if (p) {
                p.sseRes.delete(res);
                if (p.sseRes.size === 0) {
                    room.participants.delete(userId);
                    room.typing.delete(userId);
                    room.handRaised.delete(userId);
                    room.screenSharing.delete(userId);
                }
            }
            if (room.participants.size === 0) {
                this.activeRooms.delete(sessionId);
            }
        }
    }
    endRoom(sessionId) {
        const room = this.activeRooms.get(sessionId);
        if (room) {
            for (const participant of room.participants.values()) {
                for (const res of participant.sseRes) {
                    try {
                        res.end();
                    }
                    catch {
                        // ignore
                    }
                }
            }
            this.activeRooms.delete(sessionId);
        }
    }
    updatePresence(sessionId, userId, data) {
        const room = this.activeRooms.get(sessionId);
        if (!room)
            return null;
        const p = room.participants.get(userId);
        if (p) {
            if (data.currentPage !== undefined)
                p.currentPage = data.currentPage;
            if (data.cursorX !== undefined)
                p.cursorX = data.cursorX;
            if (data.cursorY !== undefined)
                p.cursorY = data.cursorY;
            p.lastActivity = Date.now();
            return p;
        }
        return null;
    }
    toggleHandRaise(sessionId, userId) {
        const room = this.getOrCreateRoom(sessionId);
        const isRaised = room.handRaised.has(userId);
        if (isRaised)
            room.handRaised.delete(userId);
        else
            room.handRaised.add(userId);
        return !isRaised;
    }
    toggleScreenShare(sessionId, userId) {
        const room = this.getOrCreateRoom(sessionId);
        const isSharing = room.screenSharing.has(userId);
        if (isSharing)
            room.screenSharing.delete(userId);
        else
            room.screenSharing.add(userId);
        return !isSharing;
    }
    setTyping(sessionId, userId, isTyping) {
        const room = this.getOrCreateRoom(sessionId);
        if (isTyping)
            room.typing.add(userId);
        else
            room.typing.delete(userId);
    }
}
// Single instance for the module
export const sessionManager = new SessionManagerService();
