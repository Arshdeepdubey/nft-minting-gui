import { googleLoginUrl } from "../lib/api";

export function Login() {
  return (
    <div className="page login-page">
      <h1>NFT Minting GUI</h1>
      <p>Sign in to see if you have any unlocked NFTs to claim.</p>
      <a className="button" href={googleLoginUrl()}>
        Sign in with Google
      </a>
    </div>
  );
}
