import { DataTypes } from "sequelize";

export const prayerCategories = ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request", "Other"];
export const prayerStatuses = ["pending", "prayed", "archived"];

export default function definePrayerRequest(sequelize) {
  return sequelize.define(
    "PrayerRequest",
    {
      id: {
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      userId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      fullName: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: true,
        },
      },
      contact: {
        allowNull: false,
        type: DataTypes.STRING(160),
        validate: {
          notEmpty: true,
        },
      },
      category: {
        allowNull: false,
        defaultValue: "Private Request",
        type: DataTypes.ENUM(...prayerCategories),
      },
      message: {
        allowNull: false,
        type: DataTypes.TEXT,
        validate: {
          len: [10, 2000],
          notEmpty: true,
        },
      },
      isPrivate: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
      status: {
        allowNull: false,
        defaultValue: "pending",
        type: DataTypes.ENUM(...prayerStatuses),
      },
      adminNotes: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [
        { fields: ["userId"] },
        { fields: ["category"] },
        { fields: ["status"] },
        { fields: ["isPrivate"] },
        { fields: ["createdAt"] },
      ],
      tableName: "prayer_requests",
      timestamps: true,
    },
  );
}
