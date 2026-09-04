import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { HttpError } from "../utils/HttpError";
import { NFT } from "../models/NFT";
import { NFTAssignment } from "../models/NFTAssignment";
import { User } from "../models/User";
import { config } from "../config";
import { uploadFileToIpfs, uploadJsonToIpfs } from "../services/ipfsService";
import { mintNft } from "../services/mintingService";
import { sendUnlockEmail } from "../services/notificationService";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth, requireAdmin);

const createNftSchema = z.object({
  tokenId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(""),
});

/** POST /admin/nfts — create NFT metadata (optionally uploading an image to IPFS first). */
router.post(
  "/nfts",
  upload.single("image"),
  validate({ body: createNftSchema }),
  async (req, res, next) => {
    try {
      const { tokenId, name, description } = req.body as z.infer<typeof createNftSchema>;

      let imageUrl = "";
      if (req.file) {
        imageUrl = await uploadFileToIpfs(req.file.buffer, req.file.originalname, req.file.mimetype);
      }

      const metadataUri = await uploadJsonToIpfs({
        name,
        description,
        image: imageUrl,
      });

      const nft = await NFT.create({
        tokenId,
        contractAddress: config.chain.nftContractAddress.toLowerCase() || "0x0",
        name,
        description,
        imageUrl,
        metadataUri,
        mintedBy: req.user!.id,
        status: "minted",
      });

      res.status(201).json(nft);
    } catch (err) {
      next(err);
    }
  }
);

/** POST /admin/nfts/:id/mint — trigger the on-chain mintBatch/mint transaction for an NFT record. */
router.post("/nfts/:id/mint", async (req, res, next) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) throw HttpError.notFound("NFT not found");

    const txHash = await mintNft(nft.tokenId, 1);
    nft.mintTxHash = txHash;
    nft.status = "minted";
    await nft.save();

    res.json(nft);
  } catch (err) {
    next(err);
  }
});

const assignSchema = z.object({
  userId: z.string().min(1),
  unlock: z.boolean().optional().default(false),
});

/** POST /admin/nfts/:id/assign — assign an NFT to a winning user (locked or unlocked). */
router.post("/nfts/:id/assign", validate({ body: assignSchema }), async (req, res, next) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) throw HttpError.notFound("NFT not found");

    const user = await User.findById(req.body.userId);
    if (!user) throw HttpError.notFound("User not found");

    const status = req.body.unlock ? "unlocked" : "locked";
    const assignment = await NFTAssignment.findOneAndUpdate(
      { nftId: nft.id, userId: user.id },
      {
        $setOnInsert: { nftId: nft.id, userId: user.id },
        $set: { status, ...(req.body.unlock ? { unlockedAt: new Date() } : {}) },
      },
      { upsert: true, new: true }
    );

    if (req.body.unlock) {
      nft.status = "unlocked";
      await nft.save();
      await sendUnlockEmail(user.email, nft.name);
    }

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

/** GET /admin/nfts — list all NFT records for the admin dashboard. */
router.get("/nfts", async (_req, res, next) => {
  try {
    const nfts = await NFT.find().sort({ createdAt: -1 });
    res.json(nfts);
  } catch (err) {
    next(err);
  }
});

export default router;
