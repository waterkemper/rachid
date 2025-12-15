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
exports.GrupoMaior = void 0;
const typeorm_1 = require("typeorm");
const Usuario_1 = require("./Usuario");
const GrupoMaiorGrupo_1 = require("./GrupoMaiorGrupo");
const GrupoMaiorParticipante_1 = require("./GrupoMaiorParticipante");
let GrupoMaior = class GrupoMaior {
};
exports.GrupoMaior = GrupoMaior;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GrupoMaior.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], GrupoMaior.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], GrupoMaior.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], GrupoMaior.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], GrupoMaior.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GrupoMaior.prototype, "criadoEm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], GrupoMaior.prototype, "ultimoUsoEm", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GrupoMaiorGrupo_1.GrupoMaiorGrupo, grupoMaiorGrupo => grupoMaiorGrupo.grupoMaior),
    __metadata("design:type", Array)
], GrupoMaior.prototype, "grupos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GrupoMaiorParticipante_1.GrupoMaiorParticipante, grupoMaiorParticipante => grupoMaiorParticipante.grupoMaior),
    __metadata("design:type", Array)
], GrupoMaior.prototype, "participantes", void 0);
exports.GrupoMaior = GrupoMaior = __decorate([
    (0, typeorm_1.Entity)('grupos_maiores')
], GrupoMaior);
