import { LiveService } from './live.service.js';
import { liveSessionManager } from './live-session.manager.js';
export class LiveController {
    service;
    constructor() {
        this.service = new LiveService();
    }
    startSession = async (req, res) => {
        const { viewId, documentId, viewerEmail, totalPages } = req.body;
        const viewerIp = (req.ip || req.headers['x-forwarded-for'] || 'unknown');
        await this.service.startSession(documentId, viewId, viewerEmail, viewerIp, totalPages);
        res.json({ ok: true });
    };
    pageChange = async (req, res) => {
        const { viewId, pageNumber } = req.body;
        await this.service.updatePageChange(viewId, pageNumber);
        res.json({ ok: true });
    };
    endSession = async (req, res) => {
        // Handle text body if needed (from some browser beacons)
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            }
            catch {
                return res.json({ ok: true });
            }
        }
        const { viewId } = body;
        await this.service.endSession(viewId);
        res.json({ ok: true });
    };
    stream = async (req, res) => {
        const userId = req.userId;
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        const sessions = liveSessionManager.getActiveSessionsForUser(userId);
        res.write(`data: ${JSON.stringify({ type: 'init', sessions })}\n\n`);
        liveSessionManager.addSseClient(userId, res);
        const heartbeat = setInterval(() => {
            try {
                res.write(': heartbeat\n\n');
            }
            catch {
                clearInterval(heartbeat);
            }
        }, 15000);
        req.on('close', () => {
            clearInterval(heartbeat);
            liveSessionManager.removeSseClient(userId, res);
        });
    };
    getEngagement = async (req, res) => {
        const result = await this.service.getEngagement(req.userId);
        res.json(result);
    };
}
