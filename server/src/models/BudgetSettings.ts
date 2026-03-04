import mongoose, { Schema, type InferSchemaType } from "mongoose";

const budgetSettingsSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
    },
    totalBudget: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export type BudgetSettingsDocument = InferSchemaType<
  typeof budgetSettingsSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const BudgetSettings = mongoose.model(
  "BudgetSettings",
  budgetSettingsSchema,
);
