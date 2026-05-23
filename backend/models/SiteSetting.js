import { DataTypes } from "sequelize";

export default function defineSiteSetting(sequelize) {
  return sequelize.define(
    "SiteSetting",
    {
      id: {
        allowNull: false,
        defaultValue: 1,
        primaryKey: true,
        type: DataTypes.TINYINT.UNSIGNED,
        validate: {
          isIn: [[1]],
        },
      },
      maintenanceMode: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      maintenanceTitle: {
        allowNull: false,
        defaultValue: "Website temporarily unavailable",
        type: DataTypes.STRING(180),
        validate: {
          notEmpty: { msg: "Maintenance title is required." },
          len: { args: [3, 180], msg: "Maintenance title must be 180 characters or fewer." },
        },
      },
      maintenanceMessage: {
        allowNull: false,
        defaultValue: "We are making a few updates. Please check back soon.",
        type: DataTypes.TEXT,
        validate: {
          notEmpty: { msg: "Maintenance message is required." },
        },
      },
      maintenanceExpectedBack: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      allowUserLogin: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
      allowRegistration: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
    },
    {
      tableName: "site_settings",
      timestamps: true,
    },
  );
}
