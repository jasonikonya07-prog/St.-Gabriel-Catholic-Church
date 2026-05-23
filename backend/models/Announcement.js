import { DataTypes } from "sequelize";

export const announcementCategories = ["Important", "Mass Update", "Youth", "Charity", "Parish News"];

export default function defineAnnouncement(sequelize) {
  return sequelize.define(
    "Announcement",
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      title: {
        allowNull: false,
        type: DataTypes.STRING(180),
        validate: {
          notEmpty: true,
        },
      },
      slug: {
        allowNull: false,
        type: DataTypes.STRING(220),
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      category: {
        allowNull: false,
        defaultValue: "Parish News",
        type: DataTypes.ENUM(...announcementCategories),
      },
      summary: {
        allowNull: false,
        type: DataTypes.STRING(500),
        validate: {
          notEmpty: true,
        },
      },
      content: {
        allowNull: false,
        type: DataTypes.TEXT,
        validate: {
          notEmpty: true,
        },
      },
      imageUrl: {
        allowNull: true,
        type: DataTypes.STRING(500),
      },
      isPublished: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      publishedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          key: "id",
          model: "admins",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      indexes: [
        { fields: ["slug"], unique: true },
        { fields: ["category"] },
        { fields: ["isPublished"] },
        { fields: ["publishedAt"] },
        { fields: ["createdBy"] },
      ],
      tableName: "announcements",
      timestamps: true,
    },
  );
}
