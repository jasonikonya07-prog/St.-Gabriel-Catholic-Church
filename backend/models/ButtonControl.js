import { DataTypes } from "sequelize";

const buttonKeys = ["donate_now", "view_mass_times", "contact_us", "prayer_request", "newsletter_subscribe"];

export default function defineButtonControl(sequelize) {
  return sequelize.define(
    "ButtonControl",
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      buttonKey: {
        allowNull: false,
        type: DataTypes.ENUM(...buttonKeys),
        unique: true,
        validate: {
          isIn: { args: [buttonKeys], msg: "Button key is not supported." },
        },
      },
      buttonLabel: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: { msg: "Button label is required." },
          len: { args: [1, 120], msg: "Button label must be 120 characters or fewer." },
        },
      },
      isEnabled: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
      disabledReason: {
        allowNull: true,
        type: DataTypes.STRING(255),
        validate: {
          len: { args: [0, 255], msg: "Disabled reason must be 255 characters or fewer." },
        },
      },
      updatedBy: {
        allowNull: true,
        references: {
          key: "id",
          model: "admins",
        },
        type: DataTypes.UUID,
      },
    },
    {
      indexes: [
        { fields: ["buttonKey"], unique: true },
        { fields: ["isEnabled"] },
        { fields: ["updatedBy"] },
        { fields: ["createdAt"] },
      ],
      tableName: "button_controls",
      timestamps: true,
    },
  );
}
