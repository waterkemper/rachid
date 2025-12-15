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
exports.GrupoMaiorGrupo = void 0;
const typeorm_1 = require("typeorm");
const GrupoMaior_1 = require("./GrupoMaior");
const Grupo_1 = require("./Grupo");
let GrupoMaiorGrupo = class GrupoMaiorGrupo {
};
exports.GrupoMaiorGrupo = GrupoMaiorGrupo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GrupoMaiorGrupo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GrupoMaior_1.GrupoMaior, grupoMaior => grupoMaior.grupos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grupo_maior_id' }),
    __metadata("design:type", GrupoMaior_1.GrupoMaior)
], GrupoMaiorGrupo.prototype, "grupoMaior", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], GrupoMaiorGrupo.prototype, "grupo_maior_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grupo_1.Grupo),
    (0, typeorm_1.JoinColumn)({ name: 'grupo_id' }),
    __metadata("design:type", Grupo_1.Grupo)
], GrupoMaiorGrupo.prototype, "grupo", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], GrupoMaiorGrupo.prototype, "grupo_id", void 0);
exports.GrupoMaiorGrupo = GrupoMaiorGrupo = __decorate([
    (0, typeorm_1.Entity)('grupos_maiores_grupos')
], GrupoMaiorGrupo);
