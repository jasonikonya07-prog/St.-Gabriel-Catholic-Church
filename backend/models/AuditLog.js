import { DataTypes } from "sequelize";

export default function defineAuditLog(sequelize) {
  return sequelize.define(
    "AuditLog",
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      actorType: {
        allowNull: false,
        defaultValue: "system",
        type: DataTypes.ENUM("admin", "user", "system", "public"),
      },
      actorId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      actorEmail: {
        allowNull: true,
        type: DataTypes.STRING(160),
      },
      action: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: { msg: "Audit action is required." },
        },
      },
      module: {
        allowNull: false,
        defaultValue: "system",
        type: DataTypes.STRING(80),
        validate: {
          notEmpty: { msg: "Audit module is required." },
        },
      },
      description: {
        allowNull: true,
        type: DataTypes.STRING(500),
      },
      entity: {
        allowNull: true,
        type: DataTypes.STRING(80),
      },
      entityId: {
        allowNull: true,
        type: DataTypes.STRING(80),
      },
      ipAddress: {
        allowNull: true,
        type: DataTypes.STRING(64),
      },
      userAgent: {
        allowNull: true,
        type: DataTypes.STRING(500),
      },
      metadata: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [
        { fields: ["actorType"] },
        { fields: ["actorId"] },
        { fields: ["actorEmail"] },
        { fields: ["action"] },
        { fields: ["module"] },
        { fields: ["entity"] },
        { fields: ["ipAddress"] },
        { fields: ["createdAt"] },
      ],
      tableName: "audit_logs",
      timestamps: true,
    },
  );
}
