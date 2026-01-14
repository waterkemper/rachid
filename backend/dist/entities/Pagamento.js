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
exports.Pagamento = void 0;
const typeorm_1 = require("typeorm");
const Grupo_1 = require("./Grupo");
const Participante_1 = require("./Participante");
const GrupoParticipantesEvento_1 = require("./GrupoParticipantesEvento");
let Pagamento = class Pagamento {
};
exports.Pagamento = Pagamento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Pagamento.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grupo_1.Grupo, grupo => grupo.pagamentos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grupo_id' }),
    __metadata("design:type", Grupo_1.Grupo)
], Pagamento.prototype, "grupo", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'grupo_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "grupoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'INDIVIDUAL' }),
    __metadata("design:type", String)
], Pagamento.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante, { nullable: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'de_participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], Pagamento.prototype, "deParticipante", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'de_participante_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "deParticipanteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante, { nullable: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'para_participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], Pagamento.prototype, "paraParticipante", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'para_participante_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "paraParticipanteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GrupoParticipantesEvento_1.GrupoParticipantesEvento, { nullable: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'de_grupo_id' }),
    __metadata("design:type", GrupoParticipantesEvento_1.GrupoParticipantesEvento)
], Pagamento.prototype, "grupoDevedor", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'de_grupo_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "deGrupoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GrupoParticipantesEvento_1.GrupoParticipantesEvento, { nullable: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'para_grupo_id' }),
    __metadata("design:type", GrupoParticipantesEvento_1.GrupoParticipantesEvento)
], Pagamento.prototype, "grupoCredor", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'para_grupo_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "paraGrupoId", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, name: 'sugestao_de_nome' }),
    __metadata("design:type", String)
], Pagamento.prototype, "sugestaoDeNome", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, name: 'sugestao_para_nome' }),
    __metadata("design:type", String)
], Pagamento.prototype, "sugestaoParaNome", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, name: 'sugestao_valor' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "sugestaoValor", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'sugestao_index' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "sugestaoIndex", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pago_por_participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], Pagamento.prototype, "pagoPor", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'pago_por_participante_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "pagoPorParticipanteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'confirmado_por_participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], Pagamento.prototype, "confirmadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'confirmado_por_participante_id' }),
    __metadata("design:type", Number)
], Pagamento.prototype, "confirmadoPorParticipanteId", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Pagamento.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'data_pagamento' }),
    __metadata("design:type", Date)
], Pagamento.prototype, "dataPagamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'confirmado_em' }),
    __metadata("design:type", Date)
], Pagamento.prototype, "confirmadoEm", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' }),
    __metadata("design:type", Date)
], Pagamento.prototype, "criadoEm", void 0);
exports.Pagamento = Pagamento = __decorate([
    (0, typeorm_1.Entity)('pagamentos')
], Pagamento);
