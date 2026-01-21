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
exports.Email = void 0;
const typeorm_1 = require("typeorm");
const Usuario_1 = require("./Usuario");
const Grupo_1 = require("./Grupo");
const Despesa_1 = require("./Despesa");
let Email = class Email {
};
exports.Email = Email;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Email.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255 }),
    __metadata("design:type", String)
], Email.prototype, "destinatario", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 500 }),
    __metadata("design:type", String)
], Email.prototype, "assunto", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, name: 'tipo_email' }),
    __metadata("design:type", String)
], Email.prototype, "tipoEmail", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 20, default: 'pendente' }),
    __metadata("design:type", String)
], Email.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], Email.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'usuario_id' }),
    __metadata("design:type", Number)
], Email.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grupo_1.Grupo, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'evento_id' }),
    __metadata("design:type", Grupo_1.Grupo)
], Email.prototype, "evento", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'evento_id' }),
    __metadata("design:type", Number)
], Email.prototype, "eventoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Despesa_1.Despesa, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'despesa_id' }),
    __metadata("design:type", Despesa_1.Despesa)
], Email.prototype, "despesa", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { nullable: true, name: 'despesa_id' }),
    __metadata("design:type", Number)
], Email.prototype, "despesaId", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true, name: 'corpo_html' }),
    __metadata("design:type", String)
], Email.prototype, "corpoHtml", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true, name: 'corpo_texto' }),
    __metadata("design:type", String)
], Email.prototype, "corpoTexto", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, nullable: true, name: 'remetente_email' }),
    __metadata("design:type", String)
], Email.prototype, "remetenteEmail", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, nullable: true, name: 'remetente_nome' }),
    __metadata("design:type", String)
], Email.prototype, "remetenteNome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'enviado_em' }),
    __metadata("design:type", Date)
], Email.prototype, "enviadoEm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'falhou_em' }),
    __metadata("design:type", Date)
], Email.prototype, "falhouEm", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { default: 0 }),
    __metadata("design:type", Number)
], Email.prototype, "tentativas", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true, name: 'erro_message' }),
    __metadata("design:type", String)
], Email.prototype, "erroMessage", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true, name: 'erro_detalhes' }),
    __metadata("design:type", Object)
], Email.prototype, "erroDetalhes", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, nullable: true, name: 'sendgrid_message_id' }),
    __metadata("design:type", String)
], Email.prototype, "sendgridMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true, name: 'sendgrid_response' }),
    __metadata("design:type", Object)
], Email.prototype, "sendgridResponse", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' }),
    __metadata("design:type", Date)
], Email.prototype, "criadoEm", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'atualizado_em' }),
    __metadata("design:type", Date)
], Email.prototype, "atualizadoEm", void 0);
exports.Email = Email = __decorate([
    (0, typeorm_1.Entity)('emails'),
    (0, typeorm_1.Index)(['destinatario']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['tipoEmail']),
    (0, typeorm_1.Index)(['usuarioId']),
    (0, typeorm_1.Index)(['eventoId']),
    (0, typeorm_1.Index)(['despesaId']),
    (0, typeorm_1.Index)(['enviadoEm']),
    (0, typeorm_1.Index)(['criadoEm']),
    (0, typeorm_1.Index)(['sendgridMessageId'])
], Email);
