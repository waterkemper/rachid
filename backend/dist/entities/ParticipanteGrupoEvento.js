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
exports.ParticipanteGrupoEvento = void 0;
const typeorm_1 = require("typeorm");
const Participante_1 = require("./Participante");
const GrupoParticipantesEvento_1 = require("./GrupoParticipantesEvento");
let ParticipanteGrupoEvento = class ParticipanteGrupoEvento {
};
exports.ParticipanteGrupoEvento = ParticipanteGrupoEvento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ParticipanteGrupoEvento.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GrupoParticipantesEvento_1.GrupoParticipantesEvento, grupo => grupo.participantes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grupo_participantes_evento_id' }),
    __metadata("design:type", GrupoParticipantesEvento_1.GrupoParticipantesEvento)
], ParticipanteGrupoEvento.prototype, "grupoParticipantes", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'grupo_participantes_evento_id' }),
    __metadata("design:type", Number)
], ParticipanteGrupoEvento.prototype, "grupoParticipantesEventoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participante_1.Participante),
    (0, typeorm_1.JoinColumn)({ name: 'participante_id' }),
    __metadata("design:type", Participante_1.Participante)
], ParticipanteGrupoEvento.prototype, "participante", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'participante_id' }),
    __metadata("design:type", Number)
], ParticipanteGrupoEvento.prototype, "participanteId", void 0);
exports.ParticipanteGrupoEvento = ParticipanteGrupoEvento = __decorate([
    (0, typeorm_1.Entity)('participantes_grupo_evento')
], ParticipanteGrupoEvento);
