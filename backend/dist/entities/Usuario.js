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
exports.Usuario = void 0;
const typeorm_1 = require("typeorm");
const Participante_1 = require("./Participante");
const Grupo_1 = require("./Grupo");
const Despesa_1 = require("./Despesa");
let Usuario = class Usuario {
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Usuario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "senha", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true, unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "google_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: 'local' }),
    __metadata("design:type", String)
], Usuario.prototype, "auth_provider", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], Usuario.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "ddd", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "telefone", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true, name: 'chavepix' }),
    __metadata("design:type", String)
], Usuario.prototype, "chavePix", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: 'FREE' }),
    __metadata("design:type", String)
], Usuario.prototype, "plano", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Usuario.prototype, "planoValidoAte", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: 'USER' }),
    __metadata("design:type", String)
], Usuario.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Usuario.prototype, "criadoEm", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Participante_1.Participante, participante => participante.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "participantes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Grupo_1.Grupo, grupo => grupo.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "grupos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Despesa_1.Despesa, despesa => despesa.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "despesas", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], Usuario);
