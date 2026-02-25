import { DealsService } from './deals.service.js';
import { StakeholderService } from './stakeholder.service.js';
import { createDealSchema, updateDealSchema, stakeholderSchema } from './deals.validation.js';
export class DealsController {
    service;
    stakeholders;
    constructor() {
        this.service = new DealsService();
        this.stakeholders = new StakeholderService();
    }
    list = async (req, res) => {
        const deals = await this.service.getAllDeals(req.userId);
        res.json({ deals });
    };
    create = async (req, res) => {
        const validated = createDealSchema.parse(req.body);
        const deal = await this.service.createDeal(req.userId, validated);
        res.status(201).json({ deal });
    };
    getOne = async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.service.getDealDetail(id, req.userId);
        res.json(result);
    };
    update = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = updateDealSchema.parse(req.body);
        const deal = await this.service.updateDeal(id, req.userId, validated);
        res.json({ deal });
    };
    delete = async (req, res) => {
        const id = parseInt(req.params.id);
        await this.service.delete(id); // Repository delete
        res.json({ ok: true });
    };
    addStakeholder = async (req, res) => {
        const id = parseInt(req.params.id);
        const validated = stakeholderSchema.parse(req.body);
        const stakeholder = await this.stakeholders.addStakeholder(id, req.userId, validated);
        res.status(201).json({ stakeholder });
    };
    detectStakeholders = async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.stakeholders.detectStakeholders(id, req.userId);
        res.json(result);
    };
    getRisk = async (req, res) => {
        const id = parseInt(req.params.id);
        const assessment = await this.service.assessRisk(id, req.userId);
        res.json(assessment);
    };
    getIntentGraph = async (req, res) => {
        const id = parseInt(req.params.id);
        const graph = await this.service.getIntentGraph(id, req.userId);
        res.json(graph);
    };
    getActions = async (req, res) => {
        const id = parseInt(req.params.id);
        const actions = await this.service.getActions(id, req.userId);
        res.json({ actions });
    };
}
