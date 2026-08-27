import { ConnectWallet } from "@/components/ConnectWallet";
import { ClaimVoucher } from "@/components/ClaimVoucher";

export default function Home() {
  return (
    <main>
      <h1>Claim Your Win</h1>
      <p>Connect your wallet to check for claimable NFT vouchers.</p>
      <ConnectWallet />
      <ClaimVoucher />
    </main>
  );
}
