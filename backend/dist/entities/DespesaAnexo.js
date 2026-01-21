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
exports.DespesaAnexo = void 0;
const typeorm_1 = require("typeorm");
const Despesa_1 = require("./Despesa");
let DespesaAnexo = class DespesaAnexo {
};
exports.DespesaAnexo = DespesaAnexo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Despesa_1.Despesa),
    (0, typeorm_1.JoinColumn)({ name: 'despesa_id' }),
    __metadata("design:type", Despesa_1.Despesa)
], DespesaAnexo.prototype, "despesa", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "despesa_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255 }),
    __metadata("design:type", String)
], DespesaAnexo.prototype, "nome_original", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255 }),
    __metadata("design:type", String)
], DespesaAnexo.prototype, "nome_arquivo", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 100 }),
    __metadata("design:type", String)
], DespesaAnexo.prototype, "tipo_mime", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "tamanho_original", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint', { nullable: true }),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "tamanho_otimizado", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true }),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "largura", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true }),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "altura", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], DespesaAnexo.prototype, "otimizado", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], DespesaAnexo.prototype, "url_s3", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], DespesaAnexo.prototype, "url_cloudfront", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], DespesaAnexo.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' }),
    __metadata("design:type", Date)
], DespesaAnexo.prototype, "criadoEm", void 0);
exports.DespesaAnexo = DespesaAnexo = __decorate([
    (0, typeorm_1.Entity)('despesa_anexos')
], DespesaAnexo);
