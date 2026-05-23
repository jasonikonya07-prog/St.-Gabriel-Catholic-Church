import { DataTypes } from "sequelize";

export const donationPurposes = ["Tithe", "Church Development", "Charity", "Youth Ministry", "Mass Offering", "Other"];
export const paymentMethods = ["M-Pesa", "Card", "Bank Transfer"];
export const donationStatuses = ["pending", "completed", "failed", "cancelled"];

export default function defineDonation(sequelize) {
  return sequelize.define(
    "Donation",
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      userId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      donorName: {
        allowNull: false,
        type: DataTypes.STRING(120),
        validate: {
          notEmpty: true,
        },
      },
      phone: {
        allowNull: false,
        type: DataTypes.STRING(40),
        validate: {
          notEmpty: true,
        },
      },
      email: {
        allowNull: true,
        set(value) {
          this.setDataValue("email", value ? String(value).trim().toLowerCase() : null);
        },
        type: DataTypes.STRING(160),
        validate: {
          isEmail: true,
        },
      },
      amount: {
        allowNull: false,
        type: DataTypes.DECIMAL(12, 2),
        validate: {
          min: 1,
        },
      },
      purpose: {
        allowNull: false,
        type: DataTypes.ENUM(...donationPurposes),
      },
      paymentMethod: {
        allowNull: false,
        type: DataTypes.ENUM(...paymentMethods),
      },
      status: {
        allowNull: false,
        defaultValue: "pending",
        type: DataTypes.ENUM(...donationStatuses),
      },
      transactionCode: {
        allowNull: false,
        type: DataTypes.STRING(100),
        unique: true,
      },
      checkoutRequestId: {
        allowNull: true,
        type: DataTypes.STRING(120),
      },
      mpesaReceiptNumber: {
        allowNull: true,
        type: DataTypes.STRING(100),
      },
      message: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [
        { fields: ["userId"] },
        { fields: ["transactionCode"], unique: true },
        { fields: ["checkoutRequestId"] },
        { fields: ["mpesaReceiptNumber"] },
        { fields: ["purpose"] },
        { fields: ["paymentMethod"] },
        { fields: ["status"] },
        { fields: ["createdAt"] },
      ],
      tableName: "donations",
      timestamps: true,
    },
  );
}
