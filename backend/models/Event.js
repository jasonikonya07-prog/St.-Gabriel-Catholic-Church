import { DataTypes } from "sequelize";

export const eventCategories = ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"];

export default function defineEvent(sequelize) {
  return sequelize.define(
    "Event",
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
      description: {
        allowNull: false,
        type: DataTypes.TEXT,
        validate: {
          notEmpty: true,
        },
      },
      eventDate: {
        allowNull: false,
        type: DataTypes.DATEONLY,
      },
      startTime: {
        allowNull: false,
        type: DataTypes.STRING(20),
        validate: {
          notEmpty: true,
        },
      },
      endTime: {
        allowNull: true,
        type: DataTypes.STRING(20),
      },
      location: {
        allowNull: false,
        type: DataTypes.STRING(180),
        validate: {
          notEmpty: true,
        },
      },
      category: {
        allowNull: false,
        defaultValue: "Parish",
        type: DataTypes.ENUM(...eventCategories),
      },
      imageUrl: {
        allowNull: true,
        type: DataTypes.STRING(500),
      },
      isFeatured: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      isPublished: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
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
        { fields: ["eventDate"] },
        { fields: ["category"] },
        { fields: ["isPublished"] },
        { fields: ["isFeatured"] },
        { fields: ["createdBy"] },
      ],
      tableName: "events",
      timestamps: true,
    },
  );
}
