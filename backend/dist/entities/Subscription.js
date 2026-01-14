"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const typeorm_1 = require("typeorm");
const Usuario_1 = require("./Usuario");
const SubscriptionHistory_1 = require("./SubscriptionHistory");
const SubscriptionFeature_1 = require("./SubscriptionFeature");
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario, usuario => usuario.subscription),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], Subscription.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'usuario_id' }),
    __metadata("design:type", Number)
], Subscription.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true, unique: true, name: 'paypal_subscription_id' }),
    __metadata("design:type", String)
], Subscription.prototype, "paypalSubscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true, unique: true, name: 'paypal_payer_id' }),
    __metadata("design:type", String)
], Subscription.prototype, "paypalPayerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'plan_type' }),
    __metadata("design:type", String)
], Subscription.prototype, "planType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'APPROVAL_PENDING', name: 'status' }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'current_period_start' }),
    __metadata("design:type", Date)
], Subscription.prototype, "currentPeriodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'current_period_end' }),
    __metadata("design:type", Date)
], Subscription.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'cancel_at_period_end' }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "cancelAtPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'canceled_at' }),
    __metadata("design:type", Date)
], Subscription.prototype, "canceledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'trial_end' }),
    __metadata("design:type", Date)
], Subscription.prototype, "trialEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'next_billing_time' }),
    __metadata("design:type", Date)
], Subscription.prototype, "nextBillingTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Subscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Subscription.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SubscriptionHistory_1.SubscriptionHistory, history => history.subscription),
    __metadata("design:type", Array)
], Subscription.prototype, "history", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SubscriptionFeature_1.SubscriptionFeature, feature => feature.subscription),
    __metadata("design:type", Array)
], Subscription.prototype, "features", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)('subscriptions')
], Subscription);
