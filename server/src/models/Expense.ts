import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ExpenseCategory } from "../../../shared/types/index.ts";

const expenseSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      enum: Object.values(ExpenseCategory),
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

expenseSchema.index({ tripId: 1, category: 1 });
expenseSchema.index({ tripId: 1, paidBy: 1 });

export type ExpenseDocument = InferSchemaType<typeof expenseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Expense = mongoose.model("Expense", expenseSchema);
