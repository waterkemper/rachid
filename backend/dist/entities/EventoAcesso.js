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
exports.EventoAcesso = void 0;
const typeorm_1 = require("typeorm");
const Grupo_1 = require("./Grupo");
let EventoAcesso = class EventoAcesso {
};
exports.EventoAcesso = EventoAcesso;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EventoAcesso.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grupo_1.Grupo),
    (0, typeorm_1.JoinColumn)({ name: 'evento_id' }),
    __metadata("design:type", Grupo_1.Grupo)
], EventoAcesso.prototype, "evento", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], EventoAcesso.prototype, "evento_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], EventoAcesso.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], EventoAcesso.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'acessado_em' }),
    __metadata("design:type", Date)
], EventoAcesso.prototype, "acessadoEm", void 0);
exports.EventoAcesso = EventoAcesso = __decorate([
    (0, typeorm_1.Entity)('evento_acessos')
], EventoAcesso);
