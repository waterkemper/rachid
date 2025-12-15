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
exports.ParticipacaoDespesa = void 0;
const typeorm_1 = require("typeorm");
const Despesa_1 = require("./Despesa");
const Participante_1 = require("./Participante");
let ParticipacaoDespesa = class ParticipacaoDespesa {
};
exports.ParticipacaoDespesa = ParticipacaoDespesa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ParticipacaoDespesa.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Despesa_1.Despesa, despesa => despesa.participacoes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'despesa_id' }),
    __metadata("design:type", Despesa_1.Despesa)
], ParticipacaoDespesa.prototype, "despesa", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], ParticipacaoDespesa.prototype, "despesa_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante, participante => participante.participacoes),
    (0, typeorm_1.JoinColumn)({ name: 'participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], ParticipacaoDespesa.prototype, "participante", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], ParticipacaoDespesa.prototype, "participante_id", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ParticipacaoDespesa.prototype, "valorDevePagar", void 0);
exports.ParticipacaoDespesa = ParticipacaoDespesa = __decorate([
    (0, typeorm_1.Entity)('participacoes_despesa')
], ParticipacaoDespesa);
