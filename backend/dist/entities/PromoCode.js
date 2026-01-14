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
exports.PromoCode = void 0;
const typeorm_1 = require("typeorm");
let PromoCode = class PromoCode {
};
exports.PromoCode = PromoCode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PromoCode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { unique: true, length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PromoCode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'discount_percent' }),
    __metadata("design:type", Number)
], PromoCode.prototype, "discountPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'valid_from' }),
    __metadata("design:type", Date)
], PromoCode.prototype, "validFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'valid_until' }),
    __metadata("design:type", Date)
], PromoCode.prototype, "validUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'max_uses' }),
    __metadata("design:type", Number)
], PromoCode.prototype, "maxUses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'current_uses' }),
    __metadata("design:type", Number)
], PromoCode.prototype, "currentUses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'min_amount' }),
    __metadata("design:type", Number)
], PromoCode.prototype, "minAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PromoCode.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PromoCode.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PromoCode.prototype, "updatedAt", void 0);
exports.PromoCode = PromoCode = __decorate([
    (0, typeorm_1.Entity)('promo_codes'),
    (0, typeorm_1.Unique)(['code'])
], PromoCode);
