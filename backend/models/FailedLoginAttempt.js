import { DataTypes } from "sequelize";

export default function defineFailedLoginAttempt(sequelize) {
  return sequelize.define(
    "FailedLoginAttempt",
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      scope: {
        allowNull: false,
        type: DataTypes.ENUM("admin", "user"),
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING(160),
      },
      ipAddress: {
        allowNull: true,
        type: DataTypes.STRING(64),
      },
      userAgent: {
        allowNull: true,
        type: DataTypes.STRING(500),
      },
      reason: {
        allowNull: false,
        type: DataTypes.STRING(120),
      },
    },
    {
      indexes: [{ fields: ["scope"] }, { fields: ["email"] }, { fields: ["ipAddress"] }, { fields: ["createdAt"] }],
      tableName: "failed_login_attempts",
      timestamps: true,
    },
  );
}
