import { Router } from "express";
import { z } from "zod";
import "../services/passportGoogle";
import { passport } from "../services/passportGoogle";
import { config } from "../config";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { HttpError } from "../utils/HttpError";
import { User, type UserDocument } from "../models/User";
import { issueTokens, rotateRefreshToken, revokeRefreshToken } from "../services/authService";
import { createWalletLinkNonce, verifyAndLinkWallet } from "../services/walletLinkService";

const router = Router();

router.get("/google", passport.authenticate("google", { session: false, scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${config.frontendUrl}/login?error=1` }),
  async (req, res, next) => {
    try {
      const user = req.user as UserDocument;
      const { accessToken, refreshToken } = await issueTokens(user);
      const redirectUrl = new URL("/auth/callback", config.frontendUrl);
      redirectUrl.searchParams.set("accessToken", accessToken);
      redirectUrl.searchParams.set("refreshToken", refreshToken);
      res.redirect(redirectUrl.toString());
    } catch (err) {
      next(err);
    }
  }
);

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

router.post("/refresh", validate({ body: refreshSchema }), async (req, res, next) => {
  try {
    const tokens = await rotateRefreshToken(req.body.refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await revokeRefreshToken(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/wallet/nonce", requireAuth, async (req, res, next) => {
  try {
    const result = await createWalletLinkNonce(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const walletVerifySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().min(1),
});

router.post(
  "/wallet/verify",
  requireAuth,
  validate({ body: walletVerifySchema }),
  async (req, res, next) => {
    try {
      const { walletAddress, signature } = req.body;
      const user = await verifyAndLinkWallet(req.user!.id, walletAddress, signature);
      res.json({ walletAddress: user.walletAddress });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw HttpError.notFound("User not found");
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
