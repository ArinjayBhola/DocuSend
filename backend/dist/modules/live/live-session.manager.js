export class LiveSessionManager {
    activeSessions = new Map();
    sseClients = new Map();
    constructor() {
        // Cleanup interval
        setInterval(() => this.cleanup(), 30000);
    }
    cleanup() {
        const cutoff = Date.now() - 5 * 60 * 1000;
        for (const [viewId, session] of this.activeSessions) {
            if (session.lastActivity < cutoff) {
                this.activeSessions.delete(viewId);
                this.broadcastToUser(session.userId, {
                    type: 'session_ended',
                    viewId,
                    viewerEmail: session.viewerEmail,
                    documentTitle: session.documentTitle,
                });
            }
        }
    }
    broadcastToUser(userId, data) {
        const clients = this.sseClients.get(userId);
        if (!clients)
            return;
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        for (const res of clients) {
            try {
                res.write(payload);
            }
            catch {
                // Dead connection
            }
        }
    }
    addSession(viewId, session) {
        this.activeSessions.set(viewId, session);
        this.broadcastToUser(session.userId, {
            type: 'session_started',
            viewId,
            documentId: session.documentId,
            documentTitle: session.documentTitle,
            viewerEmail: session.viewerEmail,
            viewerIp: session.viewerIp,
            currentPage: session.currentPage,
            totalPages: session.totalPages,
            startedAt: session.startedAt,
        });
    }
    updateSessionPage(viewId, pageNumber) {
        const session = this.activeSessions.get(viewId);
        if (!session)
            return;
        session.currentPage = pageNumber;
        session.lastActivity = Date.now();
        session.pagesVisited.add(pageNumber);
        session.timeOnCurrentPage = 0;
        this.broadcastToUser(session.userId, {
            type: 'page_changed',
            viewId,
            documentId: session.documentId,
            documentTitle: session.documentTitle,
            viewerEmail: session.viewerEmail,
            currentPage: pageNumber,
            totalPages: session.totalPages,
            pagesVisited: session.pagesVisited.size,
            elapsedSeconds: Math.round((Date.now() - session.startedAt) / 1000),
        });
    }
    endSession(viewId) {
        const session = this.activeSessions.get(viewId);
        if (session) {
            this.broadcastToUser(session.userId, {
                type: 'session_ended',
                viewId,
                documentId: session.documentId,
                documentTitle: session.documentTitle,
                viewerEmail: session.viewerEmail,
                duration: Math.round((Date.now() - session.startedAt) / 1000),
                pagesVisited: session.pagesVisited.size,
            });
            this.activeSessions.delete(viewId);
        }
    }
    addSseClient(userId, res) {
        if (!this.sseClients.has(userId))
            this.sseClients.set(userId, new Set());
        this.sseClients.get(userId).add(res);
    }
    removeSseClient(userId, res) {
        const clients = this.sseClients.get(userId);
        if (clients) {
            clients.delete(res);
            if (clients.size === 0)
                this.sseClients.delete(userId);
        }
    }
    getActiveSessionsForUser(userId) {
        const results = [];
        for (const session of this.activeSessions.values()) {
            if (session.userId === userId) {
                results.push({
                    viewId: session.viewId,
                    documentId: session.documentId,
                    documentTitle: session.documentTitle,
                    viewerEmail: session.viewerEmail,
                    viewerIp: session.viewerIp,
                    currentPage: session.currentPage,
                    totalPages: session.totalPages,
                    pagesVisited: session.pagesVisited.size,
                    startedAt: session.startedAt,
                    elapsedSeconds: Math.round((Date.now() - session.startedAt) / 1000),
                });
            }
        }
        return results;
    }
    getActiveCount(userId) {
        let count = 0;
        for (const session of this.activeSessions.values()) {
            if (session.userId === userId)
                count++;
        }
        return count;
    }
}
export const liveSessionManager = new LiveSessionManager();
