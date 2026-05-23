import { DataTypes } from "sequelize";

export const contactStatuses = ["unread", "read", "replied"];

export default function defineContactMessage(sequelize) {
  return sequelize.define(
    "ContactMessage",
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
      email: {
        allowNull: false,
        set(value) {
          this.setDataValue("email", String(value || "").trim().toLowerCase());
        },
        type: DataTypes.STRING(160),
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      phone: {
        allowNull: true,
        type: DataTypes.STRING(40),
      },
      subject: {
        allowNull: false,
        defaultValue: "Website inquiry",
        type: DataTypes.STRING(180),
        validate: {
          notEmpty: true,
        },
      },
      message: {
        allowNull: false,
        type: DataTypes.TEXT,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        allowNull: false,
        defaultValue: "unread",
        type: DataTypes.ENUM(...contactStatuses),
      },
      adminNotes: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [
        { fields: ["userId"] },
        { fields: ["email"] },
        { fields: ["fullName"] },
        { fields: ["status"] },
        { fields: ["createdAt"] },
      ],
      tableName: "contact_messages",
      timestamps: true,
    },
  );
}
