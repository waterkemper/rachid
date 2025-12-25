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
exports.PasswordResetToken = void 0;
const typeorm_1 = require("typeorm");
const Usuario_1 = require("./Usuario");
let PasswordResetToken = class PasswordResetToken {
};
exports.PasswordResetToken = PasswordResetToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PasswordResetToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { unique: true }),
    __metadata("design:type", String)
], PasswordResetToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], PasswordResetToken.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Usuario_1.Usuario)
], PasswordResetToken.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PasswordResetToken.prototype, "expiraEm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PasswordResetToken.prototype, "usado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PasswordResetToken.prototype, "criadoEm", void 0);
exports.PasswordResetToken = PasswordResetToken = __decorate([
    (0, typeorm_1.Entity)('password_reset_tokens')
], PasswordResetToken);
