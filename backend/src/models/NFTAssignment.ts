import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const nftAssignmentSchema = new Schema(
  {
    nftId: { type: Schema.Types.ObjectId, ref: "NFT", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["locked", "unlocked", "claimed"],
      default: "locked",
      required: true,
    },
    unlockedAt: { type: Date },
    claimedAt: { type: Date },
    claimTxHash: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

nftAssignmentSchema.index({ nftId: 1, userId: 1 }, { unique: true });
nftAssignmentSchema.index({ userId: 1, status: 1 });

export type NFTAssignmentDocument = HydratedDocument<InferSchemaType<typeof nftAssignmentSchema>>;
export const NFTAssignment = model("NFTAssignment", nftAssignmentSchema);
