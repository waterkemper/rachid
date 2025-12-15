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
exports.GrupoMaiorParticipante = void 0;
const typeorm_1 = require("typeorm");
const GrupoMaior_1 = require("./GrupoMaior");
const Participante_1 = require("./Participante");
let GrupoMaiorParticipante = class GrupoMaiorParticipante {
};
exports.GrupoMaiorParticipante = GrupoMaiorParticipante;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GrupoMaiorParticipante.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GrupoMaior_1.GrupoMaior, grupoMaior => grupoMaior.participantes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grupo_maior_id' }),
    __metadata("design:type", GrupoMaior_1.GrupoMaior)
], GrupoMaiorParticipante.prototype, "grupoMaior", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], GrupoMaiorParticipante.prototype, "grupo_maior_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante),
    (0, typeorm_1.JoinColumn)({ name: 'participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], GrupoMaiorParticipante.prototype, "participante", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], GrupoMaiorParticipante.prototype, "participante_id", void 0);
exports.GrupoMaiorParticipante = GrupoMaiorParticipante = __decorate([
    (0, typeorm_1.Entity)('grupos_maiores_participantes')
], GrupoMaiorParticipante);
