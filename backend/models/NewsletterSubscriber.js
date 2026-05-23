import { DataTypes } from "sequelize";

export default function defineNewsletterSubscriber(sequelize) {
  return sequelize.define(
    "NewsletterSubscriber",
    {
      id: {
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      email: {
        allowNull: false,
        set(value) {
          this.setDataValue("email", String(value || "").trim().toLowerCase());
        },
        type: DataTypes.STRING(160),
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      fullName: {
        allowNull: true,
        type: DataTypes.STRING(120),
      },
      isSubscribed: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
      source: {
        allowNull: false,
        defaultValue: "website",
        type: DataTypes.STRING(80),
      },
    },
    {
      indexes: [{ fields: ["email"], unique: true }, { fields: ["isSubscribed"] }, { fields: ["createdAt"] }],
      tableName: "newsletter_subscribers",
      timestamps: true,
    },
  );
}
