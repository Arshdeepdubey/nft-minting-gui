import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const nftSchema = new Schema(
  {
    tokenId: { type: String, required: true },
    contractAddress: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    metadataUri: { type: String, default: "" },
    mintedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mintTxHash: { type: String },
    status: {
      type: String,
      enum: ["minted", "unlocked", "claimed"],
      default: "minted",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

nftSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true });

export type NFTDocument = HydratedDocument<InferSchemaType<typeof nftSchema>>;
export const NFT = model("NFT", nftSchema);
