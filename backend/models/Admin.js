import bcrypt from "bcryptjs";
import { DataTypes } from "sequelize";

const passwordHashRegex = /^\$2[aby]\$\d{2}\$/;

export default function defineAdmin(sequelize) {
  const Admin = sequelize.define(
    "Admin",
    {
      id: {
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: { msg: "Admin name is required." },
          len: { args: [2, 120], msg: "Admin name must be between 2 and 120 characters." },
        },
      },
      email: {
        allowNull: false,
        set(value) {
          this.setDataValue("email", String(value || "").trim().toLowerCase());
        },
        type: DataTypes.STRING(160),
        unique: true,
        validate: {
          isEmail: { msg: "Email must be valid." },
          notEmpty: { msg: "Email is required." },
        },
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING(255),
        validate: {
          len: { args: [8, 255], msg: "Password must be at least 8 characters." },
          notEmpty: { msg: "Password is required." },
        },
      },
      role: {
        allowNull: false,
        defaultValue: "admin",
        type: DataTypes.ENUM("super_admin", "admin", "editor"),
      },
      isActive: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
      lastLogin: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      failedLoginAttempts: {
        allowNull: false,
        defaultValue: 0,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      lockUntil: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      hooks: {
        beforeSave: async (admin) => {
          if (!admin.changed("password")) return;
          if (passwordHashRegex.test(String(admin.password || ""))) return;

          const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
          admin.password = await bcrypt.hash(admin.password, saltRounds);
        },
      },
      indexes: [
        { fields: ["email"], unique: true },
        { fields: ["role"] },
        { fields: ["isActive"] },
        { fields: ["lockUntil"] },
        { fields: ["createdAt"] },
      ],
      scopes: {
        withPassword: {
          attributes: { include: ["password"] },
        },
      },
      tableName: "admins",
      timestamps: true,
    },
  );

  Admin.prototype.comparePassword = function comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(String(candidatePassword || ""), this.password);
  };

  Admin.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return Admin;
}
