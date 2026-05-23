import bcrypt from "bcryptjs";
import { DataTypes } from "sequelize";

const passwordHashRegex = /^\$2[aby]\$\d{2}\$/;

export default function defineUser(sequelize) {
  const User = sequelize.define(
    "User",
    {
      id: {
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      fullName: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: { msg: "Full name is required." },
          len: { args: [2, 120], msg: "Full name must be between 2 and 120 characters." },
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
      phone: {
        allowNull: true,
        type: DataTypes.STRING(40),
        validate: {
          len: { args: [0, 40], msg: "Phone must be 40 characters or fewer." },
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
        defaultValue: "user",
        type: DataTypes.ENUM("user", "admin", "editor"),
      },
      isActive: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
      emailVerified: {
        allowNull: false,
        defaultValue: false,
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
        beforeSave: async (user) => {
          if (!user.changed("password")) return;
          if (passwordHashRegex.test(String(user.password || ""))) return;

          const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
          user.password = await bcrypt.hash(user.password, saltRounds);
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
      tableName: "users",
      timestamps: true,
    },
  );

  User.prototype.comparePassword = function comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(String(candidatePassword || ""), this.password);
  };

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
}
