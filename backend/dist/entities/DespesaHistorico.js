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
exports.DespesaHistorico = void 0;
const typeorm_1 = require("typeorm");
const Despesa_1 = require("./Despesa");
const Usuario_1 = require("./Usuario");
let DespesaHistorico = class DespesaHistorico {
};
exports.DespesaHistorico = DespesaHistorico;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DespesaHistorico.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Despesa_1.Despesa, despesa => despesa.historico, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'despesa_id' }),
    __metadata("design:type", Despesa_1.Despesa)
], DespesaHistorico.prototype, "despesa", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], DespesaHistorico.prototype, "despesa_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], DespesaHistorico.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], DespesaHistorico.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], DespesaHistorico.prototype, "campo_alterado", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], DespesaHistorico.prototype, "valor_anterior", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], DespesaHistorico.prototype, "valor_novo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'criadoem' }),
    __metadata("design:type", Date)
], DespesaHistorico.prototype, "criadoEm", void 0);
exports.DespesaHistorico = DespesaHistorico = __decorate([
    (0, typeorm_1.Entity)('despesas_historico')
], DespesaHistorico);
