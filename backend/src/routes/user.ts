import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { HttpError } from "../utils/HttpError";
import { NFT } from "../models/NFT";
import { NFTAssignment } from "../models/NFTAssignment";
import { User } from "../models/User";
import { config } from "../config";
import { transferNftToUser, getTreasuryAddress } from "../services/mintingService";
import { Interface } from "ethers";
import { NFTCollectionAbi } from "@nft-minting-gui/shared";

const router = Router();
router.use(requireAuth);

/** GET /user/nfts — list NFTs assigned to the logged-in user with their status. */
router.get("/nfts", async (req, res, next) => {
  try {
    const assignments = await NFTAssignment.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    const nftIds = assignments.map((a) => a.nftId);
    const nfts = await NFT.find({ _id: { $in: nftIds } });
    const nftById = new Map(nfts.map((n) => [n.id, n]));

    const results = assignments
      .map((assignment) => ({
        assignment,
        nft: nftById.get(assignment.nftId.toString()),
      }))
      .filter((r) => r.nft);

    res.json(results);
  } catch (err) {
    next(err);
  }
});

const claimModeSchema = z.object({
  mode: z.enum(["prepared_tx", "executed"]).optional().default("prepared_tx"),
});

/**
 * POST /user/nfts/:id/claim — validates the assignment is unlocked and the
 * wallet is linked, then either executes the transfer server-side or returns
 * a prepared (unsigned) transaction for the user to submit via MetaMask.
 */
router.post("/nfts/:id/claim", validate({ body: claimModeSchema }), async (req, res, next) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) throw HttpError.notFound("NFT not found");

    const assignment = await NFTAssignment.findOne({ nftId: nft.id, userId: req.user!.id });
    if (!assignment) throw HttpError.notFound("NFT is not assigned to this user");
    if (assignment.status === "claimed") throw HttpError.conflict("NFT already claimed");
    if (assignment.status !== "unlocked") throw HttpError.badRequest("NFT is not unlocked yet");

    const user = await User.findById(req.user!.id);
    if (!user?.walletAddress) {
      throw HttpError.badRequest("Link your wallet before claiming");
    }

    const { mode } = req.body as z.infer<typeof claimModeSchema>;

    if (mode === "executed") {
      const txHash = await transferNftToUser(nft.tokenId, user.walletAddress, 1);
      assignment.status = "claimed";
      assignment.claimedAt = new Date();
      assignment.claimTxHash = txHash;
      await assignment.save();
      nft.status = "claimed";
      await nft.save();
      return res.json({ mode: "executed", txHash });
    }

    // Safer default: return a prepared, unsigned tx for the user to sign/submit themselves.
    const iface = new Interface(NFTCollectionAbi as unknown as any[]);
    const data = iface.encodeFunctionData("safeTransferFrom", [
      getTreasuryAddress(),
      user.walletAddress,
      nft.tokenId,
      1,
      "0x",
    ]);

    res.json({
      mode: "prepared_tx",
      preparedTx: {
        to: config.chain.nftContractAddress,
        data,
        chainId: config.chain.chainId,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** POST /user/nfts/:id/claim/confirm — records the tx hash after the user submits a prepared tx. */
const confirmSchema = z.object({ txHash: z.string().min(1) });
router.post("/nfts/:id/claim/confirm", validate({ body: confirmSchema }), async (req, res, next) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) throw HttpError.notFound("NFT not found");

    const assignment = await NFTAssignment.findOne({ nftId: nft.id, userId: req.user!.id });
    if (!assignment) throw HttpError.notFound("NFT is not assigned to this user");

    assignment.status = "claimed";
    assignment.claimedAt = new Date();
    assignment.claimTxHash = req.body.txHash;
    await assignment.save();

    nft.status = "claimed";
    await nft.save();

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

export default router;
