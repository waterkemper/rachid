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
exports.EmailPendente = void 0;
const typeorm_1 = require("typeorm");
const Usuario_1 = require("./Usuario");
const Grupo_1 = require("./Grupo");
const Email_1 = require("./Email");
let EmailPendente = class EmailPendente {
};
exports.EmailPendente = EmailPendente;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EmailPendente.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255 }),
    __metadata("design:type", String)
], EmailPendente.prototype, "destinatario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'usuario_id' }),
    __metadata("design:type", Number)
], EmailPendente.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], EmailPendente.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'evento_id' }),
    __metadata("design:type", Number)
], EmailPendente.prototype, "eventoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grupo_1.Grupo, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'evento_id' }),
    __metadata("design:type", Grupo_1.Grupo)
], EmailPendente.prototype, "evento", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, name: 'tipo_notificacao' }),
    __metadata("design:type", String)
], EmailPendente.prototype, "tipoNotificacao", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { default: {} }),
    __metadata("design:type", Object)
], EmailPendente.prototype, "dados", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'criado_em', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], EmailPendente.prototype, "criadoEm", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamp with time zone', { name: 'processar_apos' }),
    __metadata("design:type", Date)
], EmailPendente.prototype, "processarApos", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], EmailPendente.prototype, "processado", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamp with time zone', { nullable: true, name: 'processado_em' }),
    __metadata("design:type", Date)
], EmailPendente.prototype, "processadoEm", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'email_enviado_id' }),
    __metadata("design:type", Number)
], EmailPendente.prototype, "emailEnviadoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Email_1.Email, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'email_enviado_id' }),
    __metadata("design:type", Email_1.Email)
], EmailPendente.prototype, "emailEnviado", void 0);
exports.EmailPendente = EmailPendente = __decorate([
    (0, typeorm_1.Entity)('email_pendentes'),
    (0, typeorm_1.Index)(['processado', 'processarApos']),
    (0, typeorm_1.Index)(['destinatario', 'eventoId', 'processado']),
    (0, typeorm_1.Index)(['tipoNotificacao', 'processado'])
], EmailPendente);
