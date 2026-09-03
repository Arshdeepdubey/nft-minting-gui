import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    ssoProvider: { type: String, enum: ["google", "github"], required: true },
    ssoId: { type: String, required: true },
    walletAddress: { type: String, lowercase: true },
    walletNonce: { type: String },
    refreshTokenHash: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.index({ ssoProvider: 1, ssoId: 1 }, { unique: true });
userSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model("User", userSchema);
