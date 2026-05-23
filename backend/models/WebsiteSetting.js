import { DataTypes } from "sequelize";

export default function defineWebsiteSetting(sequelize) {
  return sequelize.define(
    "WebsiteSetting",
    {
      settingKey: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(80),
      },
      settingValue: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [{ fields: ["settingKey"], unique: true }],
      tableName: "website_settings",
      timestamps: true,
    },
  );
}
