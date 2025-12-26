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
exports.Despesa = void 0;
const typeorm_1 = require("typeorm");
const Grupo_1 = require("./Grupo");
const Participante_1 = require("./Participante");
const ParticipacaoDespesa_1 = require("./ParticipacaoDespesa");
const Usuario_1 = require("./Usuario");
const DespesaHistorico_1 = require("./DespesaHistorico");
let Despesa = class Despesa {
};
exports.Despesa = Despesa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Despesa.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario, usuario => usuario.despesas),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], Despesa.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], Despesa.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grupo_1.Grupo, grupo => grupo.despesas),
    (0, typeorm_1.JoinColumn)({ name: 'grupo_id' }),
    __metadata("design:type", Grupo_1.Grupo)
], Despesa.prototype, "grupo", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], Despesa.prototype, "grupo_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], Despesa.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Despesa.prototype, "valorTotal", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante, participante => participante.despesasPagas),
    (0, typeorm_1.JoinColumn)({ name: 'participante_pagador_id' }),
    __metadata("design:type", Participante_1.Participante)
], Despesa.prototype, "pagador", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true }),
    __metadata("design:type", Number)
], Despesa.prototype, "participante_pagador_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Despesa.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Despesa.prototype, "criadoEm", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Despesa.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", Usuario_1.Usuario)
], Despesa.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true }),
    __metadata("design:type", Number)
], Despesa.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParticipacaoDespesa_1.ParticipacaoDespesa, participacao => participacao.despesa, { cascade: true }),
    __metadata("design:type", Array)
], Despesa.prototype, "participacoes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => DespesaHistorico_1.DespesaHistorico, historico => historico.despesa),
    __metadata("design:type", Array)
], Despesa.prototype, "historico", void 0);
exports.Despesa = Despesa = __decorate([
    (0, typeorm_1.Entity)('despesas')
], Despesa);
