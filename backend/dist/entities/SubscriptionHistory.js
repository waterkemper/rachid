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
exports.SubscriptionHistory = void 0;
const typeorm_1 = require("typeorm");
const Subscription_1 = require("./Subscription");
let SubscriptionHistory = class SubscriptionHistory {
};
exports.SubscriptionHistory = SubscriptionHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SubscriptionHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Subscription_1.Subscription, subscription => subscription.history, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", Subscription_1.Subscription)
], SubscriptionHistory.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'subscription_id' }),
    __metadata("design:type", Number)
], SubscriptionHistory.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'event_type' }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'old_value' }),
    __metadata("design:type", Object)
], SubscriptionHistory.prototype, "oldValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'new_value' }),
    __metadata("design:type", Object)
], SubscriptionHistory.prototype, "newValue", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true, unique: true, name: 'paypal_event_id' }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "paypalEventId", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true, name: 'paypal_resource_id' }),
    __metadata("design:type", String)
], SubscriptionHistory.prototype, "paypalResourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SubscriptionHistory.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SubscriptionHistory.prototype, "createdAt", void 0);
exports.SubscriptionHistory = SubscriptionHistory = __decorate([
    (0, typeorm_1.Entity)('subscription_history')
], SubscriptionHistory);
