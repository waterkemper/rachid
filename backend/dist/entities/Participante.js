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
exports.Participante = void 0;
const typeorm_1 = require("typeorm");
const ParticipacaoDespesa_1 = require("./ParticipacaoDespesa");
const Despesa_1 = require("./Despesa");
const ParticipanteGrupo_1 = require("./ParticipanteGrupo");
const Usuario_1 = require("./Usuario");
let Participante = class Participante {
};
exports.Participante = Participante;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Participante.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario, usuario => usuario.participantes),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], Participante.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], Participante.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], Participante.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], Participante.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], Participante.prototype, "chavePix", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], Participante.prototype, "telefone", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Participante.prototype, "criadoEm", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParticipacaoDespesa_1.ParticipacaoDespesa, participacao => participacao.participante),
    __metadata("design:type", Array)
], Participante.prototype, "participacoes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Despesa_1.Despesa, despesa => despesa.pagador),
    __metadata("design:type", Array)
], Participante.prototype, "despesasPagas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParticipanteGrupo_1.ParticipanteGrupo, participanteGrupo => participanteGrupo.participante),
    __metadata("design:type", Array)
], Participante.prototype, "grupos", void 0);
exports.Participante = Participante = __decorate([
    (0, typeorm_1.Entity)('participantes')
], Participante);
