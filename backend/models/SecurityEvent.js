import { DataTypes } from "sequelize";

export default function defineSecurityEvent(sequelize) {
  return sequelize.define(
    "SecurityEvent",
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      eventType: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: true,
        },
      },
      email: {
        allowNull: true,
        set(value) {
          const email = String(value || "").trim().toLowerCase();
          this.setDataValue("email", email || null);
        },
        type: DataTypes.STRING(160),
        validate: {
          isEmail: true,
        },
      },
      ipAddress: {
        allowNull: true,
        type: DataTypes.STRING(64),
      },
      userAgent: {
        allowNull: true,
        type: DataTypes.STRING(500),
      },
      details: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      severity: {
        allowNull: false,
        defaultValue: "low",
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        validate: {
          isIn: {
            args: [["low", "medium", "high", "critical"]],
            msg: "Security event severity is not supported.",
          },
        },
      },
    },
    {
      createdAt: "createdAt",
      indexes: [
        { fields: ["eventType"] },
        { fields: ["email"] },
        { fields: ["ipAddress"] },
        { fields: ["severity"] },
        { fields: ["createdAt"] },
      ],
      tableName: "security_events",
      timestamps: true,
      updatedAt: false,
    },
  );
}
